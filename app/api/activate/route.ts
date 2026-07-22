import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserDocument } from "@/lib/types";
import { activateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = activateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid activation details" }, { status: 400 });
  }
  const db = await getDb();
  const now = new Date();
  const result = await db.collection<UserDocument>("users").updateOne(
    { inviteTokenHash: hashToken(parsed.data.token), inviteExpiresAt: { $gt: now }, status: "INVITED" },
    {
      $set: { passwordHash: await bcrypt.hash(parsed.data.password, 12), status: "ACTIVE", updatedAt: now },
      $unset: { inviteTokenHash: "", inviteExpiresAt: "" }
    }
  );
  if (!result.modifiedCount) {
    return NextResponse.json({ error: "This activation link is invalid or has expired" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
