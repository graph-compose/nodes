import { Router } from "express";
import cloudStorageCsvRouter from "./cloud-storage-csv";

const router = Router();

// Register source routes
router.use("/cloud-storage-csv", cloudStorageCsvRouter);

export default router;
