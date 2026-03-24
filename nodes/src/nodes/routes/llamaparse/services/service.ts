import axios, { AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Constants for LlamaParse API
const LLAMA_PARSE_BASE_URL = "https://api.cloud.llamaindex.ai/api/parsing";

// --- Helper Functions ---

// Helper function to download file from URL to temporary location
export async function downloadFile(url: string): Promise<string> {
  try {
    const tempDir = os.tmpdir();
    const uniqueId = uuidv4();
    const fileExt = path.extname(new URL(url).pathname) || ".pdf";
    const tempFilePath = path.join(tempDir, `llamaparse-${uniqueId}${fileExt}`);

    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    return new Promise<string>((resolve, reject) => {
      writer.on("finish", () => resolve(tempFilePath));
      writer.on("error", (err) => {
        fs.unlink(tempFilePath, () => {
          console.log(`Cleaned up partial file after error: ${tempFilePath}`);
        });
        reject(new Error(`Error saving temporary file: ${err.message}`));
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download file from ${url}: ${error.message}`);
    }
    throw new Error("Unknown error occurred while downloading the file");
  }
}

// Helper function to clean up temporary files
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`[LlamaParse Service] Cleaned up temporary file ${filePath}`);
    }
  } catch (error) {
    console.error(
      `[LlamaParse Service] Error cleaning up temp file ${filePath}:`,
      error,
    );
  }
}

// --- LlamaParse API Interaction Functions ---

/**
 * Uploads a file to LlamaParse and starts the parsing job.
 * @param apiKey LlamaCloud API Key.
 * @param tempFilePath Path to the temporary file to upload.
 * @returns The job ID for the parsing task.
 * @throws Throws error if the upload fails.
 */
export async function startParseJob(
  apiKey: string,
  tempFilePath: string,
): Promise<{ jobId: string }> {
  const url = `${LLAMA_PARSE_BASE_URL}/upload`;
  const form = new FormData();
  form.append("file", fs.createReadStream(tempFilePath));

  try {
    const response = await axios.post<{ id: string }>(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
    });

    if (!response.data || !response.data.id) {
      throw new Error("LlamaParse API did not return a job ID after upload.");
    }

    console.log(
      `[LlamaParse Service] Started job with ID: ${response.data.id}`,
    );
    return { jobId: response.data.id };
  } catch (error) {
    let errorMessage = "Failed to start LlamaParse job.";
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        detail?: string;
        error?: string;
      }>;
      const apiError =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        axiosError.message;
      errorMessage = `LlamaParse API error during upload: ${apiError}`;
    } else if (error instanceof Error) {
      errorMessage = `Error starting job: ${error.message}`;
    }
    console.error("[LlamaParse Service]", errorMessage, error);
    throw new Error(errorMessage);
  }
}

/**
 * Checks the status of a LlamaParse job.
 * @param apiKey LlamaCloud API Key.
 * @param jobId The ID of the job to check.
 * @returns Object containing the job status.
 * @throws Throws error if the status check fails.
 */
export async function getParseJobStatus(
  apiKey: string,
  jobId: string,
): Promise<{ status: string; error?: string }> {
  const url = `${LLAMA_PARSE_BASE_URL}/job/${jobId}`;

  try {
    const response = await axios.get<{ status: string; error?: string }>(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
    });

    if (!response.data || !response.data.status) {
      throw new Error(
        `LlamaParse API did not return a valid status for job ${jobId}.`,
      );
    }

    console.log(
      `[LlamaParse Service] Job ${jobId} status: ${response.data.status}`,
    );
    return {
      status: response.data.status, // e.g., PENDING, SUCCESS, ERROR
      error: response.data.error, // Present if status is ERROR
    };
  } catch (error) {
    let errorMessage = `Failed to get status for LlamaParse job ${jobId}.`;
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        detail?: string;
        error?: string;
      }>;
      const apiError =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        axiosError.message;
      errorMessage = `LlamaParse API error getting status: ${apiError}`;
    } else if (error instanceof Error) {
      errorMessage = `Error getting job status: ${error.message}`;
    }
    console.error("[LlamaParse Service]", errorMessage, error);
    throw new Error(errorMessage);
  }
}

/**
 * Retrieves the parsed result of a completed LlamaParse job.
 * @param apiKey LlamaCloud API Key.
 * @param jobId The ID of the completed job.
 * @param resultFormat The desired format ('markdown' or 'text').
 * @returns Object containing the parsed content.
 * @throws Throws error if retrieving the result fails.
 */
export async function getParseJobResult(
  apiKey: string,
  jobId: string,
  resultFormat: "markdown" | "text",
): Promise<{ parsedContent: string }> {
  // Validate result format to prevent constructing invalid URLs
  if (resultFormat !== "markdown" && resultFormat !== "text") {
    throw new Error(
      `Invalid resultFormat specified: ${resultFormat}. Must be 'markdown' or 'text'.`,
    );
  }

  const url = `${LLAMA_PARSE_BASE_URL}/job/${jobId}/result/${resultFormat}`;

  try {
    // The API returns the content directly, potentially as JSON { "<format>": "content..." } or raw text
    const response = await axios.get<any>(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json", // Accept JSON, handle potential text response
      },
    });

    let parsedContent: string;

    // Check response type and extract content
    if (typeof response.data === "string") {
      parsedContent = response.data;
    } else if (
      response.data &&
      typeof response.data[resultFormat] === "string"
    ) {
      parsedContent = response.data[resultFormat];
    } else {
      console.warn(
        `[LlamaParse Service] Unexpected result structure for job ${jobId} format ${resultFormat}:`,
        response.data,
      );
      throw new Error(
        `LlamaParse API returned an unexpected result structure for job ${jobId}.`,
      );
    }

    console.log(
      `[LlamaParse Service] Retrieved ${resultFormat} result for job ${jobId}.`,
    );
    return { parsedContent };
  } catch (error) {
    let errorMessage = `Failed to get ${resultFormat} result for LlamaParse job ${jobId}.`;
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        detail?: string;
        error?: string;
      }>;
      const apiError =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        axiosError.message;
      errorMessage = `LlamaParse API error getting result: ${apiError}`;
    } else if (error instanceof Error) {
      errorMessage = `Error getting job result: ${error.message}`;
    }
    console.error("[LlamaParse Service]", errorMessage, error);
    throw new Error(errorMessage);
  }
}
