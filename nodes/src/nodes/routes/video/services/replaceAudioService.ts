import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { StorageService } from "../../../services/storage.service";
import { ReplaceAudioData, ReplaceAudioRequestSchema } from "../schemas/replaceAudioSchemas";
import { TempFileService } from "./temp-file";

export class ReplaceAudioService {
  private storageService: StorageService;
  private tempFileService: TempFileService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.tempFileService = new TempFileService();
  }

  /**
   * Probes a video file to get its duration using ffprobe.
   */
  private async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        videoPath,
      ]);

      let stdout = "";
      let stderr = "";
      ffprobe.stdout.on("data", (data) => { stdout += data.toString(); });
      ffprobe.stderr.on("data", (data) => { stderr += data.toString(); });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          const duration = parseFloat(stdout.trim());
          resolve(isNaN(duration) ? 0 : duration);
        } else {
          reject(new Error(`ffprobe failed with code ${code}. Stderr: ${stderr}`));
        }
      });

      ffprobe.on("error", (err) => {
        reject(new Error(`Failed to spawn ffprobe: ${err.message}`));
      });
    });
  }

  /**
   * Replaces the audio track of a video with a new audio file using FFmpeg.
   * The video stream is copied without re-encoding. Output is trimmed to
   * the shorter of the two streams via -shortest.
   */
  private async mergeAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i", videoPath,
        "-i", audioPath,
        "-c:v", "copy",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        "-hide_banner",
        "-loglevel", "error",
        outputPath,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (data) => { stderr += data.toString(); });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`FFmpeg audio replacement failed with code ${code}. Stderr: ${stderr}`),
          );
        }
      });

      ffmpeg.on("error", (err) => {
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Downloads a video and replacement audio, merges them, uploads to GCS,
   * and returns the result.
   */
  async replaceAudio(
    params: z.infer<typeof ReplaceAudioRequestSchema>,
  ): Promise<ReplaceAudioData> {
    const { videoUrl, audioUrl, label } = params;
    const tempDir = path.join(os.tmpdir(), `replace-audio-${uuidv4()}`);
    const tempFiles: string[] = [];

    try {
      console.log(`[ReplaceAudioService] Creating temp directory: ${tempDir}`);
      await fs.promises.mkdir(tempDir, { recursive: true });

      // 1. Download source video
      console.log(`[ReplaceAudioService] Downloading video from ${videoUrl}...`);
      const tempVideoPath = await this.tempFileService.downloadToTemp(videoUrl, "video-source-");
      const videoWithExt = await this.tempFileService.renameWithExtension(tempVideoPath, "mp4");
      tempFiles.push(videoWithExt);
      console.log(`[ReplaceAudioService] Video downloaded to ${videoWithExt}`);

      // 2. Download replacement audio
      console.log(`[ReplaceAudioService] Downloading audio from ${audioUrl}...`);
      const tempAudioPath = await this.tempFileService.downloadToTemp(audioUrl, "audio-source-");
      const audioWithExt = await this.tempFileService.renameWithExtension(tempAudioPath, "mp3");
      tempFiles.push(audioWithExt);
      console.log(`[ReplaceAudioService] Audio downloaded to ${audioWithExt}`);

      // 3. Merge: video stream + new audio
      const outputFilename = label
        ? `${label}-dubbed-${uuidv4()}.mp4`
        : `dubbed-${uuidv4()}.mp4`;
      const outputPath = path.join(tempDir, outputFilename);
      tempFiles.push(outputPath);

      console.log(`[ReplaceAudioService] Merging audio into video...`);
      await this.mergeAudio(videoWithExt, audioWithExt, outputPath);
      console.log(`[ReplaceAudioService] Merge complete: ${outputPath}`);

      // 4. Get output duration
      const duration = await this.getVideoDuration(outputPath);

      // 5. Upload to GCS — stream directly from disk, no buffer load
      console.log(`[ReplaceAudioService] Uploading dubbed video to GCS...`);
      const uploadedUrl = await this.storageService.uploadFromPath(
        outputPath,
        "video/mp4",
        "dubbed",
      );
      console.log(`[ReplaceAudioService] Upload complete: ${uploadedUrl}`);

      return {
        videoUrl: uploadedUrl,
        label,
        duration,
      };
    } catch (error) {
      console.error("[ReplaceAudioService] Error in replaceAudio:", error);
      throw error instanceof Error
        ? error
        : new Error("An unknown error occurred during audio replacement.");
    } finally {
      try {
        console.log(`[ReplaceAudioService] Cleaning up temp files...`);
        await this.tempFileService.cleanupMany(tempFiles);
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn(`[ReplaceAudioService] Failed to cleanup temp files:`, cleanupError);
      }
    }
  }
}
