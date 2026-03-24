import axios, { AxiosRequestConfig } from "axios";
import { z } from "zod";
import { DeepgramAuth } from "../schemas/speakSchemas"; // Re-use auth type
import {
  TranscribeResultDataSchema,
  TranscribeUrlRequestSchema,
} from "../schemas/transcribeSchemas";

const DEEPGRAM_API_BASE_URL = "https://api.deepgram.com/v1/listen";

// --- Type Inference ---
type TranscribeUrlRequest = z.infer<typeof TranscribeUrlRequestSchema>;

// --- Helper Functions (Consider moving common helpers to a shared file) ---

/**
 * Creates standard headers for Deepgram API requests.
 */
const getDeepgramHeaders = (auth: DeepgramAuth) => ({
  Authorization: `Token ${auth.apiKey}`,
  "Content-Type": "application/json",
  Accept: "application/json", // Expect JSON response for transcription
});

/**
 * Handles Deepgram API errors (could be shared with speakService).
 */
const handleDeepgramError = (error: unknown, context: string) => {
  if (axios.isAxiosError(error) && error.response) {
    let errorMessage = error.message;
    if (error.response.data) {
      try {
        // Response data is likely JSON for listen endpoint errors
        const errorData = error.response.data;
        errorMessage =
          errorData.message || errorData.reason || JSON.stringify(errorData);
      } catch (parseError) {
        console.warn(
          `[Deepgram Service - ${context}] Failed to parse JSON error response data.`,
        );
        // Fallback to status text if data isn't helpful
        errorMessage = error.response.statusText || errorMessage;
      }
    }
    console.error(
      `[Deepgram Service - ${context}] API Error (${error.response.status}):`,
      errorMessage,
    );
    throw new Error(
      `Deepgram API Error (${context}): ${errorMessage} (Status: ${error.response.status})`,
    );
  } else {
    console.error(`[Deepgram Service - ${context}] Unknown error:`, error);
    throw new Error(
      `An unexpected error occurred in Deepgram Service (${context}).`,
    );
  }
};

// --- API Service Functions ---

/**
 * Transcribes audio from a URL using Deepgram Pre-Recorded Audio API.
 */
export const transcribeUrl = async (
  params: TranscribeUrlRequest,
): Promise<z.infer<typeof TranscribeResultDataSchema>> => {
  const { apiKey, url, ...options } = params; // Separate auth, url, and STT options
  const auth: DeepgramAuth = { apiKey };

  // Construct query parameters from the remaining options
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, String(value));
    }
  });

  const listenUrl = `${DEEPGRAM_API_BASE_URL}?${queryParams.toString()}`;

  const config: AxiosRequestConfig = {
    method: "POST",
    url: listenUrl,
    headers: getDeepgramHeaders(auth),
    data: { url }, // Body contains the URL for remote files
  };

  try {
    // Use the specific Zod schema type for the expected response
    const response = await axios<z.infer<typeof TranscribeResultDataSchema>>(
      config,
    );
    console.log("[Deepgram Service] Transcription successful.");

    // Validate the response data against our Zod schema before returning
    // This ensures the structure matches what we expect.
    return TranscribeResultDataSchema.parse(response.data);
  } catch (error) {
    handleDeepgramError(error, "transcribeUrl");
    // Re-throw the handled/standardized error for the controller
    throw error;
  }
};
