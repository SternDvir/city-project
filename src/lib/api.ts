// src/lib/api.ts
import axios from "axios";

const isServer = typeof window === "undefined";
let baseURL = "";

if (isServer) {
  // If on the server, use localhost for local dev or the Vercel URL for production
  baseURL = process.env.API_BASE_URL ?? "http://localhost:3000/api";
} else {
  // If on the client (browser), use a relative path for production, or localhost for local dev
  baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
}

export const api = axios.create({
  baseURL: baseURL.replace(/\/+$/, ""), // trim trailing slashes
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Optional: basic error logging
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[api error]", err?.response?.status, err?.message);
    }
    return Promise.reject(err);
  }
);
