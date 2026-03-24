import _ from "lodash"; // Using lodash for deep merging
import { OpenAPIV3_1 } from "openapi-types";
import { createOpenApiDocument as createAudioExtractionDoc } from "./schemas/audioExtractionSchemas";
import { createOpenApiDocument as createClipDoc } from "./schemas/clipSchemas";
import { createOpenApiDocument as createConcatenationDoc } from "./schemas/concatenationSchemas";
import { createOpenApiDocument as createFrameExtractionDoc } from "./schemas/frameExtractionSchemas";
import { createOpenApiDocument as createReplaceAudioDoc } from "./schemas/replaceAudioSchemas";

// Define a base structure or use one of the docs as a base
const baseOpenApiDoc: OpenAPIV3_1.Document = {
  openapi: "3.0.3",
  info: {
    title: "Video Processing Node API",
    version: "1.0.0",
    description:
      "Provides endpoints for video manipulation including concatenation, audio extraction, frame extraction, and clip extraction.",
  },
  paths: {},
  // Keep other top-level fields like servers, components, security, tags if needed
  // Components might need merging if schemas are defined within them
  components: { schemas: {} }, // Initialize components.schemas
  tags: [], // Initialize tags array
};

// Function to create the combined OpenAPI document
export const createOpenApiDocument = (): OpenAPIV3_1.Document => {
  // Get individual documents
  const concatenationDoc = createConcatenationDoc();
  const audioExtractionDoc = createAudioExtractionDoc();
  const frameExtractionDoc = createFrameExtractionDoc();
  const clipDoc = createClipDoc();
  const replaceAudioDoc = createReplaceAudioDoc();

  // Merge paths
  const mergedPaths = _.merge(
    {},
    concatenationDoc.paths,
    audioExtractionDoc.paths,
    frameExtractionDoc.paths,
    clipDoc.paths,
    replaceAudioDoc.paths,
  );

  // Merge components (especially schemas)
  const mergedComponents = _.merge(
    {},
    concatenationDoc.components,
    audioExtractionDoc.components,
    frameExtractionDoc.components,
    clipDoc.components,
    replaceAudioDoc.components,
  );

  // Combine tags from meta sections (ensure uniqueness)
  const allTags = [
    ...(concatenationDoc.meta?.tags || []),
    ...(audioExtractionDoc.meta?.tags || []),
    ...(frameExtractionDoc.meta?.tags || []),
    ...(clipDoc.meta?.tags || []),
    ...(replaceAudioDoc.meta?.tags || []),
  ];
  const uniqueTags = [...new Set(allTags.map((tag) => tag))];
  const mergedTags = uniqueTags.map((tagName) => ({
    name: tagName,
    // You might want to add descriptions for tags here if available/needed
  }));

  // Create the final document
  const finalDoc = _.merge({}, baseOpenApiDoc, {
    paths: mergedPaths,
    components: mergedComponents,
    tags: mergedTags,
    meta: {
      tags: ["video", "media-processing"],
      category: "Media",
      provider: "Graph Compose Video Utils",
      imageUrl:
        "https://storage.cloud.google.com/graph-compose-public/videoops-logo.png",
      sourceUrl: "https://graphcompose.io/recipes",
    },
    // Optionally merge other top-level fields like 'servers' if they exist in individual docs
  });

  return finalDoc;
};
