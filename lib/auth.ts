import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "@/lib/db";
import type { SessionUser, UserDocument, UserRole } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

const COOKIE_NAME = "otto_session";
const SESSION_SECONDS = 60 * 60 * 12;

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user: UserDocument): Promise<string> {
  if (!user._id) throw new Error("Cannot create a session for an unsaved user");
  return new SignJWT({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    entity: user.entity,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user._id.toHexString())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: (process.env.APP_URL || "").startsWith("https://"),
    sameSite: "lax" as const,
    maxAge: SESSION_SECONDS,
    path: "/"
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const objectId = safeObjectId(payload.sub);
    if (!objectId) return null;

    const db = await getDb();
    const user = await db.collection<UserDocument>("users").findOne({ _id: objectId, status: "ACTIVE" });
    if (!user?._id) return null;

    return {
      id: user._id.toHexString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      entity: user.entity,
      role: user.role
    };
  } catch {
    return null;
  }
}

export async function requirePageUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(isAdminRole(user.role) ? "/admin" : "/dashboard");
  }
  return user;
}

export function isAdminRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "COORDINATOR";
}

export function isFullAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

/** Coordinator: learners, courses, assignments, reports. Admin: full system control. */
export function canManageParticipantRoster(role: UserRole): boolean {
  return isFullAdmin(role);
}

export function canManageCourses(role: UserRole): boolean {
  return isAdminRole(role);
}

/** @deprecated use canManageCourses */
export function canUploadCourses(role: UserRole): boolean {
  return canManageCourses(role);
}

export function canCreateStaff(role: UserRole): boolean {
  return isFullAdmin(role);
}

export function canRemoveUsers(role: UserRole): boolean {
  return isFullAdmin(role);
}

export function canManageUserStatus(actorRole: UserRole, targetRole: UserRole): boolean {
  if (isFullAdmin(actorRole)) return true;
  return actorRole === "COORDINATOR" && targetRole === "LEARNER";
}

export function canInviteRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (isFullAdmin(actorRole)) return true;
  return actorRole === "COORDINATOR" && targetRole === "LEARNER";
}

export function makeInviteToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export { COOKIE_NAME };
