import path from "node:path";
import { lookup } from "mime-types";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { readCourseFile, storageBackend } from "@/lib/course-storage";
import { getDb } from "@/lib/db";
import { patchScormLaunchHtml } from "@/lib/scorm";
import type { AssignmentDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string; path: string[] }> }) {
  const user = await requireApiUser();
  if (isApiError(user)) return user;
  const { courseId, path: routePath } = await params;
  const courseObjectId = safeObjectId(courseId);
  if (!courseObjectId) return NextResponse.json({ error: "Invalid course" }, { status: 400 });

  if (user.role === "LEARNER") {
    const db = await getDb();
    const assignment = await db.collection<AssignmentDocument>("assignments").findOne({
      userId: new ObjectId(user.id),
      courseId: courseObjectId
    });
    if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const decodedParts = routePath.map((part) => decodeURIComponent(part));
  if (decodedParts.some((part) => part === ".." || part.includes("\0"))) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
  const relativePath = decodedParts.join("/");

  try {
    const file = await readCourseFile(courseId, relativePath);
    if (!file) {
      const backend = storageBackend();
      return NextResponse.json(
        {
          error:
            backend === "r2"
              ? "SCORM file not found in Cloudflare R2. Re-upload the SCORM ZIP in Admin → Courses."
              : "SCORM package files are missing on this server. On Render free, configure Cloudflare R2 (R2_* env vars) and re-upload the SCORM ZIP."
        },
        { status: 404 }
      );
    }

    const contentType = lookup(relativePath) || lookup(path.basename(relativePath)) || "application/octet-stream";
    if (String(contentType).includes("html")) {
      const html = patchScormLaunchHtml(file.toString("utf8"));
      return new NextResponse(html, {
        headers: {
          "Content-Type": String(contentType),
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": String(contentType),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("SCORM content read failed", error);
    return NextResponse.json({ error: "Unable to load SCORM file" }, { status: 500 });
  }
}
