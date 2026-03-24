import axios, { AxiosError } from "axios";
import type { Readable } from "stream";
import type { z } from "zod";
import type { TransferRequestSchema } from "../schemas/transferSchemas.js";

function getErrorDetails(error: AxiosError): string {
  if (!error.response) {
    return `Network error: ${error.message}`;
  }

  const { status } = error.response;
  const responseData = error.response.data;

  // Common status code explanations
  const statusMessages: Record<number, string> = {
    400: "Bad Request - The request was malformed",
    401: "Unauthorized - Authentication is required",
    403: "Forbidden - You don't have permission to access this resource",
    404: "Not Found - The requested resource doesn't exist",
    413: "Payload Too Large - The file exceeds the size limit",
    429: "Too Many Requests - Rate limit exceeded",
    500: "Internal Server Error - The server encountered an error",
    503: "Service Unavailable - The server is temporarily unavailable",
  };

  let details = statusMessages[status] || `Unexpected status code: ${status}`;

  // Add response data if available
  if (responseData) {
    const errorMessage =
      typeof responseData === "string"
        ? responseData.substring(0, 200) // Truncate long strings
        : JSON.stringify(responseData).substring(0, 200);
    details += `\nResponse: ${errorMessage}`;
  }

  return details;
}

export class StorageTransferService {
  async transferFile(
    params: z.infer<typeof TransferRequestSchema>,
  ): Promise<{ bytesTransferred: number }> {
    const { sourceUrl, destinationSignedUrl, uploadMethod, contentType } =
      params;

    console.info(
      `[StorageTransferService] Starting transfer from ${sourceUrl} to signed URL...`,
    );

    let downloadResponse;
    try {
      // 1. Initiate download stream from sourceUrl
      downloadResponse = await axios({
        method: "GET",
        url: sourceUrl,
        responseType: "stream",
      });

      const downloadStream = downloadResponse.data as Readable;

      // 2. Prepare minimal headers for upload
      const uploadHeaders: Record<string, string> = {
        "Content-Type": contentType || "application/octet-stream",
      };

      // Track bytes transferred
      let bytesTransferred = 0;
      downloadStream.on("data", (chunk) => {
        bytesTransferred += chunk.length;
      });

      downloadStream.on("error", (err) => {
        console.error(
          "[StorageTransferService] Error during download stream:",
          err.message,
        );
      });

      // 3. Upload to destination
      const uploadResponse = await axios({
        method: uploadMethod,
        url: destinationSignedUrl,
        data: downloadStream,
        headers: uploadHeaders,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      if (uploadResponse.status >= 200 && uploadResponse.status < 300) {
        console.info(
          `[StorageTransferService] Upload successful. Transferred ${(
            bytesTransferred /
            1024 /
            1024
          ).toFixed(2)} MB`,
        );
        return { bytesTransferred };
      } else {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }
    } catch (error: any) {
      // Clean up stream if needed
      if (downloadResponse?.data && !downloadResponse.data.destroyed) {
        downloadResponse.data.destroy();
      }

      let errorMessage: string;
      if (axios.isAxiosError(error)) {
        const phase = error.config?.url === sourceUrl ? "download" : "upload";
        const details = getErrorDetails(error);
        errorMessage = `${phase} failed: ${details}`;

        console.error(`[StorageTransferService] Detailed error:`, {
          phase,
          url: error.config?.url,
          status: error.response?.status,
          details,
        });
      } else {
        errorMessage = error.message || "Unknown transfer error";
      }

      console.error(
        `[StorageTransferService] Error during transfer: ${errorMessage}`,
      );
      throw new Error(`File transfer failed: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const storageTransferService = new StorageTransferService();
