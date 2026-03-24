import axios, { AxiosError, AxiosInstance } from "axios";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createAxiosInstance } from "../../../../utils/axios";
import {
  GenerateImageRequestSchema,
  QueryImageTaskResponseDataSchema,
} from "../schemas/imageSchemas";
import {
  BaseTaskResultDataSchema,
  KlingAICredentialsSchema,
} from "../schemas/sharedSchemas";
import {
  GenerateVideoExtensionRequestSchema,
  GenerateVideoFromImageRequestSchema,
  GenerateVideoFromTextRequestSchema,
  QueryVideoTaskResponseDataSchema,
} from "../schemas/videoSchemas";

// Define inferred types for better type safety
type KlingAICredentials = z.infer<typeof KlingAICredentialsSchema>;
type GenerateImageParams = z.infer<typeof GenerateImageRequestSchema>;
type GenerateVideoFromTextParams = z.infer<
  typeof GenerateVideoFromTextRequestSchema
>;
type GenerateVideoFromImageParams = z.infer<
  typeof GenerateVideoFromImageRequestSchema
>;
type GenerateVideoExtensionParams = z.infer<
  typeof GenerateVideoExtensionRequestSchema
>;

// Define expected success response data types (adjust if necessary based on actual API structure)
type ImageTaskResponseData = z.infer<typeof BaseTaskResultDataSchema>; // Base used for initial response
type VideoTaskResponseData = z.infer<typeof BaseTaskResultDataSchema>; // Base used for initial response

// Define specific response types for query results
type QueryImageResultData = z.infer<typeof QueryImageTaskResponseDataSchema>;
type QueryVideoResultData = z.infer<typeof QueryVideoTaskResponseDataSchema>;

export class KlingApiService {
  private readonly client: AxiosInstance;
  private readonly baseUrl = "https://api.klingai.com";

  constructor() {
    this.client = createAxiosInstance(this.baseUrl);
  }

  /**
   * Generates a JWT token for Kling AI API authentication.
   */
  private generateToken(credentials: KlingAICredentials): string {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      iss: credentials.accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800, // Expires in 30 minutes
      nbf: Math.floor(Date.now() / 1000) - 5, // Not before 5 seconds ago
    };
    return jwt.sign(payload, credentials.secretKey, {
      algorithm: "HS256",
      header,
    });
  }

  /**
   * Handles errors from Axios requests, logging and throwing a standardized error.
   */
  private handleApiError(error: unknown, context: string): never {
    let errorMessage = `An unknown error occurred in ${context}.`;
    if (axios.isAxiosError(error)) {
      const apiError = error as AxiosError<{
        message?: string;
        code?: number | string;
      }>; // Type assertion for better error data access
      const responseData = apiError.response?.data;
      errorMessage = `Kling AI API Error in ${context}: Status ${
        apiError.response?.status
      } - ${responseData?.message || apiError.message}`;
      if (responseData?.code) {
        errorMessage += ` (Code: ${responseData.code})`;
      }
      console.error(`[KlingApiService] ${errorMessage}`, responseData);
    } else if (error instanceof Error) {
      errorMessage = `Error in ${context}: ${error.message}`;
      console.error(`[KlingApiService] ${errorMessage}`, error);
    } else {
      console.error(
        `[KlingApiService] Unknown error object in ${context}`,
        error,
      );
    }
    throw new Error(errorMessage);
  }

  // --- Image Generation ---

  /**
   * Initiates an image generation task.
   * @returns The initial task data (ID and status).
   */
  async generateImage(
    params: GenerateImageParams,
  ): Promise<ImageTaskResponseData> {
    const { accessKey, secretKey, ...requestBody } = params;
    console.log(
      `[KlingApiService] Initiating image generation with prompt: ${requestBody.prompt}`,
    );
    const token = this.generateToken({ accessKey, secretKey });

    try {
      const response = await this.client.post<{ data: ImageTaskResponseData }>(
        "/v1/images/generations",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        `[KlingApiService] Image generation task submitted. Task ID: ${response.data.data.task_id}`,
      );
      // Validate response against base schema for initial submission
      return BaseTaskResultDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, "generateImage");
    }
  }

  /**
   * Queries the status of an image generation task.
   * @returns The current task status and results conforming to the specific union schema.
   */
  async queryImageTask(
    auth: KlingAICredentials,
    taskId: string,
  ): Promise<QueryImageResultData> {
    console.log(
      `[KlingApiService] Querying image task status for ID: ${taskId}`,
    );
    const token = this.generateToken(auth);

    try {
      const response = await this.client.get<{ data: unknown }>(
        `/v1/images/generations/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        `[KlingApiService] Image task status retrieved for ${taskId}. Status: ${
          (response.data as any)?.data?.task_status
        }`,
      );
      return QueryImageTaskResponseDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, `queryImageTask (ID: ${taskId})`);
    }
  }

  // --- Video Generation (Text-to-Video) ---

  /**
   * Initiates a video generation task from text.
   * @returns The initial task data (ID and status).
   */
  async generateVideoFromText(
    params: GenerateVideoFromTextParams,
  ): Promise<VideoTaskResponseData> {
    const { accessKey, secretKey, ...requestBody } = params;
    console.log(
      `[KlingApiService] Initiating text-to-video generation with prompt: ${requestBody.prompt}`,
    );
    const token = this.generateToken({ accessKey, secretKey });

    try {
      // Transform duration string ("5s" / "10s") to number (5 / 10)
      const durationNumber = parseInt(
        requestBody.duration?.replace("s", "") || "5",
        10,
      );

      // Prepare the payload for the external API
      const apiPayload = {
        ...requestBody,
        duration: durationNumber, // Use the transformed number
      };
      // Remove fields not expected by this specific external API endpoint if necessary
      // delete apiPayload.someFieldNotInExternalApi;

      console.log(
        "[KlingApiService] Sending payload to /v1/videos/text2video:",
        JSON.stringify(apiPayload, null, 2),
      );

      const response = await this.client.post<{ data: VideoTaskResponseData }>(
        "/v1/videos/text2video",
        apiPayload, // Send the modified payload
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        `[KlingApiService] Text-to-video task submitted. Task ID: ${response.data.data.task_id}`,
      );
      return BaseTaskResultDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, "generateVideoFromText");
    }
  }

  // --- Video Generation (Image-to-Video) ---

  /**
   * Initiates a video generation task from an image.
   * @returns The initial task data (ID and status).
   */
  async generateVideoFromImage(
    params: GenerateVideoFromImageParams,
  ): Promise<VideoTaskResponseData> {
    const { accessKey, secretKey, ...requestBody } = params;
    console.log(`[KlingApiService] Initiating image-to-video generation.`);
    const token = this.generateToken({ accessKey, secretKey });

    try {
      // Transform duration string ("5s" / "10s") to number (5 / 10)
      const durationNumber = parseInt(
        requestBody.duration?.replace("s", "") || "5",
        10,
      );

      // Prepare the payload for the external API
      const apiPayload = {
        ...requestBody,
        duration: durationNumber, // Use the transformed number
      };

      console.log(
        "[KlingApiService] Sending payload to /v1/videos/image2video:",
        JSON.stringify(apiPayload, null, 2),
      );

      const response = await this.client.post<{ data: VideoTaskResponseData }>(
        "/v1/videos/image2video",
        apiPayload, // Send the modified payload
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        `[KlingApiService] Image-to-video task submitted. Task ID: ${response.data.data.task_id}`,
      );
      return BaseTaskResultDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, "generateVideoFromImage");
    }
  }

  // --- Video Extension ---

  /**
   * Initiates a video extension task.
   * @returns The initial task data (ID and status).
   */
  async generateVideoExtension(
    params: GenerateVideoExtensionParams,
  ): Promise<VideoTaskResponseData> {
    const { accessKey, secretKey, ...requestBody } = params;
    console.log(`[KlingApiService] Initiating video extension.`);
    const token = this.generateToken({ accessKey, secretKey });

    try {
      // Prepare the payload ONLY with fields documented for video-extend
      const apiPayload: {
        video_id: string;
        prompt?: string;
        callback_url?: string;
      } = {
        video_id: requestBody.video_id,
      };

      // Add optional fields only if they exist in the validated requestBody
      if (requestBody.prompt) {
        apiPayload.prompt = requestBody.prompt;
      }
      if (requestBody.callback_url) {
        apiPayload.callback_url = requestBody.callback_url;
      }

      // Correct endpoint URL based on documentation
      const endpointUrl = "/v1/videos/video-extend";

      console.log(
        `[KlingApiService] Sending payload to ${endpointUrl}:`,
        JSON.stringify(apiPayload, null, 2),
      );

      const response = await this.client.post<{ data: VideoTaskResponseData }>(
        endpointUrl, // Use the corrected endpoint
        apiPayload, // Send the corrected payload
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        `[KlingApiService] Video extension task submitted. Task ID: ${response.data.data.task_id}`,
      );
      return BaseTaskResultDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, "generateVideoExtension");
    }
  }

  // --- Specific Video Task Queries ---

  /**
   * Queries the status of a TEXT-TO-VIDEO task.
   * @returns The current task status and results conforming to the specific union schema.
   */
  async queryTextToVideoTask(
    auth: KlingAICredentials,
    taskId: string,
  ): Promise<QueryVideoResultData> {
    const context = `queryTextToVideoTask (ID: ${taskId})`;
    console.log(`[KlingApiService] ${context}`);
    const token = this.generateToken(auth);
    const endpointUrl = `/v1/videos/text2video/${taskId}`;

    try {
      const response = await this.client.get<{ data: unknown }>(endpointUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(
        `[KlingApiService] ${context} - Status: ${
          (response.data as any)?.data?.task_status
        }`,
      );
      return QueryVideoTaskResponseDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, context);
    }
  }

  /**
   * Queries the status of an IMAGE-TO-VIDEO task.
   * @returns The current task status and results conforming to the specific union schema.
   */
  async queryImageToVideoTask(
    auth: KlingAICredentials,
    taskId: string,
  ): Promise<QueryVideoResultData> {
    const context = `queryImageToVideoTask (ID: ${taskId})`;
    console.log(`[KlingApiService] ${context}`);
    const token = this.generateToken(auth);
    const endpointUrl = `/v1/videos/image2video/${taskId}`; // Specific endpoint

    try {
      const response = await this.client.get<{ data: unknown }>(endpointUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(
        `[KlingApiService] ${context} - Status: ${
          (response.data as any)?.data?.task_status
        }`,
      );
      return QueryVideoTaskResponseDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, context);
    }
  }

  /**
   * Queries the status of a VIDEO EXTENSION task.
   * @returns The current task status and results conforming to the specific union schema.
   */
  async queryVideoExtensionTask(
    auth: KlingAICredentials,
    taskId: string,
  ): Promise<QueryVideoResultData> {
    const context = `queryVideoExtensionTask (ID: ${taskId})`;
    console.log(`[KlingApiService] ${context}`);
    const token = this.generateToken(auth);
    const endpointUrl = `/v1/videos/video-extend/${taskId}`;

    try {
      const response = await this.client.get<{ data: unknown }>(endpointUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(
        `[KlingApiService] ${context} - Status: ${
          (response.data as any)?.data?.task_status
        }`,
      );
      return QueryVideoTaskResponseDataSchema.parse(response.data.data);
    } catch (error) {
      this.handleApiError(error, context);
    }
  }

  // Note: queryTaskList was present in the original service.ts but not mapped to any route in index.ts.
  // It can be added here if needed, following the same pattern.
}
