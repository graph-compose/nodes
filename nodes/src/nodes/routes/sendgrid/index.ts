import { Router } from "express";
import sendgridRouter from "./router"; // Import the new router

// SendGrid Integration Router
// This router handles email sending functionality via SendGrid API
const router = Router();

console.log("[SendGrid] Initializing SendGrid node router");

// Mount the specific SendGrid routes
router.use("/", sendgridRouter); // Use the new router directly

console.log(
  "[SendGrid] SendGrid node router initialized and routes registered",
);

export default router;
