import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    await (await getDb()).command({ ping: 1 });
    return NextResponse.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
