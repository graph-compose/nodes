export interface IKlingAICredentials {
  accessKey: string;
  secretKey: string;
}

export interface IImageGenerationRequest {
  model_name?: "kling-v1" | "kling-v1-5";
  prompt: string;
  negative_prompt?: string;
  image?: string;
  image_reference?: "subject" | "face";
  image_fidelity?: number;
  n?: number;
  aspect_ratio?:
    | "16:9"
    | "9:16"
    | "1:1"
    | "4:3"
    | "3:4"
    | "3:2"
    | "2:3"
    | "21:9";
  callback_url?: string;
}

export interface IImageGenerationResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
    task_id: string;
    task_status: "submitted" | "processing" | "succeed" | "failed";
    created_at: number;
    updated_at: number;
  };
}

export interface IQueryTaskResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
    task_id: string;
    task_status: "submitted" | "processing" | "succeed" | "failed";
    task_status_msg: string;
    created_at: number;
    updated_at: number;
    task_result?: {
      images: Array<{
        index: number;
        url: string;
      }>;
    };
  };
}

export interface ITaskListQueryParams {
  pageNum?: number;
  pageSize?: number;
}

export interface ITaskListResponse {
  code: number;
  message: string;
  request_id: string;
  data: Array<{
    task_id: string;
    task_status: string;
    task_status_msg: string;
    created_at: number;
    updated_at: number;
    task_result?: {
      images: Array<{
        index: number;
        url: string;
      }>;
    };
  }>;
}
