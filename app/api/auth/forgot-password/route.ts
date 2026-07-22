import { NextResponse } from "next/server";
import { makeInviteToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import type { UserDocument } from "@/lib/types";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({
    email: parsed.data.email,
    status: "ACTIVE",
    passwordHash: { $exists: true }
  });

  // Always return success to avoid email enumeration.
  if (!user?._id) {
    return NextResponse.json({
      ok: true,
      message: "If that email has an active account, a reset link has been sent."
    });
  }

  const reset = makeInviteToken();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await db.collection<UserDocument>("users").updateOne(
    { _id: user._id },
    {
      $set: {
        resetTokenHash: reset.hash,
        resetExpiresAt: expiresAt,
        updatedAt: new Date()
      }
    }
  );

  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(reset.token)}`;
  const sent = await sendPasswordResetEmail({
    to: user.email,
    learnerName: user.firstName,
    resetUrl
  });
  if (!sent) {
    return NextResponse.json({ error: "Email provider is not configured." }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: "If that email has an active account, a reset link has been sent."
  });
}
