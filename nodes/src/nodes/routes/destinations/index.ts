import { Router } from "express";
import cloudStorageCsvRouter from "./cloud-storage-csv";

const destinationsRouter = Router();

destinationsRouter.use("/cloud-storage-csv", cloudStorageCsvRouter);

export default destinationsRouter;
