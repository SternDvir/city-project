// src/lib/ai/city.agent.ts
import "server-only";
import { Agent } from "@mastra/core/agent";
import { openrouter } from "./provider";

export const cityModel = openrouter("perplexity/sonar-pro", {
  extraBody: { search_mode: "web" }, // defaults; per-call overrides below
});

// Singleton to avoid re-instantiation during HMR
declare global {
  // eslint-disable-next-line no-var
  var __CITY_AGENT__: Agent | undefined;
}

function createCityAgent() {
  return new Agent({
    name: "city-info-agent",
    model: cityModel,
    instructions: [
      "You are a meticulous researcher for city pages.",
      "Search the web and compile factual, neutral, well-sourced content.",
      "Return ONLY valid JSON matching the provided schema. No prose.",
      "Always include 'sources' with title, url, and date when available.",
      "Dates must be ISO (YYYY-MM-DD or full ISO).",
    ],
  });
}

export const cityInfoAgent: Agent = global.__CITY_AGENT__ ?? createCityAgent();
if (process.env.NODE_ENV !== "production")
  global.__CITY_AGENT__ = cityInfoAgent;
