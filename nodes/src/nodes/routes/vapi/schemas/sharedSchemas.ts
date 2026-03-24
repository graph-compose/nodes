import { z } from "zod";
import "zod-openapi/extend";

// Shared Authentication Schema
export const VapiAuthSchema = z.object({
  apiKey: z.string().openapi({
    description: "Your Vapi API Key (Authorization: Bearer <token>).",
    example: "8f8d8f8d-8f8d-8f8d-8f8d-8f8d8f8d8f8d", // Add example
  }),
});
