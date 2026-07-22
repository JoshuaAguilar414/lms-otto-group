import { parse } from "csv-parse/sync";
import type { Db } from "mongodb";
import type { ParticipantDocument, StakeholderGroup } from "@/lib/types";

export function normalizeCompanyId(value: string): string {
  return value.trim();
}

function pick(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    if (row[name]?.trim()) return row[name].trim();
  }
  return "";
}

function parseStakeholder(value: string): StakeholderGroup | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "facility") return "Facility";
  if (normalized === "business partner" || normalized === "businesspartner") return "Business Partner";
  return null;
}

export function parseParticipantCsv(text: string): Array<Omit<ParticipantDocument, "_id" | "createdAt" | "updatedAt" | "active">> {
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Record<string, string>[];
  const rows: Array<Omit<ParticipantDocument, "_id" | "createdAt" | "updatedAt" | "active">> = [];

  for (const row of records) {
    const stakeholderGroup = parseStakeholder(pick(row, ["Stakeholder", "stakeholder", "Stakeholder Group"]));
    const companyId = normalizeCompanyId(pick(row, ["ID", "Id", "Company ID", "companyId"]));
    const name = pick(row, ["Name", "Facility Name", "Organization", "name"]);
    if (!stakeholderGroup || !companyId || !name) continue;
    rows.push({
      stakeholderGroup,
      companyId,
      name,
      belongsToBp: pick(row, ["Belongs to BP", "Belongs to BP ", "belongsToBp", "Business Partner"]),
      country: pick(row, ["Country", "country"]),
      topic: pick(row, ["Topic", "topic"]) || "Freely Chosen Employment",
      nominatedProvider: pick(row, ["Nominated Provider", "Provider", "nominatedProvider"]) || "Vectra"
    });
  }
  return rows;
}

export async function upsertParticipants(
  db: Db,
  rows: Array<Omit<ParticipantDocument, "_id" | "createdAt" | "updatedAt" | "active">>
): Promise<{ upserted: number; updated: number }> {
  const now = new Date();
  let upserted = 0;
  let updated = 0;
  for (const row of rows) {
    const result = await db.collection<ParticipantDocument>("participants").updateOne(
      { companyId: row.companyId, name: row.name, stakeholderGroup: row.stakeholderGroup },
      {
        $set: { ...row, active: true, updatedAt: now },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );
    if (result.upsertedCount) upserted += 1;
    else if (result.modifiedCount) updated += 1;
  }
  return { upserted, updated };
}

export async function findApprovedParticipant(
  db: Db,
  companyId: string,
  stakeholderGroup: StakeholderGroup
): Promise<ParticipantDocument | null> {
  return db.collection<ParticipantDocument>("participants").findOne({
    companyId: normalizeCompanyId(companyId),
    stakeholderGroup,
    active: true
  });
}
