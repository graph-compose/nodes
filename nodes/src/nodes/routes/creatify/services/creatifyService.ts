import axios, { AxiosRequestConfig } from "axios";
import { z } from "zod";
import {
  CreateMultiLipsyncRequestSchema,
  CreateSingleLipsyncRequestSchema,
  CreatifyAuthSchema, // Import for type inference
  CreatifyTaskResultDataSchema,
  QueryTaskRequestSchema,
} from "../schemas/creatifySchemas";

// Define types based on Zod schemas for internal use
type CreatifyAuth = z.infer<typeof CreatifyAuthSchema>;
type CreatifyTaskResult = z.infer<typeof CreatifyTaskResultDataSchema>;

// Define expected structure from Creatify API responses for internal mapping
interface CreatifyRawTaskCreateResponse {
  id: string; // The task ID
  [key: string]: any; // Capture potential other fields
}

interface CreatifyRawTaskStatusResponse {
  id: string;
  status: "pending" | "processing" | "done" | "error"; // Raw statuses from Creatify
  progress?: number;
  output?: string; // Video URL on 'done'
  error?: string; // Error message on 'error'
  [key: string]: any;
}

const CREATIFY_API_BASE_URL = "https://api.creatify.ai/api";

// --- Helper Functions ---

/**
 * Creates standard headers for Creatify API requests.
 */
const getCreatifyHeaders = (auth: CreatifyAuth) => ({
  "X-API-ID": auth.apiId,
  "X-API-KEY": auth.apiKey,
  "Content-Type": "application/json",
});

/**
 * Maps Creatify API status to our internal standardized status enum.
 */
const mapCreatifyStatus = (
  creatifyStatus: CreatifyRawTaskStatusResponse["status"],
): CreatifyTaskResult["status"] => {
  switch (creatifyStatus) {
    case "pending":
      return "submitted";
    case "processing":
      return "processing";
    case "done":
      return "succeed";
    case "error":
      return "failed";
    default:
      console.warn(
        `[Creatify Service] Unknown Creatify status received: ${creatifyStatus}`,
      );
      return "failed"; // Default to failed for unknown statuses
  }
};

/**
 * Maps our aspect ratio format (e.g., '16:9') to Creatify's format (e.g., '16x9').
 */
const mapAspectRatio = (ratio: string | undefined): string | undefined => {
  if (!ratio) return undefined;
  return ratio.replace(":", "x");
};

/**
 * Standardizes error handling for Creatify API calls.
 */
const handleCreatifyError = (error: unknown, context: string): Error => {
  let message = `An unexpected error occurred in Creatify Service (${context}).`;
  let statusCode = 500; // Default

  if (axios.isAxiosError(error) && error.response) {
    statusCode = error.response.status;
    const responseData = error.response.data;
    console.error(
      `[Creatify Service - ${context}] API Error Response (${statusCode}):`,
      JSON.stringify(responseData, null, 2),
    );
    // Extract meaningful error message from Creatify response
    message = `Creatify API Error (${context}): ${
      responseData?.error || responseData?.message || error.message
    } (Status: ${statusCode})`;
  } else if (error instanceof Error) {
    message = `[Creatify Service - ${context}] Error: ${error.message}`;
    console.error(message, error);
  } else {
    console.error(`[Creatify Service - ${context}] Unknown error:`, error);
  }
  // Return a standardized Error object
  const serviceError = new Error(message);
  (serviceError as any).statusCode = statusCode; // Attach status code if available
  return serviceError;
};

// --- API Service Functions ---

/**
 * Initiates a single avatar lipsync task via Creatify API.
 * Transforms Creatify request format from our standard schema.
 * Returns only the task ID upon successful initiation.
 */
export const startSingleLipsyncTask = async (
  params: z.infer<typeof CreateSingleLipsyncRequestSchema>,
): Promise<{ taskId: string }> => {
  const {
    apiId,
    apiKey,
    avatar_id,
    voice_id,
    aspect_ratio,
    background_url,
    caption_style,
    ...restPayload
  } = params;
  const auth: CreatifyAuth = { apiId, apiKey };

  // Map our schema to Creatify's expected payload format
  const creatifyPayload: any = {
    ...restPayload, // Includes text or audio_url, callback_url etc.
    creator: avatar_id, // Map avatar_id to creator
    accent: voice_id, // Map voice_id to accent
    aspect_ratio: mapAspectRatio(aspect_ratio), // Map aspect ratio format
    caption_style: caption_style, // Pass directly
  };

  // Directly map background_url if provided
  if (background_url) {
    creatifyPayload.background_asset_image_url = background_url;
  }

  // Add audio_url if present (maps to Creatify's 'audio' field)
  if (restPayload.audio_url) {
    creatifyPayload.audio = restPayload.audio_url;
    // delete creatifyPayload.audio_url; // Clean up the original field if needed, though passthrough might handle it
  }

  // TODO: Add other Creatify fields from docs if necessary (e.g., name, green_screen, no_caption, no_music)

  const config: AxiosRequestConfig = {
    method: "POST",
    url: `${CREATIFY_API_BASE_URL}/lipsyncs/`,
    headers: getCreatifyHeaders(auth),
    data: creatifyPayload,
  };

  try {
    const response = await axios<CreatifyRawTaskCreateResponse>(config);
    console.log(
      "[Creatify Service] Single lipsync task submitted:",
      response.data,
    );
    if (!response.data?.id) {
      throw new Error("Creatify API response did not include a task ID.");
    }
    return { taskId: response.data.id }; // Return only the ID
  } catch (error) {
    throw handleCreatifyError(error, "startSingleLipsyncTask");
  }
};

/**
 * Initiates a multi-avatar lipsync task via Creatify API.
 * Returns only the task ID upon successful initiation.
 */
export const startMultiLipsyncTask = async (
  params: z.infer<typeof CreateMultiLipsyncRequestSchema>,
): Promise<{ taskId: string }> => {
  const { apiId, apiKey, aspect_ratio, video_inputs, ...restPayload } = params;
  const auth: CreatifyAuth = { apiId, apiKey };

  // Map our schema structure to what Creatify v2 expects
  const creatifyPayload = {
    ...restPayload, // Includes callback_url etc.
    aspect_ratio: mapAspectRatio(aspect_ratio), // Map format
    // Process video_inputs: Remove background.color if present
    video_inputs: video_inputs.map((input) => {
      const { background, character, ...restInput } = input;
      // Background type is guaranteed by schema to be only 'image' or 'video' now.
      // So, no need to check for 'color' here.
      const newBackground = background; // Use background directly if it exists

      // Map audio_url if voice type is audio
      const processedVoice = { ...restInput.voice };
      if (processedVoice.type === "audio" && processedVoice.audio_url) {
        // Assume v2 endpoint expects 'audio' field like the v1 endpoint does
        (processedVoice as any).audio = processedVoice.audio_url;
        delete (processedVoice as any).audio_url; // Clean up our internal field name
      }

      // Construct the character object for Creatify, adding the required type and default offset
      const processedCharacter = {
        type: "avatar", // Add the required type field
        offset: { x: 0, y: 0 }, // Provide default offset
        ...character, // Spread existing character fields (like avatar_id), overriding default offset if provided
      };

      return {
        ...restInput,
        character: processedCharacter, // Use the processed character object
        voice: processedVoice,
        ...(newBackground && { background: newBackground }),
      }; // Return input with potentially modified voice and background
    }),
  };

  const config: AxiosRequestConfig = {
    method: "POST",
    url: `${CREATIFY_API_BASE_URL}/lipsyncs_v2/`, // Use v2 endpoint
    headers: getCreatifyHeaders(auth),
    data: creatifyPayload,
  };

  try {
    const response = await axios<CreatifyRawTaskCreateResponse>(config);
    console.log(
      "[Creatify Service] Multi-avatar lipsync task submitted:",
      response.data,
    );
    if (!response.data?.id) {
      throw new Error("Creatify API response did not include a task ID.");
    }
    return { taskId: response.data.id };
  } catch (error) {
    throw handleCreatifyError(error, "startMultiLipsyncTask");
  }
};

/**
 * Queries the status of a Creatify task.
 * Transforms the raw response from Creatify into our standardized CreatifyTaskResultDataSchema.
 */
export const getTaskStatus = async (
  params: z.infer<typeof QueryTaskRequestSchema>,
): Promise<CreatifyTaskResult> => {
  const { apiId, apiKey, taskId } = params;
  const auth: CreatifyAuth = { apiId, apiKey };

  const config: AxiosRequestConfig = {
    method: "GET",
    url: `${CREATIFY_API_BASE_URL}/lipsyncs/${taskId}/`,
    headers: getCreatifyHeaders(auth),
  };

  try {
    const response = await axios<CreatifyRawTaskStatusResponse>(config);
    console.log(
      `[Creatify Service] Task status received for ${taskId}:`,
      response.data,
    );
    // Destructure status and id, capture the rest
    const {
      status: originalStatus,
      id: creatifyId,
      ...restRawData
    } = response.data;

    // Map to standardized format defined in CreatifyTaskResultDataSchema
    const standardizedData: CreatifyTaskResult = {
      taskId: creatifyId, // Use the destructured id
      status: mapCreatifyStatus(originalStatus), // Use the mapped status
      statusMessage: restRawData.error, // Map Creatify 'error' field to our statusMessage
      progress: restRawData.progress,
      resultUrl: originalStatus === "done" ? restRawData.output : undefined, // Map Creatify 'output' field
      // Spread only the remaining fields from the raw data
      ...restRawData,
    };

    // Validate against our Zod schema before returning to ensure conformance
    return CreatifyTaskResultDataSchema.parse(standardizedData);
  } catch (error) {
    // If the API call itself failed (e.g., invalid taskId, auth error)
    const serviceError = handleCreatifyError(
      error,
      `getTaskStatus (Task ID: ${taskId})`,
    );

    // Return a standardized 'failed' status object
    // This ensures the controller always receives a CreatifyTaskResult compatible object
    const failureResult: CreatifyTaskResult = {
      taskId: taskId,
      status: "failed",
      statusMessage: serviceError.message,
    };
    // Validate the failure object against the schema
    return CreatifyTaskResultDataSchema.parse(failureResult);
  }
};
