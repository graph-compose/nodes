import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { StorageService } from "../../../services/storage.service";
import { TempFileService } from "../../video/services/temp-file";
import {
  AudioConcatData,
  AudioConcatRequestSchema,
} from "../schemas/concatSchemas";

/** Maximum atempo factor per filter. FFmpeg atempo is limited to [0.5, 2.0] per filter instance. */
const MAX_ATEMPO_PER_FILTER = 2.0;

export class AudioConcatService {
  private storageService: StorageService;
  private tempFileService: TempFileService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.tempFileService = new TempFileService();
  }

  private async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ]);

      let stdout = "";
      ffprobe.stdout.on("data", d => {
        stdout += d.toString();
      });
      ffprobe.on("close", code => {
        if (code === 0)
          resolve(isNaN(parseFloat(stdout)) ? 0 : parseFloat(stdout.trim()));
        else reject(new Error(`ffprobe failed with code ${code}`));
      });
      ffprobe.on("error", err =>
        reject(new Error(`Failed to spawn ffprobe: ${err.message}`)),
      );
    });
  }

  private buildAtempoFilter(speedFactor: number): string {
    // FFmpeg atempo is clamped to [0.5, 2.0] per instance.
    // For factors outside that range, chain multiple atempo filters.
    const filters: string[] = [];
    let remaining = speedFactor;

    while (remaining > MAX_ATEMPO_PER_FILTER) {
      filters.push(`atempo=${MAX_ATEMPO_PER_FILTER}`);
      remaining /= MAX_ATEMPO_PER_FILTER;
    }
    while (remaining < 0.5) {
      filters.push(`atempo=0.5`);
      remaining /= 0.5;
    }
    filters.push(`atempo=${remaining.toFixed(6)}`);
    return filters.join(",");
  }

  /**
   * Fits an audio file to a target duration by either padding with silence or speeding it up.
   * Returns the path to the fitted audio file (caller is responsible for cleanup).
   */
  private async fitAudioToTargetDuration(
    inputPath: string,
    targetDuration: number,
    tempDir: string,
  ): Promise<string> {
    const actualDuration = await this.getAudioDuration(inputPath);
    const outputPath = path.join(tempDir, `fitted-${uuidv4()}.mp3`);

    const diff = targetDuration - actualDuration;
    const TOLERANCE_SECONDS = 0.1; // Don't bother fitting if within 100ms

    if (Math.abs(diff) <= TOLERANCE_SECONDS) {
      // Already within tolerance — copy as-is
      await fs.promises.copyFile(inputPath, outputPath);
      return outputPath;
    }

    let audioFilter: string;

    if (diff > 0) {
      // TTS is shorter than original — pad with silence at the end
      const padDuration = diff.toFixed(6);
      audioFilter = `apad=pad_dur=${padDuration}`;
      console.log(
        `[AudioConcatService] Padding ${actualDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s (+${diff.toFixed(2)}s silence)`,
      );
    } else {
      // TTS is longer than original — speed up to fit
      const speedFactor = actualDuration / targetDuration;
      const MAX_ACCEPTABLE_SPEED = 4.0;

      if (speedFactor > MAX_ACCEPTABLE_SPEED) {
        // Too much distortion — accept as-is rather than destroy intelligibility
        console.warn(
          `[AudioConcatService] Speed factor ${speedFactor.toFixed(2)}× exceeds max ${MAX_ACCEPTABLE_SPEED}×. Accepting audio as-is.`,
        );
        await fs.promises.copyFile(inputPath, outputPath);
        return outputPath;
      }

      audioFilter = this.buildAtempoFilter(speedFactor);
      console.log(
        `[AudioConcatService] Speeding up ${actualDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s (${speedFactor.toFixed(2)}× via ${audioFilter})`,
      );
    }

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i",
        inputPath,
        "-af",
        audioFilter,
        "-hide_banner",
        "-loglevel",
        "error",
        outputPath,
      ]);
      let stderr = "";
      ffmpeg.stderr.on("data", d => {
        stderr += d.toString();
      });
      ffmpeg.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg fit failed (code ${code}): ${stderr}`));
      });
      ffmpeg.on("error", err =>
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`)),
      );
    });

    return outputPath;
  }

  private async runConcat(
    listFilePath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listFilePath,
        "-c",
        "copy",
        "-hide_banner",
        "-loglevel",
        "error",
        outputPath,
      ]);
      let stderr = "";
      ffmpeg.stderr.on("data", d => {
        stderr += d.toString();
      });
      ffmpeg.on("close", code => {
        if (code === 0) resolve();
        else
          reject(new Error(`FFmpeg concat failed (code ${code}): ${stderr}`));
      });
      ffmpeg.on("error", err =>
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`)),
      );
    });
  }

  async concat(
    params: z.infer<typeof AudioConcatRequestSchema>,
  ): Promise<AudioConcatData> {
    const { audioUrls, targetDurations } = params;
    const fittingApplied = !!targetDurations && targetDurations.length > 0;

    if (fittingApplied && targetDurations!.length !== audioUrls.length) {
      throw new Error(
        `targetDurations length (${targetDurations!.length}) must match audioUrls length (${audioUrls.length}).`,
      );
    }

    const tempDir = path.join(os.tmpdir(), `audio-concat-${uuidv4()}`);
    const tempFiles: string[] = [];

    try {
      await fs.promises.mkdir(tempDir, { recursive: true });

      // 1. Download all audio files
      const rawPaths: string[] = [];
      for (let i = 0; i < audioUrls.length; i++) {
        console.log(
          `[AudioConcatService] Downloading chunk ${i + 1}/${audioUrls.length}`,
        );
        const tmpPath = await this.tempFileService.downloadToTemp(
          audioUrls[i],
          `audio-raw-${i}-`,
        );
        const withExt = await this.tempFileService.renameWithExtension(
          tmpPath,
          "mp3",
        );
        tempFiles.push(withExt);
        rawPaths.push(withExt);
      }

      // 2. Optionally fit each chunk to its target duration
      const readyPaths: string[] = [];
      if (fittingApplied) {
        console.log(
          `[AudioConcatService] Applying timing fitting to ${audioUrls.length} chunks...`,
        );
        for (let i = 0; i < rawPaths.length; i++) {
          const fittedPath = await this.fitAudioToTargetDuration(
            rawPaths[i],
            targetDurations![i],
            tempDir,
          );
          if (fittedPath !== rawPaths[i]) {
            tempFiles.push(fittedPath);
          }
          readyPaths.push(fittedPath);
        }
      } else {
        readyPaths.push(...rawPaths);
      }

      // 3. Write FFmpeg concat list
      const listFilePath = path.join(tempDir, "filelist.txt");
      const listContent = readyPaths.map(p => `file '${p}'`).join("\n");
      await fs.promises.writeFile(listFilePath, listContent, "utf-8");
      tempFiles.push(listFilePath);
      console.log(
        `[AudioConcatService] Concatenating ${readyPaths.length} audio files...`,
      );

      // 4. Run FFmpeg concat
      const outputPath = path.join(tempDir, `concat-${uuidv4()}.mp3`);
      tempFiles.push(outputPath);
      await this.runConcat(listFilePath, outputPath);

      // 5. Get final duration
      const duration = await this.getAudioDuration(outputPath);

      // 6. Upload to GCS
      console.log(`[AudioConcatService] Uploading result to GCS...`);
      const audioUrl = await this.storageService.uploadFromPath(
        outputPath,
        "audio/mpeg",
        "audio-concat",
      );
      console.log(
        `[AudioConcatService] Done: ${audioUrl} (${duration.toFixed(2)}s)`,
      );

      return {
        audioUrl,
        duration,
        totalFiles: audioUrls.length,
        fittingApplied,
      };
    } catch (error) {
      console.error("[AudioConcatService] Error:", error);
      throw error instanceof Error
        ? error
        : new Error("Unknown error during audio concatenation.");
    } finally {
      try {
        await this.tempFileService.cleanupMany(tempFiles);
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn(`[AudioConcatService] Cleanup failed:`, cleanupError);
      }
    }
  }
}
