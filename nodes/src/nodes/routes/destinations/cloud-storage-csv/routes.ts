import { Router } from "express";
import { ErrorResponse } from "../../../../types/api-response"; // Import standard error response type
// import { validateRequest } from "../../../middleware/validate-request";
import validate from "express-zod-safe";
import {
  AppendCloudCsvRequestSchema,
  AppendCloudCsvResponseSchema,
} from "./schema";
import { cloudCsvDestinationService } from "./service";

export const cloudStorageCsvDestinationRouter = Router();

// Route to append data to a CSV file in cloud storage
cloudStorageCsvDestinationRouter.post(
  "/", // Root path for the destination action
  // validateRequest({ body: AppendCloudCsvRequestSchema }),
  validate({ body: AppendCloudCsvRequestSchema }),
  async (req, res) => {
    try {
      const result = await cloudCsvDestinationService.appendCsv(req.body);

      // Structure the success response
      const responsePayload = AppendCloudCsvResponseSchema.parse({
        success: true,
        message: result.message, // Get message from service result
      });

      return res.status(200).json(responsePayload);
    } catch (error) {
      console.error("[CloudStorageCsvDest] Error processing request:", error);

      // Use standard error response format
      const errorResponse: ErrorResponse = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to append data to Cloud Storage CSV.",
        data: null, // Explicitly set data to null
      };

      // Determine status code (e.g., 400 for parsing errors, 500 default)
      let statusCode = 500;
      if (
        error instanceof Error &&
        error.message.includes("Failed to parse existing CSV")
      ) {
        statusCode = 400; // Bad request if existing CSV is malformed
      }
      // Add other specific status code checks if needed

      return res.status(statusCode).json(errorResponse);
    }
  },
);

// Optional: Add OpenAPI endpoint if needed
// cloudStorageCsvDestinationRouter.get("/openapi.json", ...);
