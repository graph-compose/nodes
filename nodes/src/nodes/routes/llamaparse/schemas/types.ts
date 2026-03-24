// types.ts for LlamaParse integration

// Authentication Interface
export interface LlamaParseAuth {
  apiKey: string; // LlamaCloud API Key (llx-...)
}

// Expected response when creating a parse job
export interface LlamaParseCreateResponse {
  id: string; // The job ID
}

// Interface mirroring LlamaParse's GET /job/{id} response structure
export interface LlamaParseJobStatusResponse {
  id: string;
  status: "PENDING" | "SUCCESS" | "ERROR";
  // The result object structure varies based on requested format and features
  // It often contains keys like 'markdown', 'text', etc.
  result?: Record<string, any>;
  error?: string; // Error message if status is ERROR
  // May contain other fields
  [key: string]: any;
}
