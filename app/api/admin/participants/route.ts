import { NextResponse } from "next/server";
import { isApiError, requireApiUser, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { normalizeCompanyId } from "@/lib/participants";
import type { ParticipantDocument } from "@/lib/types";
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

export async function GET() {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const db = await getDb();
  const participants = await db
    .collection<ParticipantDocument>("participants")
    .find({ active: true })
    .sort({ stakeholderGroup: 1, name: 1 })
    .toArray();

  return NextResponse.json({ participants: participants.map(toView) });
}

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;

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
    return NextResponse.json({ participant: toView(restored!), restored: true });
  }

  const doc: ParticipantDocument = {
    ...payload,
    active: true,
    createdAt: now,
    updatedAt: now
  };
  const result = await db.collection<ParticipantDocument>("participants").insertOne(doc);
  return NextResponse.json({
    participant: toView({ ...doc, _id: result.insertedId })
  });
}
