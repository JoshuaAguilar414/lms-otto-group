import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { processAssignmentReminders } from "@/lib/reminders";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET || "gZKjOckoxMjPefchaELTs6BfklCUuRGjXWda86geIxzvqZFLbnkAG0P8sr71ciBX";
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const query = new URL(request.url).searchParams.get("secret") || "";
  return bearer === secret || query === secret;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const result = await processAssignmentReminders(db);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
