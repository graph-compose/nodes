import express from "express";
import validate from "express-zod-safe";
import multer from "multer"; // Import multer for file uploads
import { createOpenApiDocument } from "./openapi";
import {
  CreateImageToVideoRequestSchema,
  CreateTextToVideoRequestSchema,
  CreateTransitionRequestSchema,
  QueryTaskRequestSchema,
  UploadImageFromUrlRequestSchema,
} from "./schemas";
// Remove service import, controllers will use it
// import * as service from "./services";

// Import controllers
import * as imageController from "./controllers/imageController";
import * as taskController from "./controllers/taskController";
import * as videoController from "./controllers/videoController";

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Image Handling Router ---
const imageRouter = express.Router();

// POST /pixverse/image/upload (Multipart Form Data)
imageRouter.post(
  "/upload",
  upload.single("img"), // Use multer for form-data
  imageController.uploadImageController,
);

// POST /pixverse/image/upload_from_url (JSON Body)
imageRouter.post(
  "/upload_from_url",
  validate({ body: UploadImageFromUrlRequestSchema }), // Use Zod for JSON validation
  imageController.uploadImageFromUrlController,
);

// --- Video Generation Routers ---
const textVideoRouter = express.Router();
const imageVideoRouter = express.Router();
const transitionRouter = express.Router();

// Handler for creating text-to-video tasks - REMOVED
// Handler for creating image-to-video tasks - REMOVED
// Handler for creating transition tasks - REMOVED

// POST /pixverse/video/text/create
textVideoRouter.post(
  "/create",
  validate({ body: CreateTextToVideoRequestSchema }),
  videoController.createTextToVideoController, // Use imported controller
);

// POST /pixverse/video/image/create
imageVideoRouter.post(
  "/create",
  validate({ body: CreateImageToVideoRequestSchema }),
  videoController.createImageToVideoController, // Use imported controller
);

// POST /pixverse/video/transition/create
transitionRouter.post(
  "/create",
  validate({ body: CreateTransitionRequestSchema }),
  videoController.createTransitionController, // Use imported controller
);

// --- Main Video Router ---
const videoRouter = express.Router();
videoRouter.use("/text", textVideoRouter); // Mounts at /pixverse/video/text
videoRouter.use("/image", imageVideoRouter); // Mounts at /pixverse/video/image
videoRouter.use("/transition", transitionRouter); // Mounts at /pixverse/video/transition

// --- Status Router ---
const statusRouter = express.Router();

// Handler for getting task status - REMOVED

// POST /pixverse/video/status
statusRouter.post(
  "/",
  validate({ body: QueryTaskRequestSchema }),
  taskController.getTaskStatusController, // Use imported controller
);

// --- Main PixVerse Router ---
const pixverseRouter = express.Router();
pixverseRouter.use("/image", imageRouter); // Mount image upload at /pixverse/image/upload
pixverseRouter.use("/video/status", statusRouter);
pixverseRouter.use("/video", videoRouter);

// Add local OpenAPI endpoint
pixverseRouter.get("/openapi.json", (req, res) => {
  try {
    const openApiDoc = createOpenApiDocument();
    res.json(openApiDoc);
  } catch (error) {
    console.error(
      `[Router] Failed to generate OpenAPI document for pixverse:`,
      error,
    );
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to generate OpenAPI documentation.",
      error: { details: message },
    });
  }
});

// Export the main router for use in the central API router
export { pixverseRouter };
export default pixverseRouter;
