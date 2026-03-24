import { Storage } from "@google-cloud/storage";
import * as crypto from "crypto";
import { Readable } from "stream";

export interface StorageConfig {
  bucketName: string;
  projectId: string;
}

export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(config: StorageConfig) {
    this.bucketName = config.bucketName;
    this.storage = new Storage({
      projectId: config.projectId,
      retryOptions: {
        autoRetry: true,
        maxRetries: 10,
        retryDelayMultiplier: 2,
        maxRetryDelay: 60,
        totalTimeout: 600,
      },
    });
  }

  /**
   * Uploads a buffer to Google Cloud Storage and returns the public URL.
   * @param buffer The file data to upload
   * @param contentType MIME type of the file
   * @param folder Folder/prefix in the bucket
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    contentType: string,
    folder: string,
  ): Promise<string> {
    const extension = this.getExtensionFromContentType(contentType);
    const fileName = `${folder}/${crypto.randomBytes(16).toString("hex")}${extension}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
      timeout: 600_000,
      resumable: buffer.length > 5 * 1024 * 1024,
      // Bucket uses uniform bucket-level access (public), so no per-object ACL needed
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    console.log(`[StorageService] File uploaded: ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Uploads a local file directly from its path to GCS without loading it into memory.
   * Preferred over uploadFile() for large files (videos, etc.) — streams directly to GCS
   * and benefits from the library's built-in resumable upload retry logic.
   */
  async uploadFromPath(
    localPath: string,
    contentType: string,
    folder: string,
  ): Promise<string> {
    const extension = this.getExtensionFromContentType(contentType);
    const fileName = `${folder}/${crypto.randomBytes(16).toString("hex")}${extension}`;

    const bucket = this.storage.bucket(this.bucketName);
    await bucket.upload(localPath, {
      destination: fileName,
      metadata: { contentType },
      resumable: true,
      timeout: 600_000,
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    console.log(`[StorageService] File uploaded: ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Uploads a readable stream to Google Cloud Storage and returns the public URL + cleanup function.
   * @param stream The readable stream to upload
   * @param mimeType MIME type of the content
   * @param folder Folder/prefix in the bucket
   * @param extension File extension (e.g., ".mp3")
   * @returns Object with url and cleanup function
   */
  async uploadStream(
    stream: Readable,
    mimeType: string,
    folder: string,
    extension: string,
  ): Promise<{ url: string; cleanup: () => void }> {
    const fileName = `${folder}/${crypto.randomBytes(16).toString("hex")}${extension}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    const writeStream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
      timeout: 600_000,
      resumable: true,
      // Bucket uses uniform bucket-level access (public), so no per-object ACL needed
    });

    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(writeStream)
        .on("finish", () => resolve())
        .on("error", (err) => reject(err));

      stream.on("error", (err) => reject(err));
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    console.log(`[StorageService] Stream uploaded: ${publicUrl}`);

    const cleanup = () => {
      file
        .delete()
        .then(() =>
          console.log(`[StorageService] Cleaned up file: ${fileName}`),
        )
        .catch((err) =>
          console.warn(`[StorageService] Failed to cleanup file: ${fileName}`, err),
        );
    };

    return { url: publicUrl, cleanup };
  }

  private getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
      "audio/mp4": ".m4a",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
      "text/csv": ".csv",
    };
    return map[contentType] || "";
  }
}
