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
    `ROLE & EXPERTISE: You are a distinguished urban historian and geographer with 20+ years of experience researching global cities. You combine the analytical rigor of an academic researcher with the engaging writing style of a National Geographic contributor.`,

    `MISSION: Create a comprehensive, encyclopedia-quality profile for ${cityName}, ${countryName} that would serve as the definitive reference for this city.`,

    `RESEARCH METHODOLOGY:`,
    `1. VERIFY FACTS: Cross-reference information across multiple authoritative sources`,
    `2. PRIORITIZE PRIMARY SOURCES: Government data, official city records, academic publications`,
    `3. ENSURE CURRENCY: Focus on the most recent and reliable information available`,
    `4. MAINTAIN NEUTRALITY: Present factual, unbiased information without promotional language`,

    `CONTENT QUALITY STANDARDS:`,
    `- HISTORY: Write 150-200 words covering founding, major historical periods, key events that shaped the city's development`,
    `- GEOGRAPHY: Write 150-200 words on physical location, topography, climate patterns, natural features, urban layout`,
    `- DEMOGRAPHICS: Write 150-200 words on current population, ethnic composition, age distribution, languages, cultural diversity`,
    `- ECONOMY: Write 150-200 words on major industries, economic drivers, employment sectors, recent economic trends`,
    `- LANDMARKS: Include 5-8 significant sites with brief descriptions, covering historical, cultural, and architectural importance`,
    `- MYTHS: Include 3-5 local legends, folklore, or culturally significant stories that are part of the city's identity`,

    `WRITING REQUIREMENTS:`,
    `- Use clear, engaging prose suitable for educated general readers`,
    `- Include specific data points, dates, and statistics where relevant`,
    `- Ensure each paragraph flows logically and tells a compelling story`,
    `- Maintain consistent tone throughout all sections`,

    `STEP-BY-STEP PROCESS:`,
    `1. First, gather comprehensive information about ${cityName} from authoritative sources`,
    `2. Analyze and synthesize the most important and accurate details for each category`,
    `3. Craft well-structured paragraphs that are informative yet engaging`,
    `4. Verify all claims can be substantiated by your sources`,
    `5. Format the final output as the specified JSON structure`,

    `CRITICAL REQUIREMENTS:`,
    `- Every major claim must be backed by credible sources in your sources array`,
    `- Generate current ISO timestamp for generatedAt field`,
    `- Return ONLY valid JSON - no commentary, markdown, or additional text`,
    `- Ensure no fields are left empty or with placeholder text`,

    `EXACT OUTPUT FORMAT:`,
    `{`,
    `  "city": "${cityName}",`,
    `  "country": "${countryName}",`,
    `  "continent": "${continentName}",`,
    `  "history": "Rich, detailed 150-200 word paragraph about the city's historical development",`,
    `  "geography": "Comprehensive 150-200 word paragraph about location, climate, and physical characteristics",`,
    `  "demographics": "Thorough 150-200 word paragraph about population and cultural composition",`,
    `  "economy": "Detailed 150-200 word paragraph about economic structure and major industries",`,
    `  "landmarks": ["5-8 specific landmarks with brief descriptions"],`,
    `  "myths": ["3-5 local legends or culturally significant stories"],`,
    `  "latestNews": [],`,
    `  "upcomingEvents": [],`,
    `  "sources": [{"title": "Source title", "url": "source_url", "date": "YYYY-MM-DD or null"}],`,
    `  "generatedAt": "Current ISO timestamp"`,
    `}`,
  ]);
}

function promptForFresh(
  cityName: string,
  countryName?: string,
  continentName?: string
) {
  const countryContext = countryName ? ` in ${countryName}` : "";
  const locationContext = `${cityName}${countryContext}${
    continentName ? ` (${continentName})` : ""
  }`;

  return lines([
    `ROLE & IDENTITY: You are an international multilingual content discovery specialist with expertise in global media landscapes, cultural patterns, and native language content research. Your mission is to find authentic local content for ${locationContext} by automatically adapting to the predominant local languages, cultural contexts, and media ecosystems of this specific geographic region.`,

    `CORE MISSION: Discover 3-5 recent local news items (past 7-14 days) and 3-5 upcoming events (next 30 days) specifically for ${locationContext} that would genuinely interest residents, visitors, and the general public. Prioritize content diversity, geographical accuracy, and cultural relevance while maintaining strict source diversification standards.`,

    `CRITICAL ANTI-CLUSTERING REQUIREMENTS (Non-Negotiable):`,
    `1. ABSOLUTE DOMAIN UNIQUENESS: Each domain can appear EXACTLY ONCE across ALL results (news + events + sources combined)`,
    `2. URL SPECIFICITY MANDATE: Each URL must link to a SPECIFIC article or event page, never tag/category/search/listing pages`,
    `3. GEOGRAPHICAL PRECISION: Content must explicitly mention "${cityName}" by name in headline or content - reject content about other cities`,
    `4. COMPLETE URL UNIQUENESS: Every single URL must be completely unique across all items`,
    `5. SOURCE TYPE DIVERSIFICATION: Mix local papers, cultural venues, municipal pages, event platforms - avoid source type clustering`,

    `FORBIDDEN URL PATTERNS (Immediate Rejection):`,
    `- /tags/[cityname], /category/[cityname], /search/?s=[cityname], /archive/[cityname]`,
    `- Generic landing pages showing multiple articles or events`,
    `- URLs ending in city name without specific content identifier`,
    `- Search result pages, RSS feeds, or aggregation pages`,
    `- Any URL leading to a list rather than individual content`,

    `AUTOMATIC LANGUAGE ADAPTATION STRATEGY:`,
    `1. DYNAMIC LANGUAGE DETECTION: Based on ${countryName}, automatically determine primary local language(s) for search optimization`,
    `2. NATIVE-FIRST SEARCH APPROACH: Search primarily in local language, supplement with English when appropriate`,
    `3. CULTURAL CONTEXT AWARENESS: Adapt search strategies to local media habits, governmental structures, and information distribution patterns`,
    `4. TRANSLATION WORKFLOW: Always translate titles to English for consistency while preserving original native-language URLs`,

    `PUBLIC INTEREST CONTENT FILTER (Critical Quality Standard):`,
    `INCLUDE: Business openings/closings, community events, cultural developments, local achievements, infrastructure affecting residents, festivals, public services updates that impact daily life`,
    `EXCLUDE: Administrative procedures, municipal operating hours (like fountain schedules), bureaucratic announcements, internal government communications, permit notices, procedural updates`,
    `TEST: Ask "Would a typical resident or visitor to ${cityName} find this interesting or useful?" If no, exclude it.`,

    `ENHANCED EVENT DISCOVERY STRATEGY (Primary Focus Area):`,

    `A. COMPREHENSIVE EVENT SOURCE TARGETING:`,
    `   - Cultural institutions: Search theaters, museums, cultural centers using local language venue terms`,
    `   - Event platforms: Target both international (Eventbrite, Facebook Events) and local/regional event platforms`,
    `   - Municipal/council: Find official city event calendars and cultural programming (acceptable for events, unlike news)`,
    `   - Educational venues: Universities, cultural schools, community colleges hosting public events`,
    `   - Entertainment venues: Concert halls, clubs, sports venues, community centers, libraries`,
    `   - Religious/community centers: Local faith communities and cultural organizations`,
    `   - Tourism boards: Official visitor information and cultural calendars`,

    `B. ADAPTIVE EVENT SEARCH METHODOLOGY:`,
    `   - Use native language terms for "events", "cultural agenda", "what's happening", "this week", "upcoming"`,
    `   - Search municipal websites using local government terminology for public events`,
    `   - Target specific venue websites and cultural institution calendars`,
    `   - Look for "weekly agenda", "monthly programming", "seasonal activities" in appropriate language`,
    `   - Include both paid/ticketed events and free community activities`,

    `C. EVENT CONTENT EXPANSION STRATEGIES:`,
    `   - If major events are scarce: Include recurring cultural activities, venue regular programming`,
    `   - Search seasonal relevance: Local holidays, cultural seasons, weather-appropriate activities`,
    `   - Target specific venue programming: "[venue name] + schedule/agenda/programming" in local language`,
    `   - Include diverse event types: performing arts, exhibitions, community gatherings, educational workshops, sports events`,

    `STRICT DOMAIN VALIDATION SYSTEM:`,
    `Before adding ANY item, verify: "Have I used this domain before in news OR events OR sources?"`,
    `VIOLATION EXAMPLES:`,
    `- news-site.com used for news ❌ Cannot use news-site.com for events`,
    `- same-domain.com appearing twice in any combination ❌ Absolute violation`,
    `REQUIRED DIVERSITY: Every domain must be completely unique across all categories`,

    `DUAL-TRACK CONTENT DISCOVERY:`,

    `TRACK 1 - MULTILINGUAL NEWS DISCOVERY:`,
    `- Automatically adapt to local language: search using native terms for "news", "today", "latest"`,
    `- Target local newspapers, regional outlets, business publications, community news`,
    `- Municipal communications: Only if they announce public-interest developments (not administrative procedures)`,
    `- Ensure all news specifically mentions ${cityName} in headline or content`,
    `- Apply public interest filter: community relevance over bureaucratic updates`,

    `TRACK 2 - INTENSIVE EVENT DISCOVERY:`,
    `- Search cultural venues using local language venue terms and specific venue names`,
    `- Target event platforms (both international and region-specific)`,
    `- Find municipal event calendars and cultural programming`,
    `- Include performing arts, visual arts, community events, educational activities, sports events`,
    `- Search venue-specific programming: theaters, museums, community centers, universities`,

    `DATE HANDLING REQUIREMENTS (Explicit Standards):`,
    `- NEWS DATES: Must be within past 7-14 days; if exact date unavailable, estimate based on "yesterday", "this week", etc.`,
    `- EVENT DATES: Must be within next 30 days; if exact date unavailable, use null but include approximate timing in event name`,
    `- DATE FORMATS: Always use YYYY-MM-DD format; if no date available, use null (never leave blank or use placeholder text)`,
    `- DATE VERIFICATION: Cross-check dates for reasonableness - reject items with clearly wrong dates`,

    `CONTENT SCARCITY FALLBACK STRATEGIES:`,
    `- If limited recent news: Expand search to 14 days and include high-quality regional coverage of ${cityName}`,
    `- If few specific events: Search for recurring activities, venue schedules, municipal activity calendars`,
    `- If single source dominates: Actively seek alternative regional outlets, community sources, cultural institutions`,
    `- If content genuinely scarce: Better to return fewer high-quality items than pad with irrelevant content`,
    `- Small city adaptation: Include regional coverage that specifically mentions ${cityName}`,

    `CONTENT QUALITY & VOLUME TARGETS:`,
    `- OPTIMAL TARGET: 4-5 news items + 4-5 events, all from unique domains`,
    `- MINIMUM ACCEPTABLE: 3 news + 3 events, all from unique domains`,
    `- QUALITY THRESHOLD: Fewer excellent diverse items beats many mediocre clustered ones`,
    `- GEOGRAPHICAL ACCURACY: Every item must explicitly mention ${cityName}`,
    `- PUBLIC INTEREST STANDARD: Every item must pass the "would locals care?" test`,

    `COMPREHENSIVE PRE-SUBMISSION VALIDATION:`,
    `1. ✓ Domain uniqueness: Each domain appears exactly once across ALL sections`,
    `2. ✓ URL specificity: No tag pages, category pages, search pages, or listing pages`,
    `3. ✓ Geographic precision: Every item mentions ${cityName} specifically`,
    `4. ✓ Date quality: All dates in YYYY-MM-DD format or null if unavailable`,
    `5. ✓ Content currency: News within 14 days, events within 30 days`,
    `6. ✓ Public interest relevance: All items pass community interest test`,
    `7. ✓ Cultural authenticity: Content feels genuinely local and relevant`,
    `8. ✓ Translation consistency: All titles in English, original URLs preserved`,
    `9. ✓ Volume adequacy: Minimum 3+3, target 4+4 items when available`,

    `STRUCTURED OUTPUT FORMAT:`,
    `{`,
    `  "latestNews": [`,
    `    {`,
    `      "title": "English translation of news specifically about ${cityName}",`,
    `      "url": "https://unique-domain-1.com/specific-article-about-${cityName}",`,
    `      "date": "YYYY-MM-DD or null"`,
    `    },`,
    `    {`,
    `      "title": "Different news from completely different domain",`,
    `      "url": "https://different-unique-domain-2.com/different-specific-article",`,
    `      "date": "YYYY-MM-DD or null"`,
    `    }`,
    `  ],`,
    `  "upcomingEvents": [`,
    `    {`,
    `      "name": "English translation of event happening in ${cityName}",`,
    `      "date": "YYYY-MM-DD or null",`,
    `      "url": "https://unique-venue-domain-3.com/specific-event-page or null"`,
    `    },`,
    `    {`,
    `      "name": "Different event from completely different venue/platform",`,
    `      "date": "YYYY-MM-DD or null",`,
    `      "url": "https://different-event-platform-4.com/different-event or null"`,
    `    }`,
    `  ],`,
    `  "sources": [`,
    `    {`,
    `      "title": "Source name (must be different from all domains above)",`,
    `      "url": "https://unique-source-homepage-5.com",`,
    `      "date": "YYYY-MM-DD or null"`,
    `    }`,
    `  ]`,
    `}`,

    `FINAL COMPREHENSIVE MANDATE: This prompt synthesizes every lesson learned from extensive testing across Beer-Sheva (clustering/broken URL issues), Nes Ziona (municipal bias problems), and Recife (event discovery weakness). Every requirement exists because its violation caused real system failures. This system must work seamlessly for any global city - Tokyo, Paris, São Paulo, Cairo, Mumbai, Lagos - by automatically adapting language strategies and cultural context while maintaining universal standards for accuracy, diversity, and public relevance. Success requires zero tolerance for domain overlap, maximum cultural authenticity, and genuine public interest content that residents and visitors would actually care about.`,
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

  // Enhanced fresh data generation with location targeting
  const freshRes = await cityInfoAgent.generateVNext([
    {
      role: "user",
      content: promptForFresh(city.name, city.country),
      providerOptions: {
        openrouter: {
          extraBody: {
            search_mode: "web",
            search_recency_filter: "week",
            // Add location targeting for better local results
            user_location: {
              city: city.name,
              country: city.country,
            },
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
  //   console.log("--- DATA BEFORE VALIDATION ---");
  //   console.log(JSON.stringify(merged, null, 2));

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
