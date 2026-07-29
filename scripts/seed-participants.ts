import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../lib/db";
import { parseParticipantRows, upsertParticipants } from "../lib/participants";
import { parseSpreadsheetBuffer } from "../lib/spreadsheet";

async function main() {
  const filePath = resolve(process.cwd(), process.argv[2] || "sample-participants.csv");
  const records = parseSpreadsheetBuffer(readFileSync(filePath), filePath);
  const rows = parseParticipantRows(records);
  if (!rows.length) throw new Error(`No participant rows found in ${filePath}`);
  const db = await getDb();
  const result = await upsertParticipants(db, rows);
  console.log(`Participants ready from ${filePath}: ${rows.length} rows (${result.upserted} new, ${result.updated} updated)`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
