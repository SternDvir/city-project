// src/app/api/cities/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import City from "@/models/City";

// DELETE handler for a specific city by its ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const cityId = params.id;

    const deletedCity = await City.findByIdAndDelete(cityId);

    if (!deletedCity) {
      return NextResponse.json({ message: "City not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("Failed to delete city:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
