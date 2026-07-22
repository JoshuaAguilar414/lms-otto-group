import fs from "node:fs/promises";
import path from "node:path";
import { ObjectId } from "mongodb";
import { lookup } from "mime-types";
import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { courseStorageRoot, patchScormLaunchHtml } from "@/lib/scorm";
import { getDb } from "@/lib/db";
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

  const root = path.resolve(courseStorageRoot(), courseId);
  const decodedParts = routePath.map((part) => decodeURIComponent(part));
  const absolute = path.resolve(root, ...decodedParts);
  if (!absolute.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    const file = await fs.readFile(absolute);
    const contentType = lookup(absolute) || "application/octet-stream";
    if (contentType.includes("html")) {
      const html = patchScormLaunchHtml(file.toString("utf8"));
      return new NextResponse(html, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "SCORM file not found" }, { status: 404 });
  }
}
