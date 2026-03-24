import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { StorageService } from "../../../services/storage.service";
import { TempFileService } from "./temp-file";

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
}

interface ConcatenationOptions {
  videoUrls: string[];
  resolutionStrategy: "highest" | "lowest";
}

interface ConcatenationResult {
  videoUrl: string;
  duration: number;
  width: number;
  height: number;
}

export class VideoConcatenationService {
  private tempFileService: TempFileService;

  constructor(private storageService: StorageService) {
    this.tempFileService = new TempFileService();
  }

  async concatenateVideos(
    options: ConcatenationOptions,
  ): Promise<ConcatenationResult> {
    const { videoUrls, resolutionStrategy } = options;
    const tempFiles: string[] = [];

    try {
      console.log(
        "[Video Concatenation] Starting concatenation for videos:",
        videoUrls,
      );
      console.log("[Video Concatenation] Raw URLs received:", {
        urls: videoUrls,
        urlTypes: videoUrls.map((url) => typeof url),
        urlLengths: videoUrls.map((url) => url.length),
        urlEndings: videoUrls.map((url) => url.slice(-20)),
      });

      // Download all videos to temp files
      const downloadPromises = videoUrls.map((url) =>
        this.tempFileService.downloadToTemp(url, "video-"),
      );

      const rawTempFiles = await Promise.all(downloadPromises);
      console.log(
        "[Video Concatenation] All videos downloaded to:",
        rawTempFiles,
      );

      // Verify each file and rename with proper extension
      for (const tempFile of rawTempFiles) {
        const format = await this.probeVideoFormat(tempFile);
        if (!format || !format.format_name) {
          throw new Error(`Could not determine format for file: ${tempFile}`);
        }

        // Get the primary format (first one if multiple are returned)
        const primaryFormat = format.format_name.split(",")[0];
        const renamedFile = await this.tempFileService.renameWithExtension(
          tempFile,
          primaryFormat,
        );
        tempFiles.push(renamedFile);
      }

      console.log("[Video Concatenation] Renamed files:", tempFiles);

      // Get metadata from local files
      const metadataList = await Promise.all(
        tempFiles.map((file) => this.getVideoMetadata(file)),
      );
      console.log("[Video Concatenation] Video metadata:", metadataList);

      // Calculate target dimensions based on strategy
      const { width, height } = this.calculateTargetDimensions(
        metadataList,
        resolutionStrategy,
      );
      console.log(
        `[Video Concatenation] Target dimensions: ${width}x${height}`,
      );

      // Concatenate videos using local files
      const buffer = await this.concatenateToBuffer(tempFiles, width, height);
      console.log(
        `[Video Concatenation] Concatenation complete, buffer size: ${buffer.length}`,
      );

      // Upload to storage
      const videoUrl = await this.storageService.uploadFile(
        buffer,
        "video/mp4",
        "video-concatenation-service",
      );

      const totalDuration = metadataList.reduce(
        (sum, meta) => sum + meta.duration,
        0,
      );

      return {
        videoUrl,
        duration: totalDuration,
        width,
        height,
      };
    } catch (error: any) {
      console.error("[Video Concatenation] Error during concatenation:", {
        error: error.message,
        videoUrls,
      });
      throw new Error(`Failed to concatenate videos: ${error.message}`);
    } finally {
      // Clean up all temporary files
      if (tempFiles.length > 0) {
        await this.tempFileService.cleanupMany(tempFiles).catch((error) => {
          console.error(
            "[Video Concatenation] Error cleaning up temp files:",
            error,
          );
        });
      }
    }
  }

  private async probeVideoFormat(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error("[Video Concatenation] Probe error:", err);
          reject(new Error(`Failed to probe video: ${err.message}`));
          return;
        }

        if (!metadata?.format) {
          reject(new Error("No format information found"));
          return;
        }

        console.log("[Video Concatenation] Format detected:", metadata.format);
        resolve(metadata.format);
      });
    });
  }

  private async getVideoMetadata(filePath: string): Promise<VideoMetadata> {
    console.log("[Video Concatenation] Getting video metadata for:", filePath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error("[Video Concatenation] Probe error:", err);
          reject(new Error(`Failed to probe video: ${err.message}`));
          return;
        }

        if (!metadata?.streams?.length) {
          reject(new Error("No video streams found in the file"));
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video",
        );

        if (!videoStream) {
          reject(new Error("No video stream found"));
          return;
        }

        if (!videoStream.width || !videoStream.height) {
          reject(new Error("No video dimensions found"));
          return;
        }

        const duration = Number(metadata.format.duration);

        if (isNaN(duration) || duration <= 0) {
          reject(new Error("Invalid video duration"));
          return;
        }

        const result = {
          duration,
          width: videoStream.width,
          height: videoStream.height,
          codec: videoStream.codec_name || "unknown",
        };

        console.log("[Video Concatenation] Metadata extracted:", result);
        resolve(result);
      });
    });
  }

  private calculateTargetDimensions(
    metadataList: VideoMetadata[],
    strategy: "highest" | "lowest",
  ): { width: number; height: number } {
    const resolutions = metadataList.map((meta) => ({
      width: meta.width,
      height: meta.height,
    }));

    if (strategy === "highest") {
      return resolutions.reduce((max, current) => {
        const maxArea = max.width * max.height;
        const currentArea = current.width * current.height;
        return currentArea > maxArea ? current : max;
      });
    } else {
      // lowest
      return resolutions.reduce((min, current) => {
        const minArea = min.width * min.height;
        const currentArea = current.width * current.height;
        return currentArea < minArea ? current : min;
      });
    }
  }

  private async concatenateToBuffer(
    inputFiles: string[],
    targetWidth: number,
    targetHeight: number,
  ): Promise<Buffer> {
    const outputFile = path.join(
      os.tmpdir(),
      `concat-${crypto.randomBytes(16).toString("hex")}.mp4`,
    );

    try {
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg();

        // Add all inputs
        inputFiles.forEach((file) => {
          command.input(file);
        });

        // Create a complex filter for scaling and padding each input
        const filterComplex = inputFiles
          .map((_, index) => {
            const scaleFilter = `[${index}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2[v${index}];`;
            return scaleFilter;
          })
          .join("");

        // Add the concat filter
        const concatFilter = `${inputFiles
          .map((_, index) => `[v${index}]`)
          .join("")}concat=n=${inputFiles.length}:v=1[outv]`;

        command
          .complexFilter([filterComplex + concatFilter], ["outv"])
          .outputOptions([
            "-movflags",
            "frag_keyframe+empty_moov",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "23",
            "-profile:v",
            "high",
            "-level",
            "4.0",
            "-pix_fmt",
            "yuv420p",
          ])
          .output(outputFile);

        let errorOutput = "";
        command.on("stderr", (stderrLine) => {
          errorOutput += stderrLine + "\n";
          console.log("[Video Concatenation] FFmpeg:", stderrLine);
        });

        command.on("error", (err) => {
          console.error("[Video Concatenation] FFmpeg error:", {
            error: err.message,
            errorOutput,
          });
          reject(new Error(`FFmpeg error: ${errorOutput || err.message}`));
        });

        command.on("end", () => {
          console.log("[Video Concatenation] FFmpeg processing complete");
          resolve();
        });

        console.log(
          "[Video Concatenation] Executing command:",
          command._getArguments().join(" "),
        );

        command.run();
      });

      // Read the output file into a buffer
      const buffer = await fsPromises.readFile(outputFile);
      console.log(
        `[Video Concatenation] Successfully read concatenated video, size: ${buffer.length}`,
      );
      return buffer;
    } finally {
      // Clean up the output file
      await fsPromises.unlink(outputFile).catch((error) => {
        console.warn(
          "[Video Concatenation] Failed to cleanup output file:",
          error,
        );
      });
    }
  }
}
