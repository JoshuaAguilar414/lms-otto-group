import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { InviteError, inviteLearner } from "@/lib/learners";
import type { StakeholderGroup } from "@/lib/types";

export async function POST(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select a CSV file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "CSV file is too large" }, { status: 400 });

  const records = parse(await file.text(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  }) as Record<string, string>[];

  const db = await getDb();
  let created = 0;
  let skipped = 0;
  let emailed = 0;
  const errors: string[] = [];

  for (const [index, row] of records.entries()) {
    const firstName = pick(row, ["First Name", "firstName", "FirstName"]);
    const lastName = pick(row, ["Last Name", "lastName", "LastName"]);
    const email = pick(row, ["Corporate Email", "Email", "email"]).trim().toLowerCase();
    const companyId = pick(row, ["Company ID", "ID", "companyId"]);
    const stakeholderRaw = pick(row, ["Stakeholder Group", "Stakeholder", "stakeholderGroup"]);
    const facilityTraining = pick(row, [
      "Organizational Name",
      "Organisation Name",
      "Facility Training",
      "facilityTraining"
    ]);
    const stakeholderGroup = parseStakeholder(stakeholderRaw);
    const name = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || !email.includes("@") || !companyId || !stakeholderGroup || !facilityTraining) {
      skipped++;
      errors.push(`Row ${index + 2}: missing required learner/roster fields`);
      continue;
    }

    try {
      await inviteLearner(db, {
        email,
        name,
        companyId,
        stakeholderGroup,
        facilityTraining
      });
      created++;
      emailed++;
    } catch (error) {
      skipped++;
      const message = error instanceof InviteError ? error.message : "Import row failed";
      errors.push(`Row ${index + 2} (${email}): ${message}`);
      console.error(error);
    }
  }

  return NextResponse.json({
    created,
    skipped,
    emailed,
    errors: errors.slice(0, 20)
  });
}

function pick(row: Record<string, string>, names: string[]): string {
  for (const name of names) if (row[name]) return row[name].trim();
  return "";
}

function parseStakeholder(value: string): StakeholderGroup | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "facility") return "Facility";
  if (normalized === "business partner" || normalized === "businesspartner") return "Business Partner";
  return null;
}
