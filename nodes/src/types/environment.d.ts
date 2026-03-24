declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      GOOGLE_CLOUD_PROJECT?: string;
      STORAGE_BUCKET?: string;
      USE_EMULATOR?: string;
    }
  }
}

export {};
