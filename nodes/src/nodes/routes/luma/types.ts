import { z } from "zod";
import {
  ImageGenerationInputSchema,
  ImageGenerationResultDataSchema,
  // ListImageGenerationsResultDataSchema,
  // ListVideoGenerationsResultDataSchema,
  VideoGenerationInputSchema,
  VideoGenerationResultDataSchema,
} from "./schemas/lumaSchemas";

// Video types
export type IVideoGenerationInput = z.infer<typeof VideoGenerationInputSchema>;
export type IVideoGenerationResponse = z.infer<
  typeof VideoGenerationResultDataSchema
>;
/*
export type IListVideoGenerationsResponse = z.infer<
  typeof ListVideoGenerationsResultDataSchema
>;
*/

// Image types
export type IImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>;
export type IImageGenerationResponse = z.infer<
  typeof ImageGenerationResultDataSchema
>;
/*
export type IListImageGenerationsResponse = z.infer<
  typeof ListImageGenerationsResultDataSchema
>;
*/
