import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { ParticipantDocument, StakeholderGroup } from "@/lib/types";
import { normalizeCompanyId } from "@/lib/participants";

function parseStakeholderGroup(value: string | null): StakeholderGroup | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "facility") return "Facility";
  if (normalized === "business partner" || normalized === "businesspartner") return "Business Partner";
  return null;
}

/** Public helper for registration: organizations for a Company ID (stakeholder group optional). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = normalizeCompanyId(url.searchParams.get("companyId") || "");
  const stakeholderGroup = parseStakeholderGroup(url.searchParams.get("stakeholderGroup"));
  if (!companyId) {
    return NextResponse.json({ organizations: [], matches: [], facilities: [] });
  }

  const db = await getDb();
  const query: Record<string, unknown> = { active: true, companyId };
  if (stakeholderGroup) query.stakeholderGroup = stakeholderGroup;

  const rows = await db
    .collection<ParticipantDocument>("participants")
    .find(query)
    .project({ name: 1, stakeholderGroup: 1, companyId: 1 })
    .sort({ name: 1 })
    .toArray();

  const matches = rows
    .filter((item) => item.name)
    .map((item) => ({
      name: item.name,
      stakeholderGroup: item.stakeholderGroup,
      companyId: item.companyId
    }));

  // Unique organization names for this Company ID
  const organizations = [...new Set(matches.map((item) => item.name))];

  return NextResponse.json({
    organizations,
    matches,
    // Kept for older clients
    facilities: organizations
  });
}
