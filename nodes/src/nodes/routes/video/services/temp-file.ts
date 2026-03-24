import axios from "axios";
import crypto from "crypto";
import fs, { promises as fsPromises } from "fs";
import os from "os";
import path from "path";

export class TempFileService {
  private tempDir: string;

  constructor() {
    // Use the OS temp directory as base
    this.tempDir = os.tmpdir();
  }

  /**
   * Downloads a file from a URL to a temporary location
   * @param url The URL to download from
   * @param prefix Optional prefix for the temp filename
   * @returns Path to the downloaded temporary file
   */
  async downloadToTemp(url: string, prefix = "download-"): Promise<string> {
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const tempFilePath = path.join(this.tempDir, `${prefix}${uniqueId}`);

    try {
      console.log(`[TempFileService] Downloading ${url} to ${tempFilePath}`);
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on("finish", () => resolve());
        writer.on("error", reject);
      });

      console.log(`[TempFileService] Download complete: ${tempFilePath}`);
      return tempFilePath;
    } catch (error) {
      // Clean up the temp file if download fails
      await this.cleanup(tempFilePath).catch((cleanupError) => {
        console.error("[TempFileService] Cleanup error:", cleanupError);
      });
      throw error;
    }
  }

  /**
   * Renames a temporary file
   * @param oldPath Current path of the file
   * @param newExtension New extension to add (without the dot)
   * @returns New path of the file
   */
  async renameWithExtension(
    oldPath: string,
    newExtension: string,
  ): Promise<string> {
    const newPath = `${oldPath}.${newExtension}`;
    await fsPromises.rename(oldPath, newPath);
    console.log(`[TempFileService] Renamed ${oldPath} to ${newPath}`);
    return newPath;
  }

  /**
   * Cleans up a temporary file
   * @param filePath Path to the temporary file
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      await fsPromises.unlink(filePath);
      console.log(`[TempFileService] Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      console.warn(
        `[TempFileService] Failed to cleanup file ${filePath}:`,
        error,
      );
      // Don't throw - cleanup failures shouldn't break the main flow
    }
  }

  /**
   * Cleans up multiple temporary files
   * @param filePaths Array of paths to temporary files
   */
  async cleanupMany(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map((filePath) => this.cleanup(filePath)));
  }
}
