// src/lib/api.ts
import axios from "axios";

/**
 * Use a public var for browser code, and allow a server-only var for RSC/route handlers.
 * Fall back to local dev if not provided.
 */
const isServer = typeof window === "undefined";

const baseURL =
  (isServer
    ? process.env.API_BASE_URL // server-only (no NEXT_PUBLIC_ prefix)
    : process.env.NEXT_PUBLIC_API_BASE_URL) ?? // client code requires NEXT_PUBLIC_
  "http://localhost:3000/api"; // fallback for local dev

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
