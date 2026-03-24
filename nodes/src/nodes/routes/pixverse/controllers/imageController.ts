import axios from "axios"; // Import axios for downloading
import { Request, Response } from "express";
import {
  UploadImageFromUrlRequestSchema,
  UploadImageRequestSchema,
} from "../schemas";
import * as service from "../services";

// Handler for uploading images
export const uploadImageController = async (req: Request, res: Response) => {
  // Multer puts the file info in req.file
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided in the 'img' field.",
    });
  }

  // Zod validation for apiKey in the body
  const bodyValidation = UploadImageRequestSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body.",
      error: bodyValidation.error.errors,
    });
  }

  try {
    const result = await service.uploadImage(
      bodyValidation.data.apiKey, // Pass API Key from validated body
      req.file.buffer, // Pass image buffer from multer
      req.file.originalname, // Pass original filename
    );
    return res.json({ success: true, data: result }); // Return directly
  } catch (error: unknown) {
    console.error("[PixVerse Controller] Error uploading image:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return res.status(500).json({
      success: false,
      message: "Failed to upload image to PixVerse.",
      error: { details: message },
    });
  }
};

// Handler for uploading images from a URL
export const uploadImageFromUrlController = async (
  req: Request,
  res: Response,
) => {
  // Validate JSON body (apiKey, imageUrl)
  const bodyValidation = UploadImageFromUrlRequestSchema.safeParse(req.body);
  if (!bodyValidation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body.",
      error: bodyValidation.error.errors,
    });
  }

  const { apiKey, imageUrl } = bodyValidation.data;
  let imageBuffer: Buffer;
  let filename: string | undefined;

  try {
    // Download the image from the URL
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer", // Get data as a buffer
    });
    imageBuffer = Buffer.from(response.data);

    // Try to extract filename from URL
    try {
      const urlPath = new URL(imageUrl).pathname;
      filename = urlPath.substring(urlPath.lastIndexOf("/") + 1) || undefined;
    } catch {
      // Ignore errors if URL is malformed or path is empty
    }
  } catch (downloadError: unknown) {
    console.error(
      `[PixVerse Controller] Error downloading image from ${imageUrl}:`,
      downloadError,
    );
    const message =
      downloadError instanceof Error
        ? downloadError.message
        : "Failed to download image from URL.";
    return res.status(400).json({
      success: false,
      message: "Failed to download image from the provided URL.",
      error: { details: message },
    });
  }

  try {
    // Upload the downloaded image buffer to PixVerse
    const result = await service.uploadImage(
      apiKey,
      imageBuffer,
      filename, // Pass optional filename
    );
    return res.json({ success: true, data: result });
  } catch (uploadError: unknown) {
    console.error(
      "[PixVerse Controller] Error uploading image buffer to PixVerse:",
      uploadError,
    );

    let status = 500;
    let message = "Failed to upload image to PixVerse after downloading.";
    let details = "An unexpected error occurred during PixVerse upload.";

    if (uploadError instanceof Error) {
      details = uploadError.message;
      // Check if it's an Axios error with a response to get status
      if (axios.isAxiosError(uploadError) && uploadError.response) {
        status = uploadError.response.status; // Use status from PixVerse response
        message = `PixVerse API error (${status}) while uploading image.`;
        details = `PixVerse responded with status ${status}: ${uploadError.message}`;
        if (status === 404) {
          details += ` (Check if the PixVerse upload endpoint '/upload/img' is correct)`;
        }
      }
    }

    return res.status(status).json({
      success: false,
      message: message,
      error: { details: details },
    });
  }
};
