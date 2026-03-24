// Interface mirroring the relevant parts of Replicate's Prediction object
// Based on: https://replicate.com/docs/reference/http#predictions.get
export interface ReplicatePrediction {
  id: string;
  version: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled" | "aborted";
  input: Record<string, any>;
  output?: any; // Can be string, array, object, etc.
  error?: any;
  logs?: string;
  metrics?: {
    predict_time?: number;
    // other metrics?
  };
  created_at: string; // ISO 8601 timestamp
  started_at?: string; // ISO 8601 timestamp
  completed_at?: string; // ISO 8601 timestamp
  urls?: {
    get: string;
    cancel?: string; // Only present if cancelable
  };
  webhook?: string;
  webhook_events_filter?: Array<"start" | "output" | "logs" | "completed">;
}
