import { NextResponse } from "next/server";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { normalizeCompanyId } from "@/lib/participants";
import type { ParticipantDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { participantSchema } from "@/lib/validation";

function toView(item: ParticipantDocument) {
  return {
    id: item._id!.toHexString(),
    stakeholderGroup: item.stakeholderGroup,
    companyId: item.companyId,
    name: item.name,
    belongsToBp: item.belongsToBp,
    country: item.country,
    topic: item.topic,
    nominatedProvider: item.nominatedProvider
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

  const { participantId } = await params;
  const id = safeObjectId(participantId);
  if (!id) return NextResponse.json({ error: "Invalid participant" }, { status: 400 });

  const parsed = participantSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid participant" }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    companyId: normalizeCompanyId(parsed.data.companyId),
    topic: parsed.data.topic || "Freely Chosen Employment",
    nominatedProvider: parsed.data.nominatedProvider || "VECTRA"
  };

  const db = await getDb();
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
  return NextResponse.json({ participant: toView(updated!) });
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
