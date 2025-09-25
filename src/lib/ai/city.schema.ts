// src/lib/ai/city.schema.ts
import { z } from "zod";

export const NewsItem = z.object({
  title: z.string(),
  url: z.string().url(),
  date: z.string().optional(), // ISO string if present
});

export const EventItem = z.object({
  name: z.string(),
  date: z.string().optional(), // ISO
  url: z.string().url().optional(),
});

export const CityContentSchema = z.object({
  city: z.string(),
  normalizedCity: z.string(), // normalized city name used by the agent

  continent: z.string(),
  country: z.string().optional(), // if the agent inferred it
  history: z.string(),
  geography: z.string(),
  demographics: z.string(),
  economy: z.string(),
  landmarks: z.array(z.string()).default([]),
  latestNews: z.array(NewsItem).default([]),
  upcomingEvents: z.array(EventItem).default([]),
  myths: z.array(z.string()).default([]),
  sources: z.array(NewsItem).default([]), // holds all cited sources (news + reference pages)
  generatedAt: z.string(), // ISO
});

export type CityContent = z.infer<typeof CityContentSchema>;
