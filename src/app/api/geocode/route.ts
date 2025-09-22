import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENCAGE_API_KEY;
  if (!apiKey) {
    console.error("OpenCage API key is not set.");
    return NextResponse.json(
      { error: "Internal server configuration error." },
      { status: 500 }
    );
  }

  const apiUrl = `https://api.opencagedata.com/geocode/v1/json`;

  try {
    // Replaced fetch with an axios GET request
    const response = await axios.get(apiUrl, {
      params: {
        q: query,
        key: apiKey,
        language: "en",
        pretty: 1,
      },
    });

    // Axios wraps the response data in a `data` property
    return NextResponse.json(response.data.results);
  } catch (error) {
    console.error("Failed to fetch from OpenCage API:", error);
    return NextResponse.json(
      { error: "Failed to fetch geocoding data." },
      { status: 502 }
    );
  }
}
