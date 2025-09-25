import "server-only";
import { cityInfoAgent } from "./city.agent";
import {
  CityContentSchema,
  type CityContent,
  type SearchResult,
} from "./city.schema";
import { connectToDatabase as dbConnect } from "@/lib/mongodb";
import City from "@/models/City";

// ---------- type-safe helpers (no 'any') ----------
type UnknownRec = Record<string, unknown>;

function isObj(x: unknown): x is UnknownRec {
  return typeof x === "object" && x !== null;
}

function isSearchResultArray(
  x: unknown
): x is { title: string; url: string; date?: string }[] {
  return (
    Array.isArray(x) &&
    x.every((el) => {
      if (!isObj(el)) return false;
      return (
        typeof el.title === "string" &&
        typeof el.url === "string" &&
        (el.date === undefined || typeof el.date === "string")
      );
    })
  );
}

function pickResults(
  container: unknown
): { title: string; url: string; date?: string }[] | null {
  if (!isObj(container)) return null;
  const sr = (container as UnknownRec)["search_results"];
  return isSearchResultArray(sr) ? sr : null;
}

/** Perplexity puts its web results in provider metadata. */
function extractSearchResults(resp: unknown) {
  const root = isObj(resp) ? (resp as UnknownRec) : undefined;

  const fromRaw = root ? pickResults(root["raw"]) : null;
  if (fromRaw) return fromRaw;

  const fromProvider = root ? pickResults(root["providerResponse"]) : null;
  if (fromProvider) return fromProvider;

  const fromAdditional = root ? pickResults(root["additional_kwargs"]) : null;
  if (fromAdditional) return fromAdditional;

  return [] as { title: string; url: string; date?: string }[];
}

/** Perplexity puts its web results in provider metadata. Guard + narrow. */

function lines(parts: string[]) {
  return parts.join("\n");
}

function promptForCore(cityName: string) {
  return lines([
    "TASK: Compile a concise city profile using neutral, sourced facts.",
    `CITY: ${cityName}`,
    "OUTPUT: Return ONLY JSON with these exact fields:",
    `{
      "city": string,
      "country": string | null,
      "history": string,
      "geography": string,
      "demographics": string,
      "economy": string,
      "landmarks": string[],
      "myths": string[],
      "latestNews": [],
      "upcomingEvents": [],
      "sources": [{"title": string, "url": string, "date": string | null}],
      "generatedAt": string
    }`,
    "No markdown. No commentary. No trailing commas.",
  ]);
}

function promptForFresh(cityName: string) {
  return lines([
    "TASK: Find latest city news (past week) and upcoming events (next month).",
    `CITY: ${cityName}`,
    "OUTPUT: Return ONLY JSON with these exact fields:",
    `{
      "latestNews": [{"title": string, "url": string, "date": string}],
      "upcomingEvents": [{"name": string, "date": string | null, "url": string | null}],
      "sources": [{"title": string, "url": string, "date": string | null}]
    }`,
    "No markdown. No commentary. No trailing commas.",
  ]);
}

function mergeContent(
  core: CityContent,
  fresh: Partial<CityContent>
): CityContent {
  return {
    ...core,
    latestNews: fresh.latestNews?.length ? fresh.latestNews : core.latestNews,
    upcomingEvents: fresh.upcomingEvents?.length
      ? fresh.upcomingEvents
      : core.upcomingEvents,
    sources: [
      ...(core.sources || []),
      ...((fresh.sources as SearchResult[] | undefined) ?? []),
    ].slice(0, 50),
  };
}

/**
 * Generate full content for a city and store it on the document.
 * - sets status = "ready" and content on success
 * - sets status = "error" with message on failure
 */
export async function generateCityContent(cityId: string) {
  await dbConnect();
  const city = await City.findById(cityId);
  if (!city) throw new Error("City not found");

  // ----- Pass 1: core profile -----
  const coreRes = await cityInfoAgent.generate([
    { role: "user", content: promptForCore(city.name) },
  ]);
  let core: CityContent;

  try {
    core = CityContentSchema.parse(JSON.parse(coreRes.text));
  } catch {
    // fallback: minimal object, plus sources from metadata
    const sources = extractSearchResults(coreRes);
    core = CityContentSchema.parse({
      city: city.name,
      country: undefined,
      history: "",
      geography: "",
      demographics: "",
      economy: "",
      landmarks: [],
      myths: [],
      latestNews: [],
      upcomingEvents: [],
      sources,
      generatedAt: new Date().toISOString(),
    });
  }

  // ----- Pass 2: fresh news/events (recency filter) -----
  const freshRes = await cityInfoAgent.generate([
    {
      role: "user",
      content: promptForFresh(city.name),
      providerOptions: {
        openrouter: {
          extraBody: {
            search_mode: "web",
            search_recency_filter: "week",
          },
        },
      },
    },
  ]);

  let fresh: Partial<CityContent> = {};
  try {
    fresh = JSON.parse(freshRes.text);
  } catch {
    fresh = {
      latestNews: [],
      upcomingEvents: [],
      sources: extractSearchResults(freshRes),
    };
  }

  const merged = mergeContent(core, fresh);
  const validated = CityContentSchema.parse(merged);

  await City.updateOne(
    { _id: city._id },
    {
      $set: {
        status: "ready",
        content: validated,
        lastRefreshed: new Date(),
        error: null,
      },
    },
    { runValidators: false }
  );

  return validated;
}

/** Update only the time-sensitive sections (cron). */
export async function refreshCityFreshData(cityId: string) {
  await dbConnect();
  const city = await City.findById(cityId);
  if (!city || !city.content) throw new Error("City not ready");

  const freshRes = await cityInfoAgent.generate([
    {
      role: "user",
      content: promptForFresh(city.name),
      providerOptions: {
        openrouter: {
          extraBody: {
            search_mode: "web",
            search_recency_filter: "week",
          },
        },
      },
    },
  ]);

  let fresh: Partial<CityContent> = {};
  try {
    fresh = JSON.parse(freshRes.text);
  } catch {
    fresh = {
      latestNews: [],
      upcomingEvents: [],
      sources: extractSearchResults(freshRes),
    };
  }

  const merged = {
    ...city.content,
    latestNews: fresh.latestNews ?? city.content.latestNews,
    upcomingEvents: fresh.upcomingEvents ?? city.content.upcomingEvents,
    sources: [
      ...(city.content.sources || []),
      ...((fresh.sources as SearchResult[] | undefined) ?? []),
    ].slice(0, 50),
    generatedAt: new Date().toISOString(),
  };

  const validated = CityContentSchema.parse(merged);

  await City.updateOne(
    { _id: city._id },
    {
      $set: {
        content: validated,
        lastRefreshed: new Date(),
      },
    },
    { runValidators: false }
  );

  return validated;
}
