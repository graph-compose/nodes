import { createOpenApiDocument } from "./openapi";
import router from "./router";

// Export the router as the default export for the main API router to mount
export default router;

// Export the OpenAPI document generator function
export { createOpenApiDocument };

// Also export the router using a named export for consistency with other modules if needed
export const llamaparseRouter = router;
