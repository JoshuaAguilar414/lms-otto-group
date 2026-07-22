import { NextResponse } from "next/server";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { parseParticipantCsv, upsertParticipants } from "@/lib/participants";

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select a CSV file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "CSV file is too large" }, { status: 400 });

  const rows = parseParticipantCsv(await file.text());
  if (!rows.length) {
    return NextResponse.json({
      error: "No valid rows found. Required columns: Stakeholder, ID, Name, Belongs to BP, Country, Topic, Nominated Provider."
    }, { status: 400 });
  }

  const db = await getDb();
  const result = await upsertParticipants(db, rows);
  return NextResponse.json({
    imported: rows.length,
    upserted: result.upserted,
    updated: result.updated
  });
}
