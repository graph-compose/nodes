# Route Building Standards

Below is a detailed overview of the recommended code organization and best practices for structuring and maintaining nodes. It brings together directory layout, Zod schema design, request/response handling, and OpenAPI generation to help write consistent, maintainable code and onboard new contributors.

---

## 1. Directory Structure

The standard **recommended** directory structure for a node (using `klingai` as an example) groups files by feature:

```
klingai/                # Node Root
  ├── image/            # Feature: Image Generation
  │   ├── controllers/
  │   │   └── imageController.ts
  │   ├── services/
  │   │   └── imageService.ts
  │   ├── schemas/
  │   │   └── imageSchemas.ts
  │   ├── router.ts     # Router specifically for /image routes
  │   └── openapi.ts    # OpenAPI document specifically for /image
  │
  ├── task/             # Feature: Task Management
  │   ├── controllers/
  │   │   └── taskController.ts
  │   ├── services/
  │   │   └── taskService.ts
  │   ├── schemas/
  │   │   └── taskSchemas.ts
  │   ├── router.ts     # Router specifically for /task routes
  │   └── openapi.ts    # OpenAPI document specifically for /task
  │
  ├── middleware/       # Shared middleware for the node
  │   └── auth.ts
  │
  ├── router.ts         # Top-level node router (mounts feature routers)
  └── openapi.ts        # Top-level node OpenAPI (aggregates feature OpenAPIs)
```

This structure promotes modularity and is ideal for complex nodes with distinct features.

### Alternative Flat Structure (for Simpler Nodes)

For nodes with fewer, tightly coupled features (like a utility node with 1-3 related endpoints), a flatter structure is also acceptable:

```
simplenode/             # Node Root
  ├── controllers/
  │   ├── featureOneController.ts
  │   └── featureTwoController.ts
  ├── services/
  │   ├── featureOneService.ts
  │   └── featureTwoService.ts
  ├── schemas/
  │   ├── featureOneSchemas.ts
  │   └── featureTwoSchemas.ts
  │   └── sharedSchemas.ts # Optional: For common schemas
  │
  ├── middleware/       # Optional: Shared middleware
  │   └── logging.ts
  │
  ├── router.ts         # Single router defining all node routes
  └── openapi.ts        # Single OpenAPI document for the entire node
```

**Choose the structure that best fits the complexity and organization of the specific node.** For nodes expected to grow or containing clearly distinct functionalities, the feature-grouped structure is preferred.

### Folder Responsibilities

1.  **`controllers/`**
    *   **Handles HTTP Request/Response** for each action.
    *   Validates request data (using Zod schemas from `schemas/`), calls the appropriate service methods from `services/`, and formats responses.
    *   Keeps logic minimal, focused on request/response flow.

2.  **`services/`**
    *   **Core Business Logic** for each feature (e.g., image generation, video extension).
    *   Contains the domain logic, external API calls, transformation of external data, error handling logic specific to the service integration.

3.  **`schemas/`**
    *   **Zod Validation** schemas for input (requests) and output (responses).
    *   Place field-level or object-level OpenAPI documentation here (via `.openapi({ description, example })`).
    *   May contain functions to generate parts of the OpenAPI document related to schemas.

4.  **`middleware/`**
    *   **Reusables** for request/response pipelines (e.g., shared authentication checks, logging). Often optional.

5.  **`router.ts`**
    *   **Top-Level Express Router** that consolidates all node actions/features.
    *   Points each HTTP route (e.g., `/image/generate`) to the correct controller handler in `controllers/`.
    *   Minimal logic here—it's mainly "wiring" code connecting routes to controllers.

6.  **`openapi.ts`**
    *   **Combines Zod schemas** (field-level descriptions from `schemas/`) with **router-level** workflow documentation.
    *   Defines endpoint paths, summaries, extended usage notes, etc.
    *   Uses tools like `zod-openapi`'s `createDocument` to generate or merge the final OpenAPI specification for the node. Contains the primary `createOpenApiDocument` function.

---

## 2. Core Principles

1.  **HTTP Methods**
    *   Only support POST methods at this time.
    *   All endpoints should be asynchronous by default.
    *   Use appropriate status codes (200 for success, 500 for errors).

2.  **Route Structure**
    *   **Router Paths (`router.ts`):** Routes defined in the node's `router.ts` file should be organized by feature/action **relative to the service name**. These paths do **NOT** include the service name prefix.
        *   Example: In `klingai/router.ts`, define routes like `router.post('/image/generate', ...)` and `router.post('/task/status', ...)`. These define paths *relative* to the service base.
    *   **OpenAPI Path Definitions (`openapi.ts`):** In contrast to the router, path keys defined in the `paths` object of the `openapi.ts` file **MUST** include the service name as the first segment.
        *   Example: For the `klingai` service, the path for generating an image **MUST** be defined in `openapi.ts` as `'/klingai/image/generate'`. The path for getting task status **MUST** be `'/klingai/task/status'`. This is crucial for the central documentation generation.
    *   **Global Path Prefix (`/nodes`):** The main application router (`src/nodes/routes/index.ts`) automatically prefixes all defined node paths with `/nodes`. This means the final accessible URL includes `/nodes`, the service name, and the relative path.
        *   Example: The path `'/klingai/image/generate'` defined in `klingai/openapi.ts` becomes accessible globally at `/nodes/klingai/image/generate`.
    *   **Documentation Consistency:** When documenting workflows or providing full path examples in OpenAPI `description` fields within `openapi.ts`, always use the complete global path, including the `/nodes` prefix (e.g., "Poll the `/nodes/klingai/task/status` endpoint...").
    *   **Router Mounting (`src/nodes/routes/index.ts`):** The main router is responsible for mounting the node's router using the service name.
        *   Example: `apiRouter.use('/klingai', klingaiRouter);` correctly maps requests like `/nodes/klingai/image/generate` to the `/image/generate` route handler defined in `klingai/router.ts`.

3.  **Naming Conventions**
    *   Files: Follow the directory structure outlined above (e.g., `imageController.ts`, `imageService.ts`, `imageSchemas.ts`). Use camelCase or PascalCase as appropriate for file and class/function names.
    *   Schemas:
        *   Request: `{Action}{Feature}RequestSchema` (e.g., `GenerateImageRequestSchema`) - Resides in `schemas/`.
        *   Response Data: `{Feature}ResultDataSchema` (e.g., `TaskResultDataSchema`) - Resides in `schemas/`.
        *   Response Wrapper: `{Action}{Feature}ResponseSchema` (e.g., `GenerateImageResponseSchema`, often wrapping `ResultDataSchema` with `SuccessResponseSchema`) - Resides in `schemas/`.

---

## 3. Schema Standards (`schemas/`)

1.  **Request Schemas**
    *   Define the structure and validation rules for request bodies.
    *   Include authentication fields first, followed by service-specific parameters.
    *   Use `.openapi()` extensively for descriptions and examples.
    ```typescript
    // schemas/imageSchemas.ts
    import { z } from 'zod';
    import { zodOpenApi } from '@common/zod-openapi'; // Assuming a helper exists

    export const GenerateImageRequestSchema = z.object({
      // Authentication (always first)
      accessKey: z.string().openapi({ description: "Service Access Key" }),
      secretKey: z.string().openapi({ description: "Service Secret Key" }),

      // Request parameters (service-specific)
      prompt: z.string().openapi({ description: "Detailed description for image generation" }),
      // ... other parameters
    }).openapi({
      description: "Request body for POST /nodes/klingai/image/generate endpoint"
    });
    ```

2.  **Response Schemas**
    *   Define the core structure of successful response data.
    *   Use `.passthrough()` to allow additional fields returned by the service, preventing breaking changes if the external API adds data.
    *   Wrap the data schema with a standardized response format (e.g., `SuccessResponseSchema`).
    ```typescript
    // schemas/taskSchemas.ts or sharedSchemas.ts
    import { z } from 'zod';
    import { SuccessResponseSchema } from '@common/schemas'; // Assuming a common success wrapper

    // Define the core result data
    export const TaskResultDataSchema = z.object({
      taskId: z.string().openapi({ description: "Unique identifier for the asynchronous task." }),
      status: z.enum(["submitted", "processing", "succeed", "failed"]).openapi({ description: "Current status of the task." }),
      // ... other common task fields
    })
    .passthrough() // Allow additional fields from service
    .openapi({
      description: "Core response data containing task information."
    });

    // schemas/imageSchemas.ts
    import { TaskResultDataSchema } from './taskSchemas'; // Or from shared

    // Wrap with standardized response format for a specific action
    export const GenerateImageResponseSchema = SuccessResponseSchema(TaskResultDataSchema);
    ```

3.  **Handling External Service Responses (especially async tasks)**
    *   Design schemas to handle various states (processing, success, failure).
    *   Use `.optional()` for fields that only appear in specific states (e.g., results only present on "succeed").
    *   Use `.partial()` if multiple fields within an object might be absent during certain states.
    *   Always use `.passthrough()` on the main data object schema (`TaskResultDataSchema` in the example) to accommodate unexpected fields from the external API.
    *   Document all possible states and variations clearly in the OpenAPI descriptions.

    ```typescript
    // schemas/videoSchemas.ts
    import { z } from 'zod';

    // Schema for the result data specific to video, potentially partial during processing
    export const VideoResultSchema = z.object({
      videos: z.array(z.string().url()).openapi({ description: "URLs of the generated videos." }),
      duration: z.number().optional().openapi({ description: "Duration of the video in seconds." }),
      // ... other video-specific results
    })
    .partial() // Allow fields to be optional if they appear incrementally
    .passthrough(); // Allow extra fields from the service

    // schemas/taskSchemas.ts (refined example for async)
    export const TaskResultDataSchema = z.object({
      taskId: z.string(),
      status: z.enum(["submitted", "processing", "succeed", "failed"]),
      statusMessage: z.string().optional().openapi({ description: "Additional status details, especially for failures." }),
      result: z.any().optional(), // Placeholder for various result types, use discriminated unions if possible or refine per-action
      createdAt: z.number().int().openapi({ description: "Timestamp when the task was created (Unix epoch)." }),
      updatedAt: z.number().int().openapi({ description: "Timestamp when the task was last updated (Unix epoch)." })
    })
    .passthrough()
    .openapi({
      description: `Task result data structure.
      - When status is "submitted" or "processing": 'result' may be absent or incomplete.
      - When status is "succeed": 'result' contains the complete data (e.g., conforming to VideoResultSchema).
      - When status is "failed": check 'statusMessage' for error details.`
    });

    // Example specific response schema using the task schema
    // schemas/videoSchemas.ts
    import { TaskResultDataSchema } from './taskSchemas'; // or shared
    import { VideoResultSchema } from './videoSchemas';
    import { SuccessResponseSchema } from '@common/schemas';

    // Define a more specific task result for video success state
    const VideoTaskSuccessDataSchema = TaskResultDataSchema.extend({
        status: z.literal("succeed"),
        result: VideoResultSchema.required(), // Make result required and specific for success
    });
    const VideoTaskProcessingDataSchema = TaskResultDataSchema.extend({
        status: z.enum(["submitted", "processing"]),
        result: VideoResultSchema.optional(), // Result might be partially available or absent
    });
     const VideoTaskFailedDataSchema = TaskResultDataSchema.extend({
        status: z.literal("failed"),
        result: z.undefined().optional(), // Result typically absent on failure
    });

    // Use a union to represent all possible valid states
    export const VideoTaskResultDataSchema = z.union([
        VideoTaskSuccessDataSchema,
        VideoTaskProcessingDataSchema,
        VideoTaskFailedDataSchema,
    ]).openapi({ description: "Complete task status object for video operations, handling different states."});


    export const GenerateVideoResponseSchema = SuccessResponseSchema(VideoTaskResultDataSchema);
    ```

---

## 4. Error Handling (`services/` & `controllers/`)

1.  **Error Responses**
    *   Use HTTP status code 500 for all operational errors originating from the node/service interaction. Client errors like invalid input (400) should ideally be caught by validation middleware before hitting the controller.
    *   Error handling logic (catching errors from external API calls, database interactions, etc.) resides primarily in the **`services/`** layer.
    *   Services should attempt to normalize external errors into a standard internal error format if possible, or at least log them effectively before re-throwing.
    *   Controllers (`controllers/`) catch errors propagated from the service layer and format them into the standardized JSON error response.
    *   Standardized Error Response Format:
        ```json
        {
          "success": false,
          "message": "Human-readable summary of the error.",
          "error": { // Optional: Provide more context if safe and useful
            "code": "SERVICE_API_ERROR", // Optional: Internal error code
            "details": "Specific details about what went wrong." // Can be error message from service or custom message
            // Potentially include original error details during development/debugging but avoid in production
          }
        }
        ```

2.  **Service Error Handling Example**
    ```typescript
    // services/someApiService.ts
    import axios from 'axios';

    async function callExternalApi(params: any) {
      try {
        const response = await axios.post('external-api-url', params);
        return response.data;
      } catch (error: unknown) {
        console.error(`[SomeApiService] API Error calling external API:`, error); // Log detailed error internally
        
        // Re-throw a more specific error or the original error
        if (axios.isAxiosError(error) && error.response) {
          // Extract useful info if possible, maybe create a custom error class
          throw new Error(`External API request failed with status ${error.response.status}: ${error.response.data?.message || 'No details'}`);
        } else if (error instanceof Error) {
           throw new Error(`Failed to interact with external API: ${error.message}`);
        } else {
          throw new Error('An unknown error occurred while calling the external API.');
        }
      }
    }
    ```

3.  **Controller Error Handling Example**
    ```typescript
    // controllers/someController.ts
    import { Request, Response } from 'express';
    import * as service from '../services/someApiService'; // Assuming service functions are exported

    export async function handleGenerateAction(req: Request, res: Response) {
      try {
        // Input already validated by middleware
        const result = await service.callExternalApi(req.body);
        // Assuming result needs transformation before sending
        const responseData = service.transformResult(result); // Transformation might also be in the service
        
        res.json({
          success: true,
          data: responseData // Assumes responseData matches a Zod schema like GenerateActionResponseSchema
        });
      } catch (error: unknown) {
        console.error(`[SomeController] Error during handleGenerateAction:`, error); // Log controller-level context
        
        const message = error instanceof Error ? error.message : "An unexpected error occurred during the operation.";
        
        res.status(500).json({
          success: false,
          message: "Failed to complete the requested action.", // User-friendly message
          error: { // Provide generic or specific details as appropriate
              details: message
          }
        });
      }
    }
    ```

4.  **Request Validation**
    *   Use middleware like `express-zod-safe` (or similar) in `router.ts` to validate request bodies, query params, etc., against Zod schemas defined in `schemas/`.
    *   Import the `validate` function from `express-zod-safe`.
    *   Apply it as middleware to your Express routes *before* the controller handler.
    *   This ensures controllers receive validated data and handles validation errors (typically returning a 400 Bad Request response with details) automatically before the controller logic runs.
    ```typescript
    // router.ts
    import express from 'express';
    import { validate } from 'express-zod-safe'; // Import the validation middleware
    import { GenerateImageRequestSchema } from './schemas/imageSchemas';
    import * as imageController from './controllers/imageController';

    const router = express.Router();

    // Apply validation middleware before the controller
    // The validate function takes an object specifying which parts of the request to validate
    // (e.g., body, query, params) against the provided Zod schemas.
    router.post("/image/generate",
      validate({ body: GenerateImageRequestSchema }), // Validate the request body
      imageController.generateImage // Handler only runs if validation passes
    );

    // Example with query parameter validation
    // import { GetStatusQuerySchema } from './schemas/taskSchemas';
    // router.get("/task/status",
    //   validate({ query: GetStatusQuerySchema }), // Validate query parameters
    //   taskController.getStatus
    // );

    // ... other routes

    export default router; // Export for use in src/nodes/routes/index.ts
    ```

---

## 5. Documentation Standards (`openapi.ts`, `schemas/`, `router.ts`)

1.  **OpenAPI Document Generation (`openapi.ts`)**
    *   Each node MUST provide its OpenAPI specification via an exported `createOpenApiDocument` function in its `openapi.ts` file.
    *   This function generates the OpenAPI document using `createDocument` from `zod-openapi` (or similar).
    *   It combines schemas (imported from `schemas/`) with path-level information (summaries, descriptions, workflows, tags, etc.).
    *   **Do not use `$ref`** in schema definitions within the generated document; embed the schemas directly. The tooling typically handles this.
    *   The `meta` property should be included with tags, provider info, category, etc.

2.  **Local OpenAPI Endpoint (`router.ts`)**
    *   Each node's `router.ts` file **MUST** define a `GET /openapi.json` endpoint.
    *   This endpoint **MUST** call the `createOpenApiDocument` function (imported from `./openapi.ts`) and return the generated OpenAPI JSON document.
    *   This provides a way to access the specific documentation for a single node directly.
    *   The full path for this endpoint will be `/nodes/{serviceName}/openapi.json`.

3.  **OpenAPI Document Structure (`openapi.ts`)**
    ```typescript
    // openapi.ts
    import { createDocument } from 'zod-openapi'; // Or your specific library/helper
    import { GenerateImageRequestSchema, GenerateImageResponseSchema } from './schemas/imageSchemas';
    import { TaskStatusRequestSchema, TaskStatusResponseSchema } from './schemas/taskSchemas'; // Example

    export const createOpenApiDocument = () => {
      const document = createDocument({
        openapi: '3.1.0', // Use the appropriate version
        info: {
          title: 'Kling AI Node API',
          version: '1.0.0',
          description: 'Provides endpoints for interacting with the Kling AI service for video generation.',
        },
        paths: {
          // Path definition structure (NO /nodes/{serviceName} prefix here)
          '/image/generate': {
            post: {
              summary: 'Generate Image Task',
              description: `Starts an asynchronous task to generate an image based on a prompt.

**NOTE:** All endpoints are automatically prefixed with /nodes/{serviceName} in our system.
The full path for this endpoint is **/nodes/klingai/image/generate**

**AUTHENTICATION:**
Requires \`accessKey\` and \`secretKey\` provided in the request body. Obtain these from your Kling AI account dashboard.

**WORKFLOW:**
1. Submit request to this endpoint with parameters (prompt, etc.).
2. Receive a \`taskId\` in the response (\`data.taskId\`).
3. Use the \`taskId\` to poll the **/nodes/klingai/task/status** endpoint until the task \`status\` is "succeed" or "failed".
4. If "succeed", the image details will be in the \`result\` object of the status response.

**ERROR HANDLING:**
- Returns 500 on internal server errors or issues communicating with Kling AI. Check the \`message\` and \`error\` fields.
- Validation errors (400) are handled by middleware before this endpoint is reached.

**BEST PRACTICES:**
- Use specific and detailed prompts for best results.
- Implement polling for the task status with appropriate delays (e.g., exponential backoff).`,
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: GenerateImageRequestSchema, // Reference the Zod schema directly
                  },
                },
              },
              responses: {
                '200': {
                  description: 'Task submitted successfully. Returns the task ID.',
                  content: {
                    'application/json': {
                      schema: GenerateImageResponseSchema, // Reference the Zod schema
                    },
                  },
                },
                '500': {
                  description: 'Internal Server Error or Service Error',
                  // Add reference to standard error response schema if available
                },
              },
              tags: ['Image', 'Async Task'], // Add relevant tags
            },
          },
          // ... other paths like /task/status
          '/task/status': {
            post: {
              summary: 'Get Task Status',
              description: `Retrieves the status and results (if available) of an asynchronous task.

**Full Path:** **/nodes/klingai/task/status**

**WORKFLOW:**
1. Submit the \`taskId\` obtained from an initial request (e.g., /image/generate).
2. Poll this endpoint until \`status\` is "succeed" or "failed".
3. Results are populated in the \`result\` field upon success.`,
              requestBody: {
                 required: true,
                 content: {
                   'application/json': {
                     schema: TaskStatusRequestSchema, // Assuming TaskStatusRequestSchema exists
                   },
                 },
               },
              responses: {
                 '200': {
                   description: 'Current task status and results (if complete).',
                   content: {
                     'application/json': {
                       schema: TaskStatusResponseSchema, // Assuming TaskStatusResponseSchema exists
                     },
                   },
                 },
                 '500': {
                   description: 'Error retrieving task status.',
                 },
               },
               tags: ['Task Management', 'Async Task'],
            }
          }
        },
        // Components section might be auto-generated by the tool based on schemas
        components: {
           // schemas: { ...auto-generated... }
           // securitySchemes: { ... if needed ... }
        }
      });

      // Add custom metadata
      return {
        ...document,
        meta: {
          tags: ['AI', 'Video Generation', 'Image Generation'], // High-level tags for the node
          provider: 'Kling AI',
          category: 'AI/ML',
          imageUrl: 'url-to-kling-ai-icon.png',
          sourceUrl: 'url-to-kling-ai-documentation.com',
          async: true, // Indicates if the node primarily involves async operations
          complexity: 'medium', // Subjective complexity (low, medium, high)
        },
      };
    };

    ```

4.  **Schema Documentation (`schemas/`)**
    *   Use `.openapi({ description: "...", example: "..." })` liberally on Zod schemas and their fields to provide clear explanations and example values. This documentation is automatically picked up by `zod-openapi`.

5.  **Workflow Documentation**
    *   Clearly document multi-step processes (like async task submission and polling) within the `description` field of the relevant OpenAPI path definitions in `openapi.ts`.
    *   Explain the flow, expected statuses, and how to retrieve results.

---

## 6. Service Integration (`services/`)

1.  **Service Layer Responsibility**
    *   Isolate all interactions with the external service/API within the `services/` files (e.g., `klingai/services/imageService.ts`).
    *   Handle authentication details (e.g., exchanging keys for temporary tokens if needed).
    *   Make the actual external API calls (using `axios` or similar).
    *   Transform external API responses into the structure defined by our internal Zod schemas (`schemas/`).
    *   Implement robust error handling for API calls (retries, specific error parsing, logging). See Error Handling section.
    *   Contain the core business logic associated with the node's functionality.

2.  **Response Handling & Transformation**
    *   Use `.passthrough()` on response Zod schemas (`schemas/`) to be resilient to unexpected fields from the external API.
    *   The service layer (`services/`) is responsible for mapping the raw API response to the fields defined in our Zod schemas. Log warnings if unexpected data is received or required data is missing.
    *   Ensure the data returned by service functions conforms to the agreed-upon Zod response schemas.

---

## 7. Implementation Example Snippets

```typescript
// klingai/schemas/imageSchemas.ts
import { z } from 'zod';
import { SuccessResponseSchema } from '@common/schemas';
import { TaskResultDataSchema } from './taskSchemas'; // Assuming a shared task schema

export const GenerateImageRequestSchema = z.object({
  accessKey: z.string().openapi({ description: "Kling AI Access Key" }),
  secretKey: z.string().openapi({ description: "Kling AI Secret Key" }),
  prompt: z.string().openapi({ description: "Image generation prompt" }),
}).openapi({ description: "Request to start image generation." });

export const GenerateImageResponseSchema = SuccessResponseSchema(TaskResultDataSchema)
  .openapi({ description: "Response containing the initial task ID for image generation." });

// --------------------------------------------

// klingai/services/imageService.ts
import axios from 'axios';
import { TaskResultDataSchema } from '../schemas/taskSchemas'; // Import Zod schema for type safety + validation potentially
import type { z } from 'zod'; // Import z type for inference

// Define type based on Zod schema
type TaskResult = z.infer<typeof TaskResultDataSchema>;
type GenerateParams = { accessKey: string; secretKey: string; prompt: string }; // Could also use z.infer

const KLING_API_ENDPOINT = 'https://api.klingai.com/v1'; // Example endpoint

export async function startImageGeneration(params: GenerateParams): Promise<TaskResult> {
  try {
    // 1. Handle Authentication (if needed beyond simple key passing)
    // const authToken = await getAuthToken(params.accessKey, params.secretKey);

    // 2. Call External API
    const response = await axios.post(`${KLING_API_ENDPOINT}/images/generate`, {
        prompt: params.prompt,
      }, {
        headers: {
            // 'Authorization': `Bearer ${authToken}`, // Example auth
            'X-Api-Key': params.accessKey, // Simpler auth example
            'X-Secret-Key': params.secretKey
        }
    });

    // 3. Transform Response to our Schema
    // Assume API returns { job_id: 'xyz', current_status: 'pending' }
    const rawData = response.data;
    const transformedData: TaskResult = {
        taskId: rawData.job_id,
        status: mapExternalStatus(rawData.current_status), // Use a mapping function
        statusMessage: rawData.status_details || undefined,
        createdAt: Date.now(), // Or use timestamp from API if available
        updatedAt: Date.now(), // Or use timestamp from API if available
        // result will be populated later via status check
    };

    // 4. (Optional) Validate transformed data against our Zod schema before returning
    // TaskResultDataSchema.parse(transformedData); // Throws if mismatch

    return transformedData;

  } catch (error: unknown) {
    console.error('[ImageService] Error starting image generation:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Kling API Error (${error.response.status}): ${error.response.data?.message}`);
    }
    throw error; // Re-throw standardized or original error
  }
}

// Helper function to map external statuses to our internal enum
function mapExternalStatus(externalStatus: string): TaskResult['status'] {
    switch(externalStatus?.toLowerCase()) {
        case 'pending':
        case 'submitted': return 'submitted';
        case 'running':
        case 'processing': return 'processing';
        case 'completed':
        case 'success': return 'succeed';
        case 'error':
        case 'failed': return 'failed';
        default: return 'failed'; // Default to failed if unknown
    }
}
// ... other service functions like getTaskStatus ...

// --------------------------------------------

// klingai/controllers/imageController.ts
import { Request, Response } from 'express';
import * as imageService from '../services/imageService';
import { GenerateImageRequestSchema } from '../schemas/imageSchemas'; // Import Zod schema for type inference
import type { z } from 'zod';

// Infer type from Zod schema for req.body - validation is done by middleware
type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;

export async function generateImage(req: Request<{}, {}, GenerateImageRequest>, res: Response) {
  try {
    // req.body is already validated by middleware
    const taskResult = await imageService.startImageGeneration(req.body);

    // Response should match GenerateImageResponseSchema structure
    res.json({
      success: true,
      data: taskResult // Already transformed by service
    });

  } catch (error: unknown) {
    console.error('[ImageController] Failed generating image:', error);
    res.status(500).json({
      success: false,
      message: "Failed to start image generation task.",
      error: { details: error instanceof Error ? error.message : "Unknown service error" }
    });
  }
}
// ... other controller functions ...

// --------------------------------------------

// klingai/router.ts
import express from 'express';
import { validate } from 'express-zod-safe';
import * as imageController from './controllers/imageController';
// import * as taskController from './controllers/taskController'; // Example
import { GenerateImageRequestSchema } from './schemas/imageSchemas';
// import { TaskStatusRequestSchema } from './schemas/taskSchemas'; // Example for task status body
// import { GetStatusQuerySchema } from './schemas/taskSchemas'; // Example for task status query
import { createOpenApiDocument } from './openapi'; // Import the doc generator

const router = express.Router();

// Define routes relative to the service base path (/klingai)
// Use the validate middleware to automatically validate the request body
// against the GenerateImageRequestSchema before the controller is called.
router.post('/image/generate',
  validate({ body: GenerateImageRequestSchema }),
  imageController.generateImage
);

// Example: Task status endpoint potentially using a POST with a body
// router.post('/task/status',
//   validate({ body: TaskStatusRequestSchema }), // Validate body
//   taskController.getTaskStatus
// );

// Example: Task status endpoint potentially using GET with query parameters
// router.get('/task/status',
//   validate({ query: GetStatusQuerySchema }), // Validate query params
//   taskController.getTaskStatusQuery
// );


// Add local OpenAPI endpoint
router.get('/openapi.json', (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    // Add explicit cache control headers for GET requests
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    res.json(openApiDoc);
  } catch (error) {
    console.error(`[Router] Failed to generate OpenAPI document for klingai:`, error);
    res.status(500).json({ success: false, message: "Failed to generate OpenAPI documentation." });
  }
});

export default router; // Export router to be mounted in the main API router

## 10. OpenAPI Documentation Integration

1.  **Document Generation (`openapi.ts`)**:
    *   Each node module **MUST** export a `createOpenApiDocument` function from its `openapi.ts`.
    *   This function is responsible for generating the complete OpenAPI document for that node, including paths, schemas (referenced from `schemas/`), and metadata.

2.  **Router Integration (`src/nodes/routes/index.ts`)**:
    *   The main API router (`src/nodes/routes/index.ts`) **MUST** import the `createOpenApiDocument` function from each node's `openapi.ts`.
    *   It **MUST** call this function for each node and collect the resulting documents (e.g., in an array) for potential aggregation.
    *   It **MUST** import the default export (the Express router instance) from each node's `router.ts`.
    *   It **MUST** mount each node's router under the correct service prefix (e.g., `apiRouter.use('/klingai', klingaiRouter);`).

3.  **Documentation Access**:
    *   Aggregated documentation (potentially filtered/merged) should be available via a central endpoint like GET `/nodes/openapi.json`.
    *   Individual node documentation **MUST** be available via GET `/nodes/{serviceName}/openapi.json` (handled by the local endpoint defined in the node's `router.ts`).
    *   Other discovery endpoints like GET `/nodes/routes` and GET `/nodes/routes-info` should reflect the routes mounted from the node routers.

This consolidated document provides a comprehensive guide for building and maintaining nodes, ensuring consistency across the directory structure, coding practices, and documentation. 