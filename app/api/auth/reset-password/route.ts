import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserDocument } from "@/lib/types";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid reset details" }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const result = await db.collection<UserDocument>("users").updateOne(
    {
      resetTokenHash: hashToken(parsed.data.token),
      resetExpiresAt: { $gt: now },
      status: "ACTIVE"
    },
    {
      $set: {
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        updatedAt: now
      },
      $unset: { resetTokenHash: "", resetExpiresAt: "" }
    }
  );

  if (!result.modifiedCount) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
