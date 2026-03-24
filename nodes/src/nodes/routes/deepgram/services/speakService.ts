import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { z } from "zod";
import { appConfig } from "../../../../utils/appConfig";
import {
  StorageConfig,
  StorageService,
} from "../../../services/storage.service";
import {
  DeepgramAuth,
  DeepgramResponseHeaders,
  SpeakRequestSchema,
  SpeakResultDataSchema,
} from "../schemas/speakSchemas"; // Updated import path

const DEEPGRAM_API_BASE_URL = "https://api.deepgram.com/v1/speak";

// --- Type Inference ---
// Infer SpeakRequest type from Zod schema for function parameters
type SpeakRequest = z.infer<typeof SpeakRequestSchema>;

// --- Helper Functions ---

/**
 * Creates standard headers for Deepgram API requests.
 */
const getDeepgramHeaders = (auth: DeepgramAuth) => ({
  Authorization: `Token ${auth.apiKey}`,
  "Content-Type": "application/json",
  Accept: "audio/*", // Indicate we expect audio data
});

/**
 * Extracts relevant headers from the Deepgram response.
 */
const extractDeepgramHeaders = (
  response: AxiosResponse,
): DeepgramResponseHeaders => {
  const { headers } = response;
  return {
    "dg-request-id": headers["dg-request-id"],
    "dg-model-uuid": headers["dg-model-uuid"],
    "dg-model-name": headers["dg-model-name"],
    "dg-char-count": headers["dg-char-count"],
    "content-type": headers["content-type"],
  };
};

/**
 * Handles Deepgram API errors.
 */
const handleDeepgramError = (error: unknown, context: string) => {
  if (axios.isAxiosError(error) && error.response) {
    // Deepgram might return JSON error details even for audio endpoints
    let errorMessage = error.message;
    if (error.response.data) {
      // If data is ArrayBuffer, try decoding as text
      try {
        const decodedData = Buffer.from(error.response.data).toString("utf-8");
        const jsonData = JSON.parse(decodedData);
        errorMessage = jsonData.message || jsonData.reason || decodedData;
      } catch (parseError) {
        // Ignore if it's not JSON or fails to decode
        console.warn("[Deepgram Service] Failed to parse error response data.");
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
 * Synthesizes speech from text using Deepgram TTS.
 */
export const synthesizeSpeech = async (
  params: SpeakRequest,
): Promise<z.infer<typeof SpeakResultDataSchema>> => {
  const { apiKey, text, model, encoding, container, sample_rate, bit_rate } =
    params;
  const auth: DeepgramAuth = { apiKey };

  // Construct query parameters
  const queryParams = new URLSearchParams();
  if (model) queryParams.set("model", model);
  if (encoding) queryParams.set("encoding", encoding);
  if (container) queryParams.set("container", container);
  if (sample_rate) queryParams.set("sample_rate", sample_rate.toString());
  if (bit_rate) queryParams.set("bit_rate", bit_rate.toString());
  // Add any other restOptions if mapped

  const speakUrl = `${DEEPGRAM_API_BASE_URL}?${queryParams.toString()}`;

  const config: AxiosRequestConfig = {
    method: "POST",
    url: speakUrl,
    headers: getDeepgramHeaders(auth),
    data: { text },
    responseType: "arraybuffer", // Crucial for receiving audio data
  };

  try {
    const response = await axios<ArrayBuffer>(config);
    console.log("[Deepgram Service] Speech synthesis successful.");

    const headers = extractDeepgramHeaders(response);
    const audioBuffer = Buffer.from(response.data);
    const contentType = headers["content-type"] || "audio/mpeg"; // Default fallback

    // Instantiate StorageService using corrected config properties
    const storageConfig: StorageConfig = {
      bucketName: appConfig.gcp.storage.bucketName, // Corrected path
      projectId: appConfig.gcp.projectId, // Corrected path
    };
    if (!storageConfig.bucketName || !storageConfig.projectId) {
      throw new Error("Storage bucket name or project ID is not configured.");
    }
    const storageService = new StorageService(storageConfig);

    // Upload using the actual StorageService method
    const audioUrl = await storageService.uploadFile(
      audioBuffer,
      contentType,
      "deepgram-tts",
    );

    // Map to standardized result format
    const resultData: z.infer<typeof SpeakResultDataSchema> = {
      audioUrl: audioUrl,
      contentType: contentType,
      requestId: headers["dg-request-id"],
      modelName: headers["dg-model-name"],
      modelUuid: headers["dg-model-uuid"],
      charCount: headers["dg-char-count"],
    };

    // Validate the final structure before returning
    return SpeakResultDataSchema.parse(resultData);
  } catch (error) {
    handleDeepgramError(error, "synthesizeSpeech");
    // Re-throw the handled/standardized error
    // The controller will catch this and format the final 500 response
    throw error;
  }
};
