import { Request, Response } from "express";
import type { RedditSearchRequest } from "../schemas/redditSchemas";
import { searchRedditPosts } from "../services/redditService";

export const searchPosts = async (
  req: Request<Record<string, never>, any, RedditSearchRequest>,
  res: Response,
) => {
  try {
    const posts = await searchRedditPosts(req.body);
    res.json({
      success: true,
      message: null,
      data: posts,
    });
  } catch (error: unknown) {
    const details =
      error instanceof Error ? error.message : "Unknown search failure";
    res.status(500).json({
      success: false,
      message: "Failed to search Reddit posts.",
      data: null,
      error: { details },
    });
  }
};
