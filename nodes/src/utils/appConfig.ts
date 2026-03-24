export const appConfig = {
  gcp: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "",
    storage: {
      bucketName: process.env.STORAGE_BUCKET || "",
      frameExtractionPath: "frames",
    },
  },
};
