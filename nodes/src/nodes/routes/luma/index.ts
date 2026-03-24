import { Router } from "express";
import lumaRouter from "./router";

// Luma Video Generation Integration Router
// This router handles video generation functionality via Luma AI API
const router = Router();

console.log("[Luma] Initializing Luma router");

router.use(
  "/",
  (req, res, next) => {
    console.log(`[Luma] Received ${req.method} request to ${req.originalUrl}`);
    next();
  },
  lumaRouter,
);

console.log("[Luma] Luma router initialized and routes registered");

export default router;

// Optional: If you need to export specific types or schemas from this level,
// you can re-export them here.
// export * from "./schemas/lumaSchemas";
// export * from "./types";
