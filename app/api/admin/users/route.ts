import { NextResponse } from "next/server";
import { canCreateStaff, canInviteRole } from "@/lib/auth";
import { isApiError, requireStaffApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { InviteError, inviteLearner, inviteStaff, listAdminUsers } from "@/lib/learners";
import { getRoleByKey } from "@/lib/roles";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  const admin = await requireStaffApi("users");
  if (isApiError(admin)) return admin;
  const db = await getDb();
  return NextResponse.json({ users: await listAdminUsers(db) });
}

export async function POST(request: Request) {
  const admin = await requireStaffApi("users");
  if (isApiError(admin)) return admin;
  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid user" }, { status: 400 });
  }

  const db = await getDb();
  const roleDoc = await getRoleByKey(db, parsed.data.role);
  if (!roleDoc) {
    return NextResponse.json({ error: "Unknown user group." }, { status: 400 });
  }

  if (!canInviteRole(admin, parsed.data.role)) {
    return NextResponse.json({ error: "You can only invite learners." }, { status: 403 });
  }
  if (parsed.data.role !== "LEARNER" && !canCreateStaff(admin)) {
    return NextResponse.json({ error: "Only administrators can create staff accounts." }, { status: 403 });
  }

  try {
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
          role: parsed.data.role
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
