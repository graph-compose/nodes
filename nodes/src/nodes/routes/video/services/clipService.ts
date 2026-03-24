import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { StorageService } from "../../../services/storage.service";
import { ClipData, ClipRequestSchema } from "../schemas/clipSchemas";
import { TempFileService } from "./temp-file";

interface ClipResult {
  label: string;
  url: string;
  duration: number;
  start: number;
  end: number;
}

export class ClipService {
  private storageService: StorageService;
  private tempFileService: TempFileService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.tempFileService = new TempFileService();
  }

  /**
   * Extracts a single clip from a video file using FFmpeg stream copy.
   */
  private async extractSingleClip(
    inputPath: string,
    start: number,
    end: number,
    outputPath: string,
  ): Promise<void> {
    const duration = end - start;

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-ss",
        String(start),
        "-i",
        inputPath,
        "-t",
        String(duration),
        "-c",
        "copy",
        "-avoid_negative_ts",
        "make_zero",
        "-hide_banner",
        "-loglevel",
        "error",
        outputPath,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `FFmpeg clip extraction failed with code ${code}. Stderr: ${stderr}`,
            ),
          );
        }
      });

      ffmpeg.on("error", (err) => {
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
      });
    });
  }

  /**
   * Extracts multiple clips from a video and uploads each to GCS.
   */
  async clipVideo(
    params: z.infer<typeof ClipRequestSchema>,
  ): Promise<ClipData> {
    const { videoUrl, segments } = params;
    const tempDir = path.join(os.tmpdir(), `clip-${uuidv4()}`);
    const outputFolderName = "clips";
    const tempFiles: string[] = [];

    try {
      console.log(`[ClipService] Creating temp directory: ${tempDir}`);
      await fs.promises.mkdir(tempDir, { recursive: true });

      // 1. Download source video
      console.log(`[ClipService] Downloading video from ${videoUrl}...`);
      const tempVideoPath = await this.tempFileService.downloadToTemp(
        videoUrl,
        "clip-source-",
      );
      const videoWithExt = await this.tempFileService.renameWithExtension(
        tempVideoPath,
        "mp4",
      );
      tempFiles.push(videoWithExt);
      console.log(`[ClipService] Video downloaded to ${videoWithExt}`);

      // 2. Validate segments
      for (const segment of segments) {
        if (segment.end <= segment.start) {
          throw new Error(
            `Invalid segment: end (${segment.end}) must be greater than start (${segment.start})`,
          );
        }
      }

      // 3. Extract each clip and upload
      const clips: ClipResult[] = [];

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const label = segment.label || `clip_${i + 1}`;
        const duration = segment.end - segment.start;
        const outputPath = path.join(tempDir, `${label}-${uuidv4()}.mp4`);
        tempFiles.push(outputPath);

        console.log(
          `[ClipService] Extracting clip ${i + 1}/${segments.length}: ${label} (${segment.start}s - ${segment.end}s)`,
        );

        await this.extractSingleClip(
          videoWithExt,
          segment.start,
          segment.end,
          outputPath,
        );

        // Upload clip to GCS
        console.log(`[ClipService] Uploading clip ${label} to GCS...`);
        const fileBuffer = await fs.promises.readFile(outputPath);
        const url = await this.storageService.uploadFile(
          fileBuffer,
          "video/mp4",
          outputFolderName,
        );

        clips.push({
          label,
          url,
          duration,
          start: segment.start,
          end: segment.end,
        });

        console.log(`[ClipService] Clip ${label} uploaded: ${url}`);
      }

      console.log(
        `[ClipService] All ${clips.length} clips extracted and uploaded`,
      );
      return {
        clips,
        totalClips: clips.length,
      };
    } catch (error) {
      console.error("[ClipService] Error in clipVideo:", error);
      throw error instanceof Error
        ? error
        : new Error("An unknown error occurred during clip extraction.");
    } finally {
      // Cleanup temp files
      try {
        console.log(`[ClipService] Cleaning up temp files...`);
        await this.tempFileService.cleanupMany(tempFiles);
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn(
          `[ClipService] Failed to cleanup temp files:`,
          cleanupError,
        );
      }
    }
  }
}
