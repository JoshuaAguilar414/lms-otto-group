import { NextResponse } from "next/server";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { listFieldDefinitions, persistNewDropdownOptions } from "@/lib/fields";
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

  const db = await getDb();
  const fields = await listFieldDefinitions(db);
  const parsed = parseParticipantRows(records, fields, { allowNewDropdownValues: true });
  if (parsed.missingColumns.length) {
    return NextResponse.json({
      error: `Missing required column(s): ${parsed.missingColumns.join(", ")}.`,
      errors: parsed.errors
    }, { status: 400 });
  }
  if (!parsed.rows.length) {
    return NextResponse.json({
      error: parsed.errors[0] || "No valid rows found. Check required columns and dropdown values.",
      errors: parsed.errors
    }, { status: 400 });
  }

  const result = await upsertParticipants(db, parsed.rows, { presentKeys: parsed.presentKeys });
  await persistNewDropdownOptions(db, fields, parsed.rows);
  return NextResponse.json({
    imported: parsed.rows.length,
    upserted: result.upserted,
    updated: result.updated,
    skipped: parsed.errors.length,
    errors: parsed.errors.slice(0, 20)
  });
}
