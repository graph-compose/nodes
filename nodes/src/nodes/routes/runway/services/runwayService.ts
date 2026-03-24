import axios from "axios";
import { z } from "zod";
import {
  TaskResultDataSchema,
  VideoGenerationResultDataSchema,
} from "../schemas/index"; // Import the combined data schemas
import {
  GenerateVideoRequestBodySchema,
  TaskActionParamsSchema,
  TaskActionRequestBodySchema,
} from "../schemas/requestSchemas";

// Define types based on Zod schemas for function signatures
type GenerateVideoBody = z.infer<typeof GenerateVideoRequestBodySchema>;
type TaskActionBody = z.infer<typeof TaskActionRequestBodySchema>;
type TaskActionParams = z.infer<typeof TaskActionParamsSchema>;

// Type for the expected result structure from generate video API call
type GenerateVideoResult = z.infer<typeof VideoGenerationResultDataSchema>;
// Type for the expected result structure from get task status API call
type GetTaskStatusResult = z.infer<typeof TaskResultDataSchema>;

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";

/**
 * Initiates a video generation task with the Runway API.
 * @param params - The parameters matching the GenerateVideoRequestBodySchema.
 * @returns The relevant data from the Runway API response (Task ID).
 * @throws Standardized error if the API call fails.
 */
export async function startVideoGeneration(
  params: GenerateVideoBody,
): Promise<GenerateVideoResult> {
  const { apiKey, ...generationParams } = params;

  try {
    const response = await axios.post<GenerateVideoResult>( // Expect response data to match our Result schema
      `${RUNWAY_API_BASE}/image_to_video`,
      generationParams,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Runway-Version": RUNWAY_API_VERSION,
        },
      },
    );

    // Basic validation: Ensure the response has an 'id'
    if (!response.data || !response.data.id) {
      console.error(
        "[RunwayService] Unexpected success response format from generate API:",
        response.data,
      );
      throw new Error("Runway API returned an unexpected success format.");
    }

    console.log(
      "[RunwayService] Video generation task started successfully:",
      response.data.id,
    );
    // Return only the data matching VideoGenerationResultDataSchema
    // .passthrough() in the schema handles extra fields
    return response.data;
  } catch (error: unknown) {
    console.error("[RunwayService] Error calling Runway generate API:", error);
    // Re-throw a standardized error message
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as {
        failure?: string;
        error?: string;
      };
      const message =
        errorData?.failure || errorData?.error || "Unknown API error";
      throw new Error(
        `Runway API Error (${error.response.status}): ${message}`,
      );
    } else if (error instanceof Error) {
      throw new Error(`Failed to start video generation: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while contacting the Runway generate API.",
      );
    }
  }
}

/**
 * Retrieves the status of a specific task from the Runway API.
 * @param params - Task ID.
 * @param body - Contains the API key for authentication.
 * @returns The full task status data from the Runway API.
 * @throws Standardized error if the API call fails.
 */
export async function getTaskStatus(
  params: TaskActionParams,
  body: TaskActionBody,
): Promise<GetTaskStatusResult> {
  const { id } = params;
  const { apiKey } = body;

  try {
    const response = await axios.get<GetTaskStatusResult>( // Expect response data to match our Result schema
      `${RUNWAY_API_BASE}/tasks/${id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Runway-Version": RUNWAY_API_VERSION,
        },
      },
    );

    // Basic validation: Ensure response has 'id' and 'status'
    if (!response.data || !response.data.id || !response.data.status) {
      console.error(
        "[RunwayService] Unexpected success response format from status API:",
        response.data,
      );
      throw new Error("Runway API returned an unexpected status format.");
    }

    console.log(
      `[RunwayService] Task status retrieved successfully for ${id}: ${response.data.status}`,
    );
    // .passthrough() in the schema handles extra fields
    return response.data;
  } catch (error: unknown) {
    console.error(
      `[RunwayService] Error getting task status for ${id}:`,
      error,
    );
    // Re-throw a standardized error message
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as {
        failure?: string;
        error?: string;
      };
      const message =
        errorData?.failure || errorData?.error || "Unknown API error";
      throw new Error(
        `Runway API Error getting status (${error.response.status}): ${message}`,
      );
    } else if (error instanceof Error) {
      throw new Error(`Failed to get task status: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while contacting the Runway status API.",
      );
    }
  }
}

/**
 * Deletes (cancels) a specific task via the Runway API.
 * @param params - Task ID.
 * @param body - Contains the API key for authentication.
 * @returns void - Resolves on success (204 No Content from API).
 * @throws Standardized error if the API call fails.
 */
export async function deleteTask(
  params: TaskActionParams,
  body: TaskActionBody,
): Promise<void> {
  const { id } = params;
  const { apiKey } = body;

  try {
    const response = await axios.delete(`${RUNWAY_API_BASE}/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": RUNWAY_API_VERSION,
      },
    });

    // Axios delete typically resolves without data on 2xx status
    // Check for unexpected status codes if necessary, but usually 204 is handled
    if (response.status !== 204) {
      console.warn(
        `[RunwayService] Delete task for ${id} returned status ${response.status}, expected 204.`,
      );
    }

    console.log(`[RunwayService] Task ${id} deleted successfully.`);
  } catch (error: unknown) {
    console.error(`[RunwayService] Error deleting task ${id}:`, error);
    // Re-throw a standardized error message
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as {
        failure?: string;
        error?: string;
      };
      const message =
        errorData?.failure || errorData?.error || "Unknown API error";
      throw new Error(
        `Runway API Error deleting task (${error.response.status}): ${message}`,
      );
    } else if (error instanceof Error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    } else {
      throw new Error(
        "An unknown error occurred while contacting the Runway delete API.",
      );
    }
  }
}
