import { Router } from "express";
import { ErrorResponse, SuccessResponse } from "../../../../types/api-response";
// import { validateRequest } from "../../../middleware/validate-request";
import validate from "express-zod-safe";
import {
  ReadCloudCsvRequestSchema,
  ReadCloudCsvSuccessResponseSchema,
  ReadResultData,
} from "./schema";
import { cloudCsvSourceService } from "./service";

export const cloudStorageCsvSourceRouter = Router();

// Route to read the CSV file from cloud storage
cloudStorageCsvSourceRouter.post(
  "/", // Root path for the source action
  // validateRequest({ body: ReadCloudCsvRequestSchema }),
  validate({ body: ReadCloudCsvRequestSchema }),
  async (req, res) => {
    try {
      const resultData = await cloudCsvSourceService.readCsv(req.body);

      const successResponse: SuccessResponse<ReadResultData> = {
        success: true,
        data: resultData,
        message: "Successfully read from cloud storage",
      };

      const responsePayload =
        ReadCloudCsvSuccessResponseSchema.parse(successResponse);

      return res.status(200).json(responsePayload);
    } catch (error) {
      console.error("[CloudStorageCsvSource] Error processing request:", error);

      let statusCode = 500;
      let message = "Failed to read or parse CSV from cloud storage.";

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          statusCode = 404;
          message = error.message;
        } else if (error.message.includes("parsing error")) {
          statusCode = 400;
          message = error.message;
        }
        message = error.message || message;
      }

      const errorResponse: ErrorResponse = {
        success: false,
        message: message,
        data: null,
      };

      return res.status(statusCode).json(errorResponse);
    }
  },
);

// Optional: Add OpenAPI endpoint if needed
// cloudStorageCsvSourceRouter.get("/openapi.json", ...);
