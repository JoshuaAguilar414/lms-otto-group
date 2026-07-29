import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import type { ParticipantDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { bulkDeleteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const parsed = bulkDeleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Select at least one organization." }, { status: 400 });
  }

  const objectIds = parsed.data.ids
    .map(safeObjectId)
    .filter((id): id is ObjectId => Boolean(id));

  if (!objectIds.length) {
    return NextResponse.json({ error: "No valid organizations selected." }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const removedIds: string[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (const id of objectIds) {
    const participantId = id.toHexString();
    const result = await db.collection<ParticipantDocument>("participants").updateOne(
      { _id: id, active: true },
      { $set: { active: false, updatedAt: now } }
    );
    if (!result.matchedCount) {
      skipped++;
      errors.push(`${participantId}: organization not found`);
      continue;
    }
    removedIds.push(participantId);
  }

  return NextResponse.json({
    removed: removedIds.length,
    skipped,
    removedIds,
    errors: errors.slice(0, 20)
  });
}
