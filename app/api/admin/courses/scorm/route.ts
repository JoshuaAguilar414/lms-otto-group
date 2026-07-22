import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiError, isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { extractScormPackage } from "@/lib/scorm";
import type { CourseDocument } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  try {
    const form = await request.formData();
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const file = form.get("file");
    if (!title || !(file instanceof File)) return NextResponse.json({ error: "Title and ZIP package are required" }, { status: 400 });
    const maxBytes = Number(process.env.MAX_SCORM_UPLOAD_MB || 500) * 1024 * 1024;
    if (file.size > maxBytes) return NextResponse.json({ error: "SCORM package exceeds the configured upload limit" }, { status: 413 });

    const id = new ObjectId();
    const { launchPath } = await extractScormPackage(Buffer.from(await file.arrayBuffer()), id.toHexString());
    const now = new Date();
    const course: CourseDocument = { _id: id, title, description, type: "SCORM_12", active: true, launchPath, originalFilename: file.name, createdAt: now, updatedAt: now };
    await (await getDb()).collection<CourseDocument>("courses").insertOne(course);
    return NextResponse.json({ course: { id: id.toHexString(), title, description, type: course.type } });
  } catch (error) {
    return apiError(error, "SCORM upload failed");
  }
}
