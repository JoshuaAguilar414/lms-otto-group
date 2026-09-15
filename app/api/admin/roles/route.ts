import { NextResponse } from "next/server";
import { z } from "zod";
import { isApiError, requireFullAdminApi } from "@/lib/api";
import { getDb } from "@/lib/db";
import { STAFF_PAGES } from "@/lib/role-catalog";
import { isSystemRoleKey, listRoles, nextUniqueRoleKey, toRoleView } from "@/lib/roles";
import type { RoleDocument, StaffPage, UserDocument } from "@/lib/types";

const staffPageSchema = z.enum(STAFF_PAGES.map((page) => page.key) as [StaffPage, ...StaffPage[]]);

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional().default(""),
  pages: z.array(staffPageSchema).default([]),
  canManageRoster: z.boolean().optional().default(false),
  canCreateStaff: z.boolean().optional().default(false),
  canRemoveUsers: z.boolean().optional().default(false)
});

const updateRoleSchema = z.object({
  key: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(300).optional(),
  pages: z.array(staffPageSchema).optional(),
  canManageRoster: z.boolean().optional(),
  canCreateStaff: z.boolean().optional(),
  canRemoveUsers: z.boolean().optional()
});

export async function GET() {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;
  const db = await getDb();
  return NextResponse.json({ roles: await listRoles(db) });
}

export async function POST(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;
  const parsed = createRoleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid user group" }, { status: 400 });
  }
  if (parsed.data.pages.length === 0) {
    return NextResponse.json({ error: "Select at least one page for this user group." }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.collection<RoleDocument>("roles").find({}).project({ key: 1 }).toArray();
  const key = nextUniqueRoleKey(parsed.data.name, new Set(existing.map((role) => role.key)));
  const now = new Date();
  const document: RoleDocument = {
    key,
    name: parsed.data.name,
    description: parsed.data.description,
    system: false,
    pages: parsed.data.pages,
    canManageRoster: parsed.data.canManageRoster,
    canCreateStaff: parsed.data.canCreateStaff,
    canRemoveUsers: parsed.data.canRemoveUsers,
    createdAt: now,
    updatedAt: now
  };
  const inserted = await db.collection<RoleDocument>("roles").insertOne(document);
  return NextResponse.json({ role: toRoleView({ ...document, _id: inserted.insertedId }) });
}

export async function PATCH(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;
  const parsed = updateRoleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid user group" }, { status: 400 });
  }

  const db = await getDb();
  const role = await db.collection<RoleDocument>("roles").findOne({ key: parsed.data.key });
  if (!role?._id) return NextResponse.json({ error: "User group not found." }, { status: 404 });
  if (role.key === "ADMIN" || role.key === "LEARNER") {
    return NextResponse.json({ error: "Admin and Learner access cannot be changed." }, { status: 400 });
  }

  const updates: Partial<RoleDocument> = { updatedAt: new Date() };
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.pages) updates.pages = parsed.data.pages;
  if (parsed.data.canManageRoster !== undefined) updates.canManageRoster = parsed.data.canManageRoster;
  if (parsed.data.canCreateStaff !== undefined) updates.canCreateStaff = parsed.data.canCreateStaff;
  if (parsed.data.canRemoveUsers !== undefined) updates.canRemoveUsers = parsed.data.canRemoveUsers;

  await db.collection<RoleDocument>("roles").updateOne({ _id: role._id }, { $set: updates });
  const updated = await db.collection<RoleDocument>("roles").findOne({ _id: role._id });
  return NextResponse.json({ role: toRoleView(updated!) });
}

export async function DELETE(request: Request) {
  const admin = await requireFullAdminApi();
  if (isApiError(admin)) return admin;
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key) return NextResponse.json({ error: "Missing user group." }, { status: 400 });
  if (isSystemRoleKey(key)) {
    return NextResponse.json({ error: "System user groups cannot be deleted." }, { status: 400 });
  }

  const db = await getDb();
  const inUse = await db.collection<UserDocument>("users").countDocuments({ role: key });
  if (inUse > 0) {
    return NextResponse.json({ error: `This user group is assigned to ${inUse} user(s). Reassign them first.` }, { status: 400 });
  }
  const result = await db.collection<RoleDocument>("roles").deleteOne({ key, system: false });
  if (!result.deletedCount) return NextResponse.json({ error: "User group not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
