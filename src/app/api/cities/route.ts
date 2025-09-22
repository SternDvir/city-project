// src/app/api/cities/route.ts
import { NextResponse } from "next/server";
import type { City } from "@/utils";

// This is our mock "database" from your server.js
const cities: City[] = [
  { ID: "1", name: "New York", continent: "North America" },
  { ID: "2", name: "Tokyo", continent: "Asia" },
  { ID: "3", name: "London", continent: "Europe" },
  { ID: "4", name: "Cairo", continent: "Africa" },
  { ID: "5", name: "Sydney", continent: "Australia" },
  { ID: "6", name: "São Paulo", continent: "South America" },
];

// GET handler to fetch all cities
export async function GET() {
  // We don't need the setTimeout, Next.js handles this efficiently.
  return NextResponse.json(cities);
}

// POST handler to add a new city
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || !body.continent) {
    return NextResponse.json(
      { message: "Invalid city data provided." },
      { status: 400 }
    );
  }
  if (cities.some((city) => city.ID === body.ID)) {
    console.log("City with the same ID already exists.");
    return NextResponse.json(
      { message: "City with the same ID already exists." },
      { status: 401 }
    );
  }

  const newCity: City = {
    // Using the same ID logic as your server.js
    ID: body.ID,
    name: body.name,
    continent: body.continent,
  };

  cities.push(newCity);
  return NextResponse.json(newCity, { status: 201 });
}

// DELETE handler for a specific city by its ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cityId = params.id;
  const cityIndex = cities.findIndex((city) => city.ID === cityId);

  if (cityIndex === -1) {
    return NextResponse.json({ message: "City not found" }, { status: 404 });
  }

  // Remove the city from the array
  cities.splice(cityIndex, 1);

  // Return a 204 No Content response, which is standard for a successful delete
  return new NextResponse(null, { status: 204 });
}
