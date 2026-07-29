import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { canRemoveUsers } from "@/lib/auth";
import { isApiError, requireApiUser } from "@/lib/api";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { getDb } from "@/lib/db";
import type { AssignmentDocument, UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { bulkDeleteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  if (!canRemoveUsers(admin.role)) {
    return NextResponse.json({ error: "Only administrators can remove users." }, { status: 403 });
  }

  const parsed = bulkDeleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Select at least one user." }, { status: 400 });
  }

  const db = await getDb();
  const objectIds = parsed.data.ids
    .map(safeObjectId)
    .filter((id): id is ObjectId => Boolean(id));

  if (!objectIds.length) {
    return NextResponse.json({ error: "No valid users selected." }, { status: 400 });
  }

  const users = await db.collection<UserDocument>("users").find({ _id: { $in: objectIds } }).toArray();
  const usersById = new Map(users.map((user) => [user._id!.toHexString(), user]));

  const removedIds: string[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (const id of objectIds) {
    const userId = id.toHexString();
    const user = usersById.get(userId);
    if (!user) {
      skipped++;
      errors.push(`${userId}: user not found`);
      continue;
    }
    if (admin.id === userId) {
      skipped++;
      errors.push(`${user.email}: you cannot remove your own account`);
      continue;
    }
    if (isBootstrapAdminEmail(user.email)) {
      skipped++;
      errors.push(`${user.email}: bootstrap administrator cannot be removed`);
      continue;
    }

    await db.collection<AssignmentDocument>("assignments").deleteMany({ userId: id });
    await db.collection<UserDocument>("users").deleteOne({ _id: id });
    removedIds.push(userId);
  }

  return NextResponse.json({
    removed: removedIds.length,
    skipped,
    removedIds,
    errors: errors.slice(0, 20)
  });
}
