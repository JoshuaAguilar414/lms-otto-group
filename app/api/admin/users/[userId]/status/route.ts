import { NextResponse } from "next/server";
import { canManageUserStatus } from "@/lib/auth";
import { isApiError, requireApiUser } from "@/lib/api";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { getDb } from "@/lib/db";
import type { UserDocument, UserStatus } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  const { userId } = await params;
  const id = safeObjectId(userId);
  if (!id) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  if (admin.id === userId) {
    return NextResponse.json({ error: "You cannot change your own account status here." }, { status: 400 });
  }

  const body = await request.json() as { status?: string };
  if (!body.status || !["ACTIVE", "INACTIVE"].includes(body.status)) {
    return NextResponse.json({ error: "Status must be ACTIVE or INACTIVE" }, { status: 400 });
  }
  const nextStatus = body.status as UserStatus;

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ _id: id });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (isBootstrapAdminEmail(user.email) && nextStatus === "INACTIVE") {
    return NextResponse.json({ error: "This bootstrap administrator account cannot be deactivated." }, { status: 400 });
  }

  if (!canManageUserStatus(admin.role, user.role)) {
    return NextResponse.json({ error: "Coordinators can only activate or deactivate learners." }, { status: 403 });
  }

  if (nextStatus === "ACTIVE" && !user.passwordHash) {
    return NextResponse.json({
      error: "This user has not set a password yet. They must use their activation link first, or an administrator can remove and recreate the invite."
    }, { status: 400 });
  }

  await db.collection<UserDocument>("users").updateOne(
    { _id: id },
    { $set: { status: nextStatus, updatedAt: new Date() } }
  );
  return NextResponse.json({ ok: true, status: nextStatus });
}
