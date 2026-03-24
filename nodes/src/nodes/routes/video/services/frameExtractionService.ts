import ffmpeg from "fluent-ffmpeg";
import { StorageService } from "../../../services/storage.service";

export type FrameType =
  | { type: "first" }
  | { type: "last" }
  | { type: "specific"; timestamp: number };

export interface FrameExtractionOptions {
  videoUrl: string;
  frames: FrameType[];
  outputFormat?: "jpg" | "png";
}

interface VideoMetadata {
  duration: number;
  fps: number;
  width: number;
  height: number;
  codec: string;
}

export class FrameExtractorService {
  constructor(private storageService: StorageService) {}

  /**
   * Extracts multiple frames from a video and uploads them to storage
   * @param options Frame extraction options
   * @returns URLs of the extracted frames
   */
  async extractFrames(options: FrameExtractionOptions): Promise<string[]> {
    const { videoUrl, frames, outputFormat = "jpg" } = options;

    try {
      console.log(
        "[Frame Extraction] Starting extraction for video:",
        videoUrl,
      );

      // Validate video URL is accessible
      await this.validateVideoUrl(videoUrl);

      // Get video metadata first
      const metadata = await this.getVideoMetadata(videoUrl);
      console.log("[Frame Extraction] Video metadata:", metadata);

      // Calculate all timestamps we need to extract
      const timestamps = await this.calculateTimestamps(frames, metadata);
      console.log("[Frame Extraction] Timestamps to extract:", timestamps);

      // Extract and upload all frames
      const frameUrls = await Promise.all(
        timestamps.map(async (timestamp) => {
          console.log(
            `[Frame Extraction] Processing frame at timestamp: ${timestamp}`,
          );
          const buffer = await this.extractFrameToBuffer(
            videoUrl,
            timestamp,
            metadata,
          );
          console.log(
            `[Frame Extraction] Frame extracted, buffer size: ${buffer.length}`,
          );
          return this.storageService.uploadFile(
            buffer,
            `image/${outputFormat}`,
            "frame-extraction-service",
          );
        }),
      );

      console.log("[Frame Extraction] Successfully extracted all frames");
      return frameUrls;
    } catch (error: any) {
      console.error("[Frame Extraction] Error during extraction:", {
        error: error.message,
        videoUrl,
        frames,
      });
      throw new Error(`Failed to process video: ${error.message}`);
    }
  }

  private async validateVideoUrl(videoUrl: string): Promise<void> {
    console.log("[Frame Extraction] Validating video URL:", videoUrl);

    if (!videoUrl.toLowerCase().endsWith(".mp4")) {
      throw new Error("Only MP4 videos are supported");
    }

    return new Promise((resolve, reject) => {
      const outputTarget = process.platform === "win32" ? "NUL" : "/dev/null";
      const command = ffmpeg(videoUrl);
      let errorOutput = "";

      command
        .inputOptions(["-v", "error"])
        .duration(0.1)
        .on("start", () => {
          console.log("[Frame Extraction] Starting URL validation");
        })
        .on("stderr", (stderrLine) => {
          errorOutput += stderrLine + "\n";
        })
        .on("error", (err) => {
          console.error("[Frame Extraction] URL validation error:", {
            error: err.message,
            stderr: errorOutput,
          });

          if (errorOutput.includes("404")) {
            reject(new Error("Video URL not found (404)"));
          } else if (errorOutput.includes("403")) {
            reject(new Error("Access to video URL forbidden (403)"));
          } else {
            reject(new Error(`Failed to access video URL: ${err.message}`));
          }
        })
        .on("end", () => {
          console.log("[Frame Extraction] URL validation successful");
          resolve();
        })
        .outputOptions("-f null")
        .save(outputTarget);
    });
  }

  private async getVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
    console.log("[Frame Extraction] Getting video metadata");

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err, metadata) => {
        if (err) {
          console.error("[Frame Extraction] Probe error:", err);
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

        if (!videoStream.r_frame_rate) {
          reject(new Error("No frame rate information found"));
          return;
        }

        if (!videoStream.width || !videoStream.height) {
          reject(new Error("No video dimensions found"));
          return;
        }

        // Calculate real fps from the frame rate fraction
        const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
        if (!num || !den || den === 0) {
          reject(new Error("Invalid frame rate format"));
          return;
        }

        const fps = num / den;
        const duration = Number(metadata.format.duration);

        if (isNaN(duration) || duration <= 0) {
          reject(new Error("Invalid video duration"));
          return;
        }

        const result = {
          duration,
          fps,
          width: videoStream.width,
          height: videoStream.height,
          codec: videoStream.codec_name || "unknown",
        };

        console.log("[Frame Extraction] Metadata extracted:", result);
        resolve(result);
      });
    });
  }

  private async calculateTimestamps(
    frames: FrameType[],
    metadata: VideoMetadata,
  ): Promise<number[]> {
    const timestamps = new Set<number>();

    for (const frame of frames) {
      switch (frame.type) {
        case "first":
          timestamps.add(0);
          break;
        case "last":
          timestamps.add(Math.max(0, metadata.duration - 1 / metadata.fps));
          break;
        case "specific":
          if (frame.timestamp <= metadata.duration) {
            timestamps.add(frame.timestamp);
          } else {
            console.warn(
              `[Frame Extraction] Timestamp ${frame.timestamp} exceeds video duration ${metadata.duration}, skipping`,
            );
          }
          break;
      }
    }

    return Array.from(timestamps).sort((a, b) => a - b);
  }

  private async extractFrameToBuffer(
    videoUrl: string,
    timestamp: number,
    metadata: VideoMetadata,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let errorOutput = "";

      const command = ffmpeg(videoUrl)
        .outputFPS(metadata.fps)
        .seekInput(timestamp)
        .size(`${metadata.width}x${metadata.height}`)
        .frames(1)
        .format("image2pipe")
        .outputOptions([
          "-vcodec",
          "mjpeg",
          "-pix_fmt",
          "yuvj420p",
          "-q:v",
          "2",
          "-loglevel",
          "warning",
          "-strict",
          "-2",
        ]);

      console.log(
        `[Frame Extraction] Executing command for timestamp ${timestamp}:`,
        command._getArguments().join(" "),
      );

      const stream = command.pipe();

      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
        console.log(
          `[Frame Extraction] Received chunk of size: ${chunk.length}`,
        );
      });

      stream.on("end", () => {
        const buffer = Buffer.concat(chunks as Uint8Array[]);
        if (buffer.length === 0) {
          reject(
            new Error(`No frame data extracted at timestamp ${timestamp}`),
          );
          return;
        }
        console.log(
          `[Frame Extraction] Successfully extracted frame of size: ${buffer.length}`,
        );
        resolve(buffer);
      });

      stream.on("error", (err) => {
        console.error("[Frame Extraction] Stream error:", {
          error: err.message,
          timestamp,
          errorOutput,
        });
        reject(
          new Error(`Stream error at timestamp ${timestamp}: ${err.message}`),
        );
      });

      command.on("stderr", (stderrLine) => {
        errorOutput += stderrLine + "\n";
      });

      command.on("error", (err) => {
        console.error("[Frame Extraction] FFmpeg error:", {
          error: err.message,
          timestamp,
          errorOutput,
        });
        reject(
          new Error(
            `FFmpeg error at timestamp ${timestamp}: ${
              errorOutput || err.message
            }`,
          ),
        );
      });

      command.on("start", (commandLine) => {
        console.log(
          `[Frame Extraction] Starting FFmpeg for timestamp ${timestamp}:`,
          commandLine,
        );
      });
    });
  }
}
