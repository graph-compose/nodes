import axios from "axios";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const SUPPORTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
];

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (OpenAI Whisper limit)

export class FileValidatorService {
  /**
   * Downloads an audio file from a URL to a temporary location and validates it.
   * @param url URL of the audio file
   * @returns Object with the local file path and a cleanup function
   */
  async downloadAudioFile(
    url: string,
  ): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
    console.log(`[FileValidator] Downloading audio from: ${url}`);

    const tempDir = path.join(os.tmpdir(), "audio-validator");
    await fs.promises.mkdir(tempDir, { recursive: true });

    const extension = this.getExtensionFromUrl(url);
    const tempFile = path.join(tempDir, `${uuidv4()}${extension}`);

    try {
      const response = await axios({
        method: "get",
        url,
        responseType: "stream",
        timeout: 30000,
        maxContentLength: MAX_AUDIO_SIZE,
        headers: {
          Accept: SUPPORTED_AUDIO_TYPES.join(", "),
        },
      });

      // Check content type
      const contentType = response.headers["content-type"];
      if (contentType && !this.isValidAudioType(contentType)) {
        console.warn(
          `[FileValidator] Unexpected content type: ${contentType}. Proceeding anyway.`,
        );
      }

      // Check content length if available
      const contentLength = parseInt(
        response.headers["content-length"] || "0",
        10,
      );
      if (contentLength > MAX_AUDIO_SIZE) {
        throw new Error(
          `Audio file too large (${Math.round(contentLength / 1024 / 1024)}MB). Maximum size is ${Math.round(MAX_AUDIO_SIZE / 1024 / 1024)}MB.`,
        );
      }

      // Write to temp file
      const writer = fs.createWriteStream(tempFile);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
        response.data.on("error", reject);
      });

      // Verify file size after download
      const stats = await fs.promises.stat(tempFile);
      if (stats.size === 0) {
        throw new Error("Downloaded audio file is empty");
      }
      if (stats.size > MAX_AUDIO_SIZE) {
        throw new Error(
          `Audio file too large (${Math.round(stats.size / 1024 / 1024)}MB). Maximum size is ${Math.round(MAX_AUDIO_SIZE / 1024 / 1024)}MB.`,
        );
      }

      console.log(
        `[FileValidator] Audio downloaded successfully: ${tempFile} (${stats.size} bytes)`,
      );

      const cleanup = async () => {
        try {
          await fs.promises.unlink(tempFile);
          console.log(`[FileValidator] Cleaned up temp file: ${tempFile}`);
        } catch (err) {
          console.warn(
            `[FileValidator] Failed to clean up temp file: ${tempFile}`,
            err,
          );
        }
      };

      return { filePath: tempFile, cleanup };
    } catch (error: any) {
      // Clean up on failure
      try {
        await fs.promises.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error("Audio download timed out");
        }
        if (error.response?.status === 404) {
          throw new Error("Audio file not found at the provided URL");
        }
        if (error.response?.status === 403) {
          throw new Error("Access denied to the audio file URL");
        }
      }

      throw new Error(`Failed to download audio file: ${error.message}`);
    }
  }

  private isValidAudioType(contentType: string): boolean {
    const normalized = contentType.split(";")[0].trim().toLowerCase();
    return SUPPORTED_AUDIO_TYPES.includes(normalized);
  }

  private getExtensionFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const ext = path.extname(pathname).toLowerCase();
      if ([".mp3", ".wav", ".ogg", ".flac", ".m4a", ".webm", ".mp4"].includes(ext)) {
        return ext;
      }
    } catch {
      // Ignore URL parse errors
    }
    return ".mp3"; // Default extension
  }
}
