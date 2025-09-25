// src/lib/ai/env.ts
import { z } from "zod";
export const env = z
  .object({
    OPENROUTER_API_KEY: z.string().min(1),
  })
  .parse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  });
