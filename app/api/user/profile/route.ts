import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { InviteError, updateUserProfile } from "@/lib/learners";
import type { UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { updateUserProfileSchema } from "@/lib/validation";

export async function GET() {
  const user = await requireApiUser();
  if (isApiError(user)) return user;

  const db = await getDb();
  const document = await db.collection<UserDocument>("users").findOne({ _id: safeObjectId(user.id)! });
  if (!document) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    profile: {
      id: user.id,
      firstName: document.firstName,
      lastName: document.lastName,
      email: document.email,
      entity: document.entity,
      companyId: document.companyId,
      stakeholderGroup: document.stakeholderGroup,
      role: document.role
    }
  });
}

export async function PATCH(request: Request) {
  const user = await requireApiUser();
  if (isApiError(user)) return user;

  const parsed = updateUserProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid profile" }, { status: 400 });
  }

  if (parsed.data.entity !== undefined) {
    return NextResponse.json({ error: "Organization details cannot be changed here. Contact your administrator." }, { status: 400 });
  }

  const id = safeObjectId(user.id);
  if (!id) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  try {
    const db = await getDb();
    const updated = await updateUserProfile(db, id, {
      name: parsed.data.name,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName
    });
    return NextResponse.json({
      profile: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        entity: updated.entity,
        companyId: updated.companyId,
        stakeholderGroup: updated.stakeholderGroup,
        role: updated.role
      }
    });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
