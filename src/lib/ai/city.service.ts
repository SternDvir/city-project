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

function promptForCore(
  cityName: string,
  continentName: string,
  countryName: string
) {
  return lines([
    "TASK: You are a meticulous researcher. Your goal is to compile a rich and detailed profile for the specified city. Search the web for high-quality, factual information.",
    `CITY: ${cityName}`,
    "INSTRUCTIONS:",
    "1. For 'history', 'geography', 'demographics', and 'economy', you MUST write a detailed, informative paragraph for each. Do not leave these fields empty.",
    "2. For 'landmarks' and 'myths', provide a list of at least 3-5 interesting items for each.",
    "3. Return ONLY a single, valid JSON object with the exact fields specified below. Do not include any prose, commentary, or markdown formatting.",
    "OUTPUT:",
    `{
      "city": "${cityName}",
      "country": "${countryName}",
      "continent": "${continentName}",
      "history": "A detailed paragraph about the city's history.",
      "geography": "A detailed paragraph about the city's geography and climate.",
      "demographics": "A detailed paragraph about the city's population and demographics.",
      "economy": "A detailed paragraph about the city's economy and primary industries.",
      "landmarks": ["List of 3-5 notable landmarks"],
      "myths": ["List of 3-5 local myths or famous stories"],
      "latestNews": [<LEAVE THIS EMPTY>],
      "upcomingEvents": [<LEAVE THIS EMPTY>],
      "sources": [{"title": string, "url": string, "date": string | null}],
      "generatedAt": "An ISO timestamp string"
    }`,
  ]);
}

function promptForFresh(cityName: string) {
  return lines([
    "TASK: Find latest city news (past week) and upcoming events (next month).",
    `CITY: ${cityName}`,
    "OUTPUT: Return ONLY JSON with these exact fields:",
    `{
      "latestNews": [{"title": string, "url": string, "date": string}],
      "upcomingEvents": [{"name": string, "date": string | "" | null, "url": string | null}],
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
  console.log("building city content of:", city);
  if (!city) throw new Error("City not found");

  // ----- Pass 1: core profile -----
  const coreRes = await cityInfoAgent.generateVNext([
    {
      role: "user",
      content: promptForCore(city.name, city.continent, city.country),
    },
  ]);
  let core: CityContent;

  try {
    core = CityContentSchema.parse(JSON.parse(coreRes.text));
  } catch {
    // fallback: minimal object, plus sources from metadata
    const sources = extractSearchResults(coreRes);
    core = CityContentSchema.parse({
      city: city.name,
      country: city.country || "",
      continent: city.continent,
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
  const freshRes = await cityInfoAgent.generateVNext([
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
  console.log("--- DATA BEFORE VALIDATION ---");
  console.log(JSON.stringify(merged, null, 2));

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
