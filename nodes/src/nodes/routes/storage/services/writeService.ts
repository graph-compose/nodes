import axios from "axios";
import type { z } from "zod";
import type { WriteContentRequestSchema } from "../schemas/writeSchemas.js"; // Path is now one level up

export class StorageWriteService {
  async writeContent(
    params: z.infer<typeof WriteContentRequestSchema>,
  ): Promise<{ bytesWritten: number; objectUrl?: string }> {
    const {
      destinationSignedUrl,
      content,
      contentType,
      uploadMethod,
      expectedObjectUrl,
    } = params;

    console.info(
      `[StorageWriteService] Attempting ${uploadMethod} write to signed URL...`, // Added service context
    );

    const contentBuffer = Buffer.from(content, "utf-8");
    const contentLength = contentBuffer.length;

    const uploadHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": contentLength.toString(),
    };

    try {
      const uploadResponse = await axios({
        method: uploadMethod || "PUT", // Default to PUT if not specified
        url: destinationSignedUrl,
        data: contentBuffer,
        headers: uploadHeaders,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.info(
        `[StorageWriteService] Axios upload call completed with status: ${uploadResponse.status}`, // Added service context
      );

      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        let errorDetails = "(No specific details)";
        if (
          typeof uploadResponse.data === "string" &&
          uploadResponse.data.length > 0
        ) {
          errorDetails = uploadResponse.data.substring(0, 500);
        } else if (uploadResponse.data?.message) {
          errorDetails = uploadResponse.data.message;
        } else if (uploadResponse.data?.error) {
          errorDetails = JSON.stringify(uploadResponse.data.error);
        }
        throw new Error(
          `Upload failed with status ${uploadResponse.status}. Details: ${errorDetails}`,
        );
      }

      console.info(
        `[StorageWriteService] Upload successful. Bytes written: ${contentLength}`, // Added service context
      );
      return { bytesWritten: contentLength, objectUrl: expectedObjectUrl };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (typeof error.response?.data === "string"
          ? error.response.data.substring(0, 500)
          : null) ||
        error.message ||
        "Unknown upload error";
      console.error(
        `[StorageWriteService] Error during upload: ${message}`,
        error,
      ); // Log full error
      const errorMessage = `Error writing content to destination URL: ${message}`;
      if (error.response?.status) {
        throw new Error(`${errorMessage} (Status: ${error.response.status})`);
      } else {
        throw new Error(errorMessage);
      }
    }
  }
}

// Export singleton instance
export const storageWriteService = new StorageWriteService();
