import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { ParticipantDocument } from "@/lib/types";
import { normalizeCompanyId } from "@/lib/participants";

/** Public helper for registration: facility names for a Company ID. */
export async function GET(request: Request) {
  const companyId = normalizeCompanyId(new URL(request.url).searchParams.get("companyId") || "");
  if (!companyId) return NextResponse.json({ facilities: [] });

  const db = await getDb();
  const facilities = await db
    .collection<ParticipantDocument>("participants")
    .find({ active: true, stakeholderGroup: "Facility", companyId })
    .project({ name: 1 })
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json({
    facilities: facilities.map((item) => item.name).filter(Boolean)
  });
}
