import { NextFunction, Request, Response } from "express";

export const validateAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: "API key is required in X-API-Key header",
    });
  }

  // Store API key in request for use in helpers
  req.apiKey = apiKey as string;
  return next();
};
