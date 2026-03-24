// functions/src/nodes/routes/pixverse/service.ts
import axios from "axios";
import FormData from "form-data"; // Needed for image uploads
import { Readable } from "stream"; // Needed for image uploads
import { v4 as uuidv4 } from "uuid"; // For generating AI-trace-ID
import { z } from "zod"; // Import z for inferring types
import {
  CreateImageToVideoRequest,
  CreateTextToVideoRequest,
  CreateTransitionRequest,
  PixverseTaskResultData,
  PixverseTaskResultDataSchema,
  PixverseTaskStatusEnum,
  QueryTaskRequest,
} from "../schemas";

const PIXVERSE_API_BASE_URL = "https://app-api.pixverse.ai/openapi/v2";

// --- Helper Functions ---

// Converts a snake_case string to camelCase
const toCamelCase = (str: string): string =>
  str.replace(/([-_][a-z])/gi, ($1) =>
    $1.toUpperCase().replace("-", "").replace("_", ""),
  );

// Recursively maps keys of an object to camelCase
const mapKeysToCamelCase = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(mapKeysToCamelCase);
  }

  return Object.keys(obj).reduce((result: { [key: string]: any }, key) => {
    const camelCaseKey = toCamelCase(key);
    result[camelCaseKey] = mapKeysToCamelCase(obj[key]);
    return result;
  }, {});
};

// Helper to map PixVerse status codes (number) to our enum (string)
const mapPixverseStatus = (
  status: number,
): z.infer<typeof PixverseTaskStatusEnum> => {
  switch (status) {
    case 1:
      return "succeed";
    case 5:
      return "processing";
    case 7:
      return "moderation_failed";
    case 8:
      return "failed";
    default:
      console.warn(`Unknown PixVerse status code received: ${status}`);
      return "failed"; // Default to failed for unknown codes
  }
};

// --- Image Upload Service ---

// IMPORTANT: This function assumes the image data is passed as a Buffer.
// The route handler MUST use middleware like `multer` to extract the
// image file from the multipart/form-data request and provide it as a Buffer.
export const uploadImage = async (
  apiKey: string,
  imageBuffer: Buffer,
  filename = "upload.png", // Default filename, can be overridden
): Promise<{ imgId: number }> => {
  const aiTraceId = uuidv4();
  const formData = new FormData();

  // Convert Buffer to Readable stream for FormData append
  const imageStream = Readable.from(imageBuffer);
  formData.append("image", imageStream, {
    filename: filename,
    // Content type might be helpful if known, but often auto-detected
    // contentType: 'image/png', // Example
  });

  try {
    const response = await axios.post(
      `${PIXVERSE_API_BASE_URL}/image/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(), // Crucial for multipart/form-data
          "API-KEY": apiKey,
          "AI-trace-ID": aiTraceId,
        },
        maxBodyLength: Infinity, // Recommended for file uploads
        maxContentLength: Infinity,
      },
    );

    // Validation
    if (response.data?.ErrCode !== 0 || !response.data?.Resp?.img_id) {
      console.error("PixVerse Error (Upload Image):", response.data);
      throw new Error(
        `PixVerse API error uploading image: ${
          response.data?.ErrMsg || "Unknown error"
        }`,
      );
    }

    return { imgId: response.data.Resp.img_id };
  } catch (error) {
    console.error("Error calling PixVerse uploadImage:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("PixVerse Upload API Error Response:", error.response.data);
      throw new Error(
        `PixVerse API upload request failed: ${
          error.response.data?.ErrMsg || error.message
        }`,
      );
    }
    throw error;
  }
};

// --- Text-to-Video Service ---
export const createTextToVideo = async (
  request: CreateTextToVideoRequest,
): Promise<{ videoId: number }> => {
  const { apiKey, ...pixverseParamsSnake } = request;

  const aiTraceId = uuidv4();
  try {
    const response = await axios.post(
      `${PIXVERSE_API_BASE_URL}/video/text/generate`,
      pixverseParamsSnake, // Send snake_case params directly
      {
        headers: {
          "API-KEY": apiKey,
          "Ai-trace-id": aiTraceId, // Corrected case
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data?.ErrCode !== 0 || !response.data?.Resp?.video_id) {
      console.error("PixVerse Error (Create Text):", response.data);
      throw new Error(
        `PixVerse API error creating text task: ${
          response.data?.ErrMsg || "Unknown error"
        }`,
      );
    }
    return { videoId: response.data.Resp.video_id };
  } catch (error) {
    console.error("Error calling PixVerse createTextToVideo:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "PixVerse Create Text API Error Response:",
        error.response.data,
      );
      throw new Error(
        `PixVerse API request failed: ${
          error.response.data?.ErrMsg || error.message
        }`,
      );
    }
    throw error;
  }
};

// --- Image-to-Video Service ---
export const createImageToVideo = async (
  request: CreateImageToVideoRequest,
): Promise<{ videoId: number }> => {
  const { apiKey, ...pixverseParams } = request;
  const aiTraceId = uuidv4();
  try {
    const response = await axios.post(
      `${PIXVERSE_API_BASE_URL}/video/img/generate`,
      pixverseParams,
      {
        headers: {
          "API-KEY": apiKey,
          "AI-trace-ID": aiTraceId,
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data?.ErrCode !== 0 || !response.data?.Resp?.video_id) {
      console.error("PixVerse Error (Create Image):", response.data);
      throw new Error(
        `PixVerse API error creating image task: ${
          response.data?.ErrMsg || "Unknown error"
        }`,
      );
    }
    return { videoId: response.data.Resp.video_id };
  } catch (error) {
    console.error("Error calling PixVerse createImageToVideo:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "PixVerse Create Image API Error Response:",
        error.response.data,
      );
      throw new Error(
        `PixVerse API request failed: ${
          error.response.data?.ErrMsg || error.message
        }`,
      );
    }
    throw error;
  }
};

// --- Transition Service ---
export const createTransition = async (
  request: CreateTransitionRequest,
): Promise<{ videoId: number }> => {
  const { apiKey, ...pixverseParams } = request;
  const aiTraceId = uuidv4();
  try {
    const response = await axios.post(
      `${PIXVERSE_API_BASE_URL}/video/transition/generate`,
      pixverseParams,
      {
        headers: {
          "API-KEY": apiKey,
          "AI-trace-ID": aiTraceId,
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data?.ErrCode !== 0 || !response.data?.Resp?.video_id) {
      console.error("PixVerse Error (Create Transition):", response.data);
      throw new Error(
        `PixVerse API error creating transition task: ${
          response.data?.ErrMsg || "Unknown error"
        }`,
      );
    }
    return { videoId: response.data.Resp.video_id };
  } catch (error) {
    console.error("Error calling PixVerse createTransition:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        "PixVerse Create Transition API Error Response:",
        error.response.data,
      );
      throw new Error(
        `PixVerse API request failed: ${
          error.response.data?.ErrMsg || error.message
        }`,
      );
    }
    throw error;
  }
};

// --- Task Status Service ---
export const getTaskStatus = async (
  request: QueryTaskRequest,
): Promise<PixverseTaskResultData> => {
  const { apiKey, videoId } = request;
  const aiTraceId = uuidv4();
  try {
    const response = await axios.get(
      `${PIXVERSE_API_BASE_URL}/video/result/${videoId}`,
      {
        headers: {
          "API-KEY": apiKey,
          "AI-trace-ID": aiTraceId,
        },
      },
    );
    if (response.data?.ErrCode !== 0 || !response.data?.Resp) {
      console.error("PixVerse Error (Status):", response.data);
      throw new Error(
        `PixVerse API error getting status: ${
          response.data?.ErrMsg || "Unknown error"
        }`,
      );
    }
    const pixverseResult = response.data.Resp;
    const partialResult: Partial<PixverseTaskResultData> & {
      [key: string]: any;
    } = {
      videoId: pixverseResult.id,
      status: mapPixverseStatus(pixverseResult.status),
      prompt: pixverseResult.prompt,
      negative_prompt: pixverseResult.negative_prompt,
      style: pixverseResult.style,
      seed: pixverseResult.seed,
      outputWidth: pixverseResult.outputWidth,
      outputHeight: pixverseResult.outputHeight,
      size: pixverseResult.size,
      create_time: pixverseResult.create_time,
      modify_time: pixverseResult.modify_time,
      url: pixverseResult.status === 1 ? pixverseResult.url : undefined,
    };
    const mappedKeys = Object.keys(partialResult);
    for (const key in pixverseResult) {
      if (!mappedKeys.includes(key) && key !== "id" && key !== "status") {
        partialResult[key] = pixverseResult[key];
      }
    }
    const validatedResult = PixverseTaskResultDataSchema.parse(partialResult);
    return validatedResult;
  } catch (error) {
    console.error(
      `Error calling PixVerse getTaskStatus for videoId ${videoId}:`,
      error,
    );
    if (axios.isAxiosError(error) && error.response) {
      console.error("PixVerse Status API Error Response:", error.response.data);
      throw new Error(
        `PixVerse API request failed: ${
          error.response.data?.ErrMsg || error.message
        }`,
      );
    } else if (error instanceof z.ZodError) {
      console.error(
        "Zod validation error mapping PixVerse status:",
        error.errors,
      );
      throw new Error(
        "Failed to map PixVerse status response to internal schema.",
      );
    }
    throw error;
  }
};
