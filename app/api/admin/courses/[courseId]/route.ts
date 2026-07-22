import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { apiError, isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { courseStorageRoot } from "@/lib/scorm";
import type { CourseDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { updateCourseSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  const { courseId } = await params;
  const id = safeObjectId(courseId);
  if (!id) return NextResponse.json({ error: "Invalid course" }, { status: 400 });

  const parsed = updateCourseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid course update" }, { status: 400 });
  }

  const db = await getDb();
  const course = await db.collection<CourseDocument>("courses").findOne({ _id: id, active: true });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const $set: Partial<CourseDocument> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) $set.title = parsed.data.title;
  if (parsed.data.description !== undefined) $set.description = parsed.data.description;

  await db.collection<CourseDocument>("courses").updateOne({ _id: id }, { $set });
  const updated = await db.collection<CourseDocument>("courses").findOne({ _id: id });
  return NextResponse.json({
    course: {
      id: id.toHexString(),
      title: updated!.title,
      description: updated!.description,
      type: updated!.type
    }
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  const { courseId } = await params;
  const id = safeObjectId(courseId);
  if (!id) return NextResponse.json({ error: "Invalid course" }, { status: 400 });

  try {
    const db = await getDb();
    const course = await db.collection<CourseDocument>("courses").findOne({ _id: id, active: true });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    await db.collection<CourseDocument>("courses").updateOne(
      { _id: id },
      { $set: { active: false, updatedAt: new Date() } }
    );
    await db.collection("assignments").deleteMany({ courseId: id });

    if (course.type === "SCORM_12") {
      await fs.rm(path.join(courseStorageRoot(), id.toHexString()), { recursive: true, force: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "Course removal failed");
  }
}
