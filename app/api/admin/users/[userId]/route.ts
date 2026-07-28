import { NextResponse } from "next/server";
import { canEditUser, canRemoveUsers } from "@/lib/auth";
import { isApiError, requireApiUser } from "@/lib/api";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { getDb } from "@/lib/db";
import { InviteError, updateUserProfile } from "@/lib/learners";
import type { AssignmentDocument, UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { updateUserProfileSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  const { userId } = await params;
  const id = safeObjectId(userId);
  if (!id) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const parsed = updateUserProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid profile" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ _id: id });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (isBootstrapAdminEmail(user.email) && admin.id !== userId) {
    return NextResponse.json({ error: "This bootstrap administrator account can only be edited by its owner." }, { status: 400 });
  }

  if (!canEditUser(admin.role, user.role)) {
    return NextResponse.json({ error: "Coordinators can only edit learner profiles." }, { status: 403 });
  }

  if (parsed.data.entity !== undefined && user.role === "LEARNER") {
    return NextResponse.json({ error: "Learner organization details cannot be changed here." }, { status: 400 });
  }

  try {
    const updated = await updateUserProfile(db, id, parsed.data);
    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

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
