import axios, { AxiosInstance } from "axios";

export function createAxiosInstance(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      "Content-Type": "application/json",
    },
  });
}
