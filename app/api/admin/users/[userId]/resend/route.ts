import { NextResponse } from "next/server";
import { canManageUserStatus, makeInviteToken } from "@/lib/auth";
import { isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/mail";
import type { UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  const { userId } = await params;
  const id = safeObjectId(userId);
  if (!id) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ _id: id });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.status !== "INVITED") {
    return NextResponse.json({ error: "Only invited users can receive a new activation email." }, { status: 400 });
  }
  if (!canManageUserStatus(admin.role, user.role)) {
    return NextResponse.json({ error: "You cannot resend invites for this user." }, { status: 403 });
  }

  const invite = makeInviteToken();
  await db.collection<UserDocument>("users").updateOne(
    { _id: id },
    {
      $set: {
        inviteTokenHash: invite.hash,
        inviteExpiresAt: invite.expiresAt,
        updatedAt: new Date()
      }
    }
  );

  const activationUrl = `${process.env.APP_URL || "http://localhost:3000"}/activate?token=${encodeURIComponent(invite.token)}`;
  const sent = await sendInvitationEmail({
    to: user.email,
    learnerName: user.firstName,
    activationUrl
  });
  if (!sent) {
    return NextResponse.json({ error: "Email provider is not configured." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, message: `Activation email resent to ${user.email}.` });
}
