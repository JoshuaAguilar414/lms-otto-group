import { NextResponse } from "next/server";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { listFieldDefinitionsForData, payloadValues, toParticipantView, validateParticipantValues } from "@/lib/fields";
import { normalizeCompanyId } from "@/lib/participants";
import type { ParticipantDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const { participantId } = await params;
  const id = safeObjectId(participantId);
  if (!id) return NextResponse.json({ error: "Invalid participant" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const db = await getDb();
  const fields = await listFieldDefinitionsForData(db);
  const parsed = validateParticipantValues(fields, payloadValues(body, fields));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    companyId: normalizeCompanyId(parsed.data.companyId)
  };

  const current = await db.collection<ParticipantDocument>("participants").findOne({ _id: id, active: true });
  if (!current) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

  const duplicate = await db.collection<ParticipantDocument>("participants").findOne({
    _id: { $ne: id },
    companyId: payload.companyId,
    name: payload.name,
    stakeholderGroup: payload.stakeholderGroup,
    active: true
  });
  if (duplicate) {
    return NextResponse.json({
      error: "Another organization already uses this Company ID, name, and stakeholder group."
    }, { status: 409 });
  }

  await db.collection<ParticipantDocument>("participants").updateOne(
    { _id: id },
    { $set: { ...payload, updatedAt: new Date() } }
  );
  const updated = await db.collection<ParticipantDocument>("participants").findOne({ _id: id });
  return NextResponse.json({ participant: toParticipantView(updated!) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const { participantId } = await params;
  const id = safeObjectId(participantId);
  if (!id) return NextResponse.json({ error: "Invalid participant" }, { status: 400 });

  const db = await getDb();
  const result = await db.collection<ParticipantDocument>("participants").updateOne(
    { _id: id, active: true },
    { $set: { active: false, updatedAt: new Date() } }
  );
  if (!result.matchedCount) return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
