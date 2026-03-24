import { Request, Response } from "express";
import type { SerpApiSearchRequest } from "../schemas/serpapiSchemas";
import { searchSerpApi } from "../services/serpapiService";

export const search = async (
  req: Request<Record<string, never>, any, SerpApiSearchRequest>,
  res: Response,
) => {
  try {
    const result = await searchSerpApi(req.body);
    res.json({
      success: true,
      message: null,
      data: result,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to execute SerpAPI search.",
      data: null,
      error: { details },
    });
  }
};
