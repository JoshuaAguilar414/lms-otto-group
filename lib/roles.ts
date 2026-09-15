import type { Db } from "mongodb";
import { isSystemRoleKey, slugRoleKey, STAFF_PAGES, type RoleView } from "@/lib/role-catalog";
import type { RoleDocument, UserRole } from "@/lib/types";

export { isLearnerRole, isSystemRoleKey, slugRoleKey, STAFF_PAGES, SYSTEM_ROLE_KEYS, type RoleView } from "@/lib/role-catalog";

const DEFAULT_ROLES: Array<Omit<RoleDocument, "_id" | "createdAt" | "updatedAt">> = [
  {
    key: "ADMIN",
    name: "Admin",
    description: "Full control of the LMS, including roster, staff, settings, and user groups.",
    system: true,
    pages: STAFF_PAGES.map((page) => page.key),
    canManageRoster: true,
    canCreateStaff: true,
    canRemoveUsers: true
  },
  {
    key: "COORDINATOR",
    name: "Coordinator",
    description: "Manage learners, courses, assignments, and reports. Roster is read-only.",
    system: true,
    pages: ["overview", "participants", "users", "courses", "reports"],
    canManageRoster: false,
    canCreateStaff: false,
    canRemoveUsers: false
  },
  {
    key: "LEARNER",
    name: "Learner",
    description: "Take assigned courses and manage a personal profile.",
    system: true,
    pages: [],
    canManageRoster: false,
    canCreateStaff: false,
    canRemoveUsers: false
  }
];

export function toRoleView(role: RoleDocument): RoleView {
  return {
    id: role._id!.toHexString(),
    key: role.key,
    name: role.name,
    description: role.description,
    system: role.system,
    pages: role.pages || [],
    canManageRoster: Boolean(role.canManageRoster),
    canCreateStaff: Boolean(role.canCreateStaff),
    canRemoveUsers: Boolean(role.canRemoveUsers)
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __systemRolesReady: Promise<void> | undefined;
}

export async function ensureSystemRoles(db: Db): Promise<void> {
  if (!global.__systemRolesReady) {
    global.__systemRolesReady = upsertSystemRoles(db);
  }
  await global.__systemRolesReady;
}

async function upsertSystemRoles(db: Db): Promise<void> {
  const now = new Date();
  const roles = db.collection<RoleDocument>("roles");
  for (const role of DEFAULT_ROLES) {
    const existing = await roles.findOne({ key: role.key });
    if (existing?._id) {
      if (role.key === "ADMIN" || role.key === "LEARNER") {
        await roles.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: role.name,
              description: role.description,
              system: true,
              pages: role.pages,
              canManageRoster: role.canManageRoster,
              canCreateStaff: role.canCreateStaff,
              canRemoveUsers: role.canRemoveUsers,
              updatedAt: now
            }
          }
        );
      } else {
        await roles.updateOne(
          { _id: existing._id },
          { $set: { system: true, name: existing.name || role.name, updatedAt: now } }
        );
      }
      continue;
    }
    await roles.insertOne({ ...role, createdAt: now, updatedAt: now });
  }
}

export async function listRoles(db: Db): Promise<RoleView[]> {
  await ensureSystemRoles(db);
  const roles = await db.collection<RoleDocument>("roles").find({}).sort({ system: -1, name: 1 }).toArray();
  return roles.filter((role) => role._id).map(toRoleView);
}

export async function getRoleByKey(db: Db, key: string): Promise<RoleDocument | null> {
  await ensureSystemRoles(db);
  return db.collection<RoleDocument>("roles").findOne({ key });
}

export function fallbackRole(key: string): RoleDocument {
  const match = DEFAULT_ROLES.find((role) => role.key === key);
  if (match) {
    return { ...match, createdAt: new Date(), updatedAt: new Date() };
  }
  if (key === "LEARNER" || !key) {
    return { ...DEFAULT_ROLES[2], createdAt: new Date(), updatedAt: new Date() };
  }
  return {
    ...DEFAULT_ROLES[1],
    key,
    name: key,
    system: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function nextUniqueRoleKey(name: string, existing: Set<string>): UserRole {
  const base = slugRoleKey(name);
  if (!existing.has(base) && !isSystemRoleKey(base)) return base;
  let index = 2;
  while (existing.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}
