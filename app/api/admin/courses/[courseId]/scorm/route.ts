import { NextResponse } from "next/server";
import { apiError, isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { extractScormPackage } from "@/lib/scorm";
import type { CourseDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;

  const { courseId } = await params;
  const id = safeObjectId(courseId);
  if (!id) return NextResponse.json({ error: "Invalid course" }, { status: 400 });

  try {
    const db = await getDb();
    const course = await db.collection<CourseDocument>("courses").findOne({ _id: id, active: true });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    if (course.type !== "SCORM_12") {
      return NextResponse.json({ error: "Only SCORM courses can have their package replaced." }, { status: 400 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "SCORM ZIP package is required" }, { status: 400 });

    const maxBytes = Number(process.env.MAX_SCORM_UPLOAD_MB || 500) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "SCORM package exceeds the configured upload limit" }, { status: 413 });
    }

    const title = String(form.get("title") || course.title).trim();
    const description = String(form.get("description") || course.description).trim();
    if (!title) return NextResponse.json({ error: "Course title is required" }, { status: 400 });

    const { launchPath } = await extractScormPackage(Buffer.from(await file.arrayBuffer()), id.toHexString());
    const now = new Date();
    await db.collection<CourseDocument>("courses").updateOne(
      { _id: id },
      {
        $set: {
          title,
          description,
          launchPath,
          originalFilename: file.name,
          updatedAt: now
        }
      }
    );

    return NextResponse.json({
      course: {
        id: id.toHexString(),
        title,
        description,
        type: course.type
      }
    });
  } catch (error) {
    return apiError(error, "SCORM package update failed");
  }
}
