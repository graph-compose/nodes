import { Request, Response } from "express";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  SuccessResponseSchema,
} from "../../../../types/api-response";
import {
  ChunkSchema,
  ChunkTextDataSchema,
  ChunkTextRequestSchema,
  WhisperSegment,
} from "../schemas/chunkSchemas";

type ChunkTextRequest = z.infer<typeof ChunkTextRequestSchema>;

interface Chunk {
  index: number;
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  segmentCount: number;
}

function groupSegmentsIntoChunks(segments: WhisperSegment[], maxChars: number): Chunk[] {
  const chunks: Chunk[] = [];
  let currentSegments: WhisperSegment[] = [];
  let currentCharCount = 0;

  const flushChunk = () => {
    if (currentSegments.length === 0) return;
    const text = currentSegments.map(s => s.text.trim()).join(" ").trim();
    const startTime = currentSegments[0].start;
    const endTime = currentSegments[currentSegments.length - 1].end;
    chunks.push({
      index: chunks.length,
      text,
      startTime,
      endTime,
      duration: parseFloat((endTime - startTime).toFixed(3)),
      segmentCount: currentSegments.length,
    });
    currentSegments = [];
    currentCharCount = 0;
  };

  for (const segment of segments) {
    const segmentText = segment.text.trim();
    const segmentLen = segmentText.length + 1; // +1 for the space when joining

    // If adding this segment would exceed maxChars, flush first
    if (currentCharCount + segmentLen > maxChars && currentSegments.length > 0) {
      flushChunk();
    }

    // Handle a single segment that's longer than maxChars (rare but possible)
    if (segmentLen > maxChars) {
      currentSegments.push(segment);
      flushChunk();
      continue;
    }

    currentSegments.push(segment);
    currentCharCount += segmentLen;
  }

  // Flush any remaining segments
  flushChunk();

  return chunks;
}

export async function chunkController(
  req: Request<Record<string, string>, any, ChunkTextRequest>,
  res: Response,
) {
  try {
    const { segments, maxChars = 3500 } = req.body;

    const chunks = groupSegmentsIntoChunks(segments, maxChars);

    const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
    const totalDuration = chunks.length > 0 ? chunks[chunks.length - 1].endTime : 0;

    const validatedChunks = chunks.map(c => ChunkSchema.parse(c));

    const ResponseDataSchema = SuccessResponseSchema(ChunkTextDataSchema);
    const responsePayload = ResponseDataSchema.parse({
      success: true,
      message: null,
      data: {
        chunks: validatedChunks,
        totalChunks: chunks.length,
        totalDuration: parseFloat(totalDuration.toFixed(3)),
        totalChars,
      },
    });

    return res.status(200).json(responsePayload);
  } catch (error: unknown) {
    console.error("[ChunkController] Error chunking segments:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const errorPayload = {
      success: false,
      message: "Failed to chunk segments.",
      data: null,
      error: { details: message },
    };
    try {
      return res.status(500).json(ApiErrorResponseSchema.parse(errorPayload));
    } catch {
      return res.status(500).json(errorPayload);
    }
  }
}
