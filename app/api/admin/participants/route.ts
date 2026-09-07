import { NextResponse } from "next/server";
import { isApiError, requireApiUser, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { listFieldDefinitionsForData, payloadValues, toParticipantView, validateParticipantValues } from "@/lib/fields";
import { normalizeCompanyId } from "@/lib/participants";
import type { ParticipantDocument } from "@/lib/types";

export async function GET() {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const db = await getDb();
  const participants = await db
    .collection<ParticipantDocument>("participants")
    .find({ active: true })
    .sort({ stakeholderGroup: 1, name: 1 })
    .toArray();

  return NextResponse.json({ participants: participants.map(toParticipantView) });
}

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

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

  const existing = await db.collection<ParticipantDocument>("participants").findOne({
    companyId: payload.companyId,
    name: payload.name,
    stakeholderGroup: payload.stakeholderGroup
  });
  if (existing?.active) {
    return NextResponse.json({
      error: "An organization with this Company ID, name, and stakeholder group already exists."
    }, { status: 409 });
  }

  const now = new Date();
  if (existing?._id) {
    await db.collection<ParticipantDocument>("participants").updateOne(
      { _id: existing._id },
      { $set: { ...payload, active: true, updatedAt: now } }
    );
    const restored = await db.collection<ParticipantDocument>("participants").findOne({ _id: existing._id });
    return NextResponse.json({ participant: toParticipantView(restored!), restored: true });
  }

  const doc: ParticipantDocument = {
    ...payload,
    active: true,
    createdAt: now,
    updatedAt: now
  };
  const result = await db.collection<ParticipantDocument>("participants").insertOne(doc);
  return NextResponse.json({
    participant: toParticipantView({ ...doc, _id: result.insertedId })
  });
}
