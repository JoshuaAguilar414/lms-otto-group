import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { COOKIE_NAME, createSessionToken, isAdminRole, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserDocument } from "@/lib/types";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });

  const db = await getDb();
  const user = await db.collection<UserDocument>("users").findOne({ email: parsed.data.email });
  if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({ redirectTo: isAdminRole(user.role) ? "/admin" : "/dashboard" });
  response.cookies.set(COOKIE_NAME, await createSessionToken(user), sessionCookieOptions());
  return response;
}
