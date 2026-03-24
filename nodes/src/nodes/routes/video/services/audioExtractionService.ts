import axios from "axios";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { StorageService } from "../../../services/storage.service";
import { AudioExtractionRequestSchema } from "../schemas/audioExtractionSchemas";

interface ExtractAudioResult {
  audioUrl: string;
  duration?: number; // Optional duration
}

export class AudioExtractionService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  // Helper to run ffprobe and get duration
  private async getVideoDuration(
    filePath: string,
  ): Promise<number | undefined> {
    return new Promise((resolve) => {
      const ffprobe = spawn("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ]);

      let durationOutput = "";
      ffprobe.stdout.on("data", (data) => {
        durationOutput += data.toString();
      });

      ffprobe.on("close", (code) => {
        if (code === 0) {
          const duration = parseFloat(durationOutput);
          resolve(isNaN(duration) ? undefined : duration);
        } else {
          console.warn(`ffprobe exited with code ${code} for ${filePath}`);
          resolve(undefined);
        }
      });

      ffprobe.on("error", (err) => {
        console.error(`Error spawning ffprobe for ${filePath}:`, err);
        resolve(undefined);
      });
    });
  }

  // Main extraction function
  async extractAudio(
    params: z.infer<typeof AudioExtractionRequestSchema>,
  ): Promise<ExtractAudioResult> {
    const { videoUrl } = params;
    const tempDir = path.join(os.tmpdir(), uuidv4());
    const tempVideoPath = path.join(tempDir, `input-${uuidv4()}.mp4`);
    const outputFolderName = "extracted-audio";
    let ffmpegExitCode: number | null = null;
    let ffmpegStderr = "";

    try {
      console.log(`[AudioExtraction] Creating temp directory: ${tempDir}`);
      await fs.promises.mkdir(tempDir, { recursive: true });

      // 1. Download video locally
      console.log(`[AudioExtraction] Downloading video from ${videoUrl}...`);
      const response = await axios({
        method: "get",
        url: videoUrl,
        responseType: "stream",
      });
      const writer = fs.createWriteStream(tempVideoPath);
      response.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on("finish", () => resolve());
        writer.on("error", reject);
        response.data.on("error", reject);
      });
      console.log(`[AudioExtraction] Video downloaded to ${tempVideoPath}`);

      // 2. Get duration (optional)
      const duration = await this.getVideoDuration(tempVideoPath);
      console.log(
        `[AudioExtraction] Detected duration: ${duration ?? "N/A"} seconds`,
      );

      // 3. Spawn FFmpeg
      console.log("[AudioExtraction] Starting FFmpeg process...");
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempVideoPath,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-ab",
        "64k", // Lower bitrate - sufficient for speech
        "-ar",
        "16000", // 16kHz sample rate - standard for most transcription APIs
        "-ac",
        "1", // Mono audio - better for transcription
        "-f",
        "mp3",
        "-hide_banner",
        "-loglevel",
        "error",
        "pipe:1",
      ]);

      // Capture stderr for debugging FFmpeg errors
      ffmpeg.stderr.on("data", (data) => {
        ffmpegStderr += data.toString();
      });

      // Monitor FFmpeg exit code
      ffmpeg.on("close", (code) => {
        ffmpegExitCode = code;
        if (code !== 0) {
          console.error(
            `[AudioExtraction] FFmpeg process exited with error code: ${code}`,
          );
          console.error("[AudioExtraction] FFmpeg stderr:", ffmpegStderr);
        }
      });

      // Simplified FFmpeg spawn error handler
      ffmpeg.on("error", (err) => {
        console.error("[AudioExtraction] Failed to spawn FFmpeg process:", err);
        // Error propagation will be handled by the uploadStream promise rejection
      });

      // 4. Upload FFmpeg stdout stream using StorageService
      console.log("[AudioExtraction] Uploading stream to GCS...");
      const uploadResult = await this.storageService.uploadStream(
        ffmpeg.stdout,
        "audio/mpeg",
        outputFolderName,
        ".mp3",
      );
      const audioUrl = uploadResult.url;

      // Check FFmpeg exit code *after* waiting for upload
      if (ffmpegExitCode !== 0) {
        throw new Error(
          `FFmpeg process failed with code ${
            ffmpegExitCode ?? "unknown"
          }. Stderr: ${ffmpegStderr}`,
        );
      }

      console.log(`[AudioExtraction] Public audio URL: ${audioUrl}`);
      return { audioUrl, duration };
    } catch (error) {
      console.error("[AudioExtraction] Error in extractAudio:", error);
      // No need to manually delete from storage, uploadStream handles failed uploads or returns cleanup
      if (error instanceof Error) {
        throw error;
      }
      // GCS SDK errors may not be instanceof Error but still have a message
      const msg =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "An unknown error occurred during audio extraction.";
      throw new Error(msg);
    } finally {
      // 5. Cleanup local temporary files
      try {
        console.log(`[AudioExtraction] Cleaning up temp directory: ${tempDir}`);
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn(
          `[AudioExtraction] Failed to cleanup temp directory ${tempDir}:`,
          cleanupError,
        );
      }
    }
  }
}
