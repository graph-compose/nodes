import { Router } from "express";
import firecrawlRouter from "./router"; // Import the new main router

// Firecrawl Integration Root Router
// This simply exports the main router defined in router.ts
const router = Router();

// Mount the specific firecrawl routes
router.use("/", firecrawlRouter);

export default router;
