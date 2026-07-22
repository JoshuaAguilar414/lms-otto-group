import { NextResponse } from "next/server";
import { canRemoveUsers } from "@/lib/auth";
import { isApiError, requireApiUser } from "@/lib/api";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { getDb } from "@/lib/db";
import type { AssignmentDocument, UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  if (!canRemoveUsers(admin.role)) {
    return NextResponse.json({ error: "Only administrators can remove users." }, { status: 403 });
  }

  const { userId } = await params;
  const id = safeObjectId(userId);
  if (!id) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  if (admin.id === userId) {
    return NextResponse.json({ error: "You cannot remove your own account." }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ _id: id });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (isBootstrapAdminEmail(user.email)) {
    return NextResponse.json({ error: "This bootstrap administrator account cannot be removed." }, { status: 400 });
  }

  await db.collection<AssignmentDocument>("assignments").deleteMany({ userId: id });
  await db.collection<UserDocument>("users").deleteOne({ _id: id });

  return NextResponse.json({ ok: true });
}
