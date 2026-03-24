import cors from "cors";
import express from "express";
import { apiRouter } from "./routes";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount the main API router
app.use(apiRouter);

export default app;
