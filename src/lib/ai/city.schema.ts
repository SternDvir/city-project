// src/lib/ai/city.schema.ts
import { z } from "zod";

// items we’ll store inside city.content
export const NewsItem = z.object({
  title: z.string(),
  url: z.string().url(),
  date: z.string().optional(), // ISO if present
});

export const EventItem = z.object({
  name: z.string(),
  date: z.string().optional(), // ISO
  url: z.string().url().optional(),
});

export const CityContentSchema = z.object({
  city: z.string(),
  country: z.string().optional(),
  history: z.string(),
  geography: z.string(),
  demographics: z.string(),
  economy: z.string(),
  landmarks: z.array(z.string()).default([]),
  myths: z.array(z.string()).default([]),
  latestNews: z.array(NewsItem).default([]),
  upcomingEvents: z.array(EventItem).default([]),
  sources: z.array(NewsItem).default([]), // all cited links (incl. refs)
  generatedAt: z.string(), // ISO
});

export type CityContent = z.infer<typeof CityContentSchema>;
export type SearchResult = z.infer<typeof NewsItem>;
