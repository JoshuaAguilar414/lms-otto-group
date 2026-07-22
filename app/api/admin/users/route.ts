import { NextResponse } from "next/server";
import { canCreateStaff, canInviteRole } from "@/lib/auth";
import { isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { InviteError, inviteLearner, inviteStaff } from "@/lib/learners";
import type { UserDocument } from "@/lib/types";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const db = await getDb();
  const users = await db.collection<UserDocument>("users").find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({
    users: users.map((item) => ({
      id: item._id!.toHexString(),
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      entity: item.entity,
      companyId: item.companyId,
      stakeholderGroup: item.stakeholderGroup,
      role: item.role,
      status: item.status,
      createdAt: item.createdAt.toISOString()
    }))
  });
}

export async function POST(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid user" }, { status: 400 });
  }

  if (!canInviteRole(admin.role, parsed.data.role)) {
    return NextResponse.json({ error: "Coordinators can only invite learners." }, { status: 403 });
  }
  if (parsed.data.role !== "LEARNER" && !canCreateStaff(admin.role)) {
    return NextResponse.json({ error: "Only administrators can create staff accounts." }, { status: 403 });
  }

  try {
    const db = await getDb();
    const result = parsed.data.role === "LEARNER"
      ? await inviteLearner(db, {
          email: parsed.data.email,
          name: parsed.data.name!,
          companyId: parsed.data.companyId!,
          stakeholderGroup: parsed.data.stakeholderGroup!,
          facilityTraining: parsed.data.facilityTraining
        })
      : await inviteStaff(db, {
          email: parsed.data.email,
          firstName: parsed.data.firstName!,
          lastName: parsed.data.lastName!,
          entity: parsed.data.entity!,
          role: parsed.data.role === "ADMIN" ? "ADMIN" : "COORDINATOR"
        });

    return NextResponse.json({
      user: result.user,
      emailSent: true,
      message: "User created. An activation link has been sent to their email."
    });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
