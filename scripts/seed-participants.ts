import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../lib/db";
import { listFieldDefinitions, persistNewDropdownOptions } from "../lib/fields";
import { parseParticipantRows, upsertParticipants } from "../lib/participants";
import { parseSpreadsheetBuffer } from "../lib/spreadsheet";

async function main() {
  const filePath = resolve(process.cwd(), process.argv[2] || "sample-participants.csv");
  const records = parseSpreadsheetBuffer(readFileSync(filePath), filePath);
  const db = await getDb();
  const fields = await listFieldDefinitions(db);
  const parsed = parseParticipantRows(records, fields, { allowNewDropdownValues: true });
  if (parsed.missingColumns.length || !parsed.rows.length) {
    throw new Error(parsed.errors[0] || `No participant rows found in ${filePath}`);
  }
  const result = await upsertParticipants(db, parsed.rows, { presentKeys: parsed.presentKeys });
  await persistNewDropdownOptions(db, fields, parsed.rows);
  if (parsed.errors.length) {
    console.warn(`Skipped ${parsed.errors.length} invalid row(s). First issues: ${parsed.errors.slice(0, 5).join(" | ")}`);
  }
  console.log(`Participants ready from ${filePath}: ${parsed.rows.length} rows (${result.upserted} new, ${result.updated} updated)`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
