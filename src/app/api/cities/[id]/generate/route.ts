"src/app/api/cities/[id]/generate/route.ts";
import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase as dbConnect } from "@/lib/mongodb";
import City from "@/models/City";
import { generateCityContent } from "@/lib/ai/city.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const paramsID = (await context.params).id;
    const city = await City.findById(paramsID);
    if (!city)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // mark pending (idempotent)
    await City.updateOne(
      { _id: city._id },
      { $set: { status: "pending", error: null } }
    );

    await generateCityContent(String(city._id));
    return NextResponse.json(
      { ok: true },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: unknown) {
    console.error(e);
    await City.updateOne(
      { _id: (await context.params).id },
      { $set: { status: "error", error: errMsg(e) } }
    );
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}
