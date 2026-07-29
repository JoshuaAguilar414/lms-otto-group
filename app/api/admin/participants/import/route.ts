import { NextResponse } from "next/server";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { parseParticipantRows, upsertParticipants } from "@/lib/participants";
import { parseSpreadsheetFile, SpreadsheetParseError } from "@/lib/spreadsheet";

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select a CSV or XLSX file" }, { status: 400 });

  let records: Record<string, string>[];
  try {
    records = await parseSpreadsheetFile(file);
  } catch (error) {
    const message = error instanceof SpreadsheetParseError ? error.message : "Could not read spreadsheet";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const rows = parseParticipantRows(records);
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
