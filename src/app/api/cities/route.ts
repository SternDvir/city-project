// src/app/api/cities/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import City from "@/models/City";
import { ICity } from "@/models/City";

// GET handler to fetch all cities from the database
export async function GET() {
  try {
    await connectToDatabase();
    const cities = await City.find({});
    return NextResponse.json(cities, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST handler to add a new city to the database
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body: ICity = await req.json();

    // The ID is now the geohash from the frontend
    const newCity = {
      _id: body._id,
      name: body.name,
      continent: body.continent,
      country: body.country,
    };

    // Check if a city with this ID already exists
    const existingCity = await City.findById(newCity._id);
    if (existingCity) {
      return NextResponse.json(
        { message: "City with this ID already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    const createdCity = await City.create(newCity);
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/cities/${encodeURIComponent(
        newCity._id
      )}/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      }
    ).catch(() => {});

    return NextResponse.json(createdCity, { status: 201 });
  } catch (error) {
    console.error("Failed to create city:", error);
    // Provide a more informative error for bad data
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
