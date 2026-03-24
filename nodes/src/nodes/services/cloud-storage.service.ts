import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Storage as GcsStorage } from "@google-cloud/storage";
import { Readable } from "stream";
import type {
  AwsAuth,
  CloudStorageAuth,
  GcpAuth,
} from "../../types/cloud-storage";

// --- Service Implementation ---

export class CloudStorageService {
  // --- Client Initialization ---

  private getAwsClient(auth: AwsAuth): S3Client {
    console.log(
      `[CloudStorageService] Initializing AWS S3 Client with region: ${
        auth.region || "default"
      }`,
    );
    return new S3Client({
      region: auth.region,
      credentials: {
        accessKeyId: auth.credentials.accessKeyId,
        secretAccessKey: auth.credentials.secretAccessKey,
        sessionToken: auth.credentials.sessionToken,
      },
    });
  }

  private getGcpClient(auth: GcpAuth): GcsStorage {
    console.log(
      `[CloudStorageService] Initializing GCP GCS Client with project ID: ${
        auth.projectId || "default"
      }`,
    );
    const gcsOptions: any = { projectId: auth.projectId };

    if (auth.credentials.serviceAccountKeyJson) {
      try {
        gcsOptions.credentials = JSON.parse(
          auth.credentials.serviceAccountKeyJson,
        );
        console.log(
          "[CloudStorageService] Using GCP Service Account Key JSON for auth.",
        );
      } catch (e) {
        console.error(
          "[CloudStorageService] Failed to parse GCP Service Account Key JSON:",
          e,
        );
        throw new Error("Invalid GCP Service Account Key JSON provided.");
      }
    } else if (auth.credentials.accessToken) {
      console.warn(
        "[CloudStorageService] GCP Access Token auth specified. Relying on Application Default Credentials (ADC).",
      );
      if (!gcsOptions.projectId) {
        console.warn(
          "[CloudStorageService] GCP Project ID not provided with Access Token auth. Relying on ADC discovery.",
        );
      }
    } else {
      console.log(
        "[CloudStorageService] No explicit GCP credentials provided. Relying on Application Default Credentials (ADC).",
      );
    }

    return new GcsStorage(gcsOptions);
  }

  // --- Path Parsing ---

  private parsePath(path: string): {
    provider: "s3" | "gs";
    bucket: string;
    key: string;
  } {
    console.log(`[CloudStorageService] Parsing path: ${path}`);
    let url: URL;
    try {
      if (path.startsWith("s3://")) {
        url = new URL(path);
        if (!url.hostname || !url.pathname || url.pathname === "/") {
          throw new Error("Invalid S3 path format. Missing bucket or key.");
        }
        console.log(
          `[CloudStorageService] Parsed S3: Bucket=${url.hostname}, Key=${url.pathname.substring(1)}`,
        );
        return {
          provider: "s3",
          bucket: url.hostname,
          key: url.pathname.substring(1),
        };
      } else if (path.startsWith("gs://")) {
        url = new URL(path);
        if (!url.hostname || !url.pathname || url.pathname === "/") {
          throw new Error("Invalid GCS path format. Missing bucket or key.");
        }
        console.log(
          `[CloudStorageService] Parsed GCS: Bucket=${url.hostname}, Key=${url.pathname.substring(1)}`,
        );
        return {
          provider: "gs",
          bucket: url.hostname,
          key: url.pathname.substring(1),
        };
      } else {
        throw new Error(`Invalid cloud storage path format.`);
      }
    } catch (e: any) {
      console.error(
        `[CloudStorageService] Error parsing path '${path}': ${e.message}`,
      );
      throw new Error(
        `Invalid cloud storage path format: ${path}. Must start with s3://<bucket>/<key> or gs://<bucket>/<key>.`,
      );
    }
  }

  // --- Core Methods ---

  async objectExists(auth: CloudStorageAuth, path: string): Promise<boolean> {
    console.log(`[CloudStorageService] objectExists called for path: ${path}`);
    const { provider, bucket, key } = this.parsePath(path);

    try {
      if (auth.provider === "aws" && provider === "s3") {
        const client = this.getAwsClient(auth);
        const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
        await client.send(command);
        console.log(
          `[CloudStorageService] S3 object exists: s3://${bucket}/${key}`,
        );
        return true;
      } else if (auth.provider === "gcp" && provider === "gs") {
        const client = this.getGcpClient(auth);
        const [exists] = await client.bucket(bucket).file(key).exists();
        console.log(
          `[CloudStorageService] GCS object exists (${exists}): gs://${bucket}/${key}`,
        );
        return exists;
      } else {
        throw new Error(
          `Provider mismatch or unsupported path/auth combination: ${provider}/${auth.provider}`,
        );
      }
    } catch (error: any) {
      if (auth.provider === "aws" && error.name === "NotFound") {
        console.log(
          `[CloudStorageService] S3 object does not exist: s3://${bucket}/${key}`,
        );
        return false;
      }
      console.error(
        `[CloudStorageService] Error checking existence for '${path}':`,
        error,
      );
      throw new Error(
        `Failed to check existence for ${path}: ${error.message}`,
      );
    }
  }

  async getObject(auth: CloudStorageAuth, path: string): Promise<Buffer> {
    console.log(`[CloudStorageService] getObject called for path: ${path}`);
    const { provider, bucket, key } = this.parsePath(path);

    try {
      if (auth.provider === "aws" && provider === "s3") {
        const client = this.getAwsClient(auth);
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const response = await client.send(command);
        if (!response.Body) {
          throw new Error("S3 GetObject response did not contain a body.");
        }
        console.log(
          `[CloudStorageService] Got S3 object stream: s3://${bucket}/${key}`,
        );
        return await this.streamToBuffer(response.Body as Readable);
      } else if (auth.provider === "gcp" && provider === "gs") {
        const client = this.getGcpClient(auth);
        const [buffer] = await client.bucket(bucket).file(key).download();
        console.log(
          `[CloudStorageService] Got GCS object buffer: gs://${bucket}/${key}, size: ${buffer.length}`,
        );
        return buffer;
      } else {
        throw new Error(
          `Provider mismatch or unsupported path/auth combination: ${provider}/${auth.provider}`,
        );
      }
    } catch (error: any) {
      if (auth.provider === "aws" && error.name === "NoSuchKey") {
        console.error(
          `[CloudStorageService] S3 object not found: s3://${bucket}/${key}`,
        );
        throw new Error(`Object not found at ${path}`);
      } else if (auth.provider === "gcp" && error.code === 404) {
        console.error(
          `[CloudStorageService] GCS object not found: gs://${bucket}/${key}`,
        );
        throw new Error(`Object not found at ${path}`);
      }
      console.error(
        `[CloudStorageService] Error getting object '${path}':`,
        error,
      );
      throw new Error(`Failed to get object ${path}: ${error.message}`);
    }
  }

  async putObject(
    auth: CloudStorageAuth,
    path: string,
    content: Buffer,
    contentType: string,
  ): Promise<void> {
    console.log(
      `[CloudStorageService] putObject called for path: ${path}, contentType: ${contentType}, size: ${content.length}`,
    );
    const { provider, bucket, key } = this.parsePath(path);

    try {
      if (auth.provider === "aws" && provider === "s3") {
        const client = this.getAwsClient(auth);
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: content,
          ContentType: contentType,
        });
        await client.send(command);
        console.log(
          `[CloudStorageService] Put S3 object complete: s3://${bucket}/${key}`,
        );
      } else if (auth.provider === "gcp" && provider === "gs") {
        const client = this.getGcpClient(auth);
        const file = client.bucket(bucket).file(key);
        await file.save(content, {
          metadata: {
            contentType: contentType,
          },
        });
        console.log(
          `[CloudStorageService] Put GCS object complete: gs://${bucket}/${key}`,
        );
      } else {
        throw new Error(
          `Provider mismatch or unsupported path/auth combination: ${provider}/${auth.provider}`,
        );
      }
    } catch (error: any) {
      console.error(
        `[CloudStorageService] Error putting object '${path}':`,
        error,
      );
      throw new Error(`Failed to put object ${path}: ${error.message}`);
    }
  }

  // --- Helper to read stream to buffer ---
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}
