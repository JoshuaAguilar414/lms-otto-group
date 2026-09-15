import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "@/lib/db";
import { STAFF_PAGES } from "@/lib/role-catalog";
import { fallbackRole, getRoleByKey, isLearnerRole } from "@/lib/roles";
import type { SessionPermissions, SessionUser, StaffPage, UserDocument, UserRole } from "@/lib/types";
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

export function permissionsFromRole(role: {
  key: string;
  name: string;
  pages?: StaffPage[];
  canManageRoster?: boolean;
  canCreateStaff?: boolean;
  canRemoveUsers?: boolean;
}): {
  roleName: string;
  pages: StaffPage[];
  permissions: SessionPermissions;
} {
  if (role.key === "ADMIN") {
    return {
      roleName: role.name || "Admin",
      pages: STAFF_PAGES.map((page) => page.key),
      permissions: {
        staff: true,
        manageRoster: true,
        manageCourses: true,
        manageUsers: true,
        createStaff: true,
        removeUsers: true,
        viewReports: true,
        manageSettings: true
      }
    };
  }

  if (isLearnerRole(role.key)) {
    return {
      roleName: role.name || "Learner",
      pages: [],
      permissions: {
        staff: false,
        manageRoster: false,
        manageCourses: false,
        manageUsers: false,
        createStaff: false,
        removeUsers: false,
        viewReports: false,
        manageSettings: false
      }
    };
  }

  const pages = role.pages || [];
  return {
    roleName: role.name || role.key,
    pages,
    permissions: {
      staff: pages.length > 0,
      manageRoster: Boolean(role.canManageRoster) && pages.includes("participants"),
      manageCourses: pages.includes("courses"),
      manageUsers: pages.includes("users"),
      createStaff: Boolean(role.canCreateStaff),
      removeUsers: Boolean(role.canRemoveUsers),
      viewReports: pages.includes("reports"),
      manageSettings: pages.includes("settings")
    }
  };
}

function toSessionUser(
  user: UserDocument,
  roleDoc: {
    key: string;
    name: string;
    pages?: StaffPage[];
    canManageRoster?: boolean;
    canCreateStaff?: boolean;
    canRemoveUsers?: boolean;
  }
): SessionUser {
  const derived = permissionsFromRole(roleDoc);
  return {
    id: user._id!.toHexString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    entity: user.entity,
    role: user.role,
    roleName: derived.roleName,
    pages: derived.pages,
    permissions: derived.permissions
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
    const roleDoc = (await getRoleByKey(db, user.role)) || fallbackRole(user.role);
    return toSessionUser(user, roleDoc);
  } catch {
    return null;
  }
}

export async function requirePageUser(roles?: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles?.length) return user;

  const learnerOnly = roles.every((role) => role === "LEARNER");
  const staffOnly = roles.every((role) => role !== "LEARNER");
  if (learnerOnly && isStaffUser(user)) redirect(homePath(user));
  if (staffOnly && !isStaffUser(user)) redirect(homePath(user));
  return user;
}

export async function requireStaffPage(page: StaffPage): Promise<SessionUser> {
  const user = await requirePageUser();
  if (!isStaffUser(user) || !hasPage(user, page)) {
    redirect(homePath(user));
  }
  return user;
}

export function isStaffUser(user: SessionUser): boolean {
  return user.permissions.staff;
}

export function isAdminRole(user: SessionUser | UserRole): boolean {
  if (typeof user === "string") return user !== "LEARNER";
  return user.permissions.staff;
}

export function isFullAdmin(user: SessionUser | UserRole): boolean {
  if (typeof user === "string") return user === "ADMIN";
  return user.role === "ADMIN";
}

export function hasPage(user: SessionUser, page: StaffPage): boolean {
  return isFullAdmin(user) || user.pages.includes(page);
}

export function homePath(user: SessionUser): string {
  if (!isStaffUser(user)) return "/dashboard";
  if (hasPage(user, "overview")) return "/admin";
  const first = STAFF_PAGES.find((item) => hasPage(user, item.key));
  return first?.href || "/admin";
}

export function canManageParticipantRoster(user: SessionUser | UserRole): boolean {
  if (typeof user === "string") return user === "ADMIN";
  return user.permissions.manageRoster;
}

export function canManageCourses(user: SessionUser | UserRole): boolean {
  if (typeof user === "string") return user !== "LEARNER";
  return user.permissions.manageCourses;
}

/** @deprecated use canManageCourses */
export function canUploadCourses(user: SessionUser | UserRole): boolean {
  return canManageCourses(user);
}

export function canCreateStaff(user: SessionUser | UserRole): boolean {
  if (typeof user === "string") return user === "ADMIN";
  return user.permissions.createStaff;
}

export function canRemoveUsers(user: SessionUser | UserRole): boolean {
  if (typeof user === "string") return user === "ADMIN";
  return user.permissions.removeUsers;
}

export function canManageUsers(user: SessionUser): boolean {
  return user.permissions.manageUsers;
}

export function canManageUserStatus(actor: SessionUser | UserRole, targetRole: UserRole): boolean {
  if (typeof actor === "string") {
    if (actor === "ADMIN") return true;
    return actor !== "LEARNER" && targetRole === "LEARNER";
  }
  if (isFullAdmin(actor)) return true;
  return actor.permissions.manageUsers && targetRole === "LEARNER";
}

export function canEditUser(actor: SessionUser | UserRole, targetRole: UserRole): boolean {
  return canManageUserStatus(actor, targetRole);
}

export function canInviteRole(actor: SessionUser | UserRole, targetRole: UserRole): boolean {
  if (typeof actor === "string") {
    if (actor === "ADMIN") return true;
    return actor !== "LEARNER" && targetRole === "LEARNER";
  }
  if (isFullAdmin(actor)) return true;
  return actor.permissions.manageUsers && targetRole === "LEARNER";
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
