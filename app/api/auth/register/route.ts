import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { InviteError, inviteLearner } from "@/lib/learners";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid registration details" }, { status: 400 });
  }

  try {
    const db = await getDb();
    await inviteLearner(db, {
      email: parsed.data.email,
      name: parsed.data.name,
      companyId: parsed.data.companyId,
      stakeholderGroup: parsed.data.stakeholderGroup,
      facilityTraining: parsed.data.facilityTraining
    });
    return NextResponse.json({
      ok: true,
      emailSent: true,
      message: "Registration received. Check your email for an activation link to set your password."
    });
  } catch (error) {
    if (error instanceof InviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
