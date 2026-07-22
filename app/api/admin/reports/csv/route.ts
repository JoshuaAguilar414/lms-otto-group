import { stringify } from "csv-stringify/sync";
import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { formatAssignmentStatus } from "@/lib/assignment-display";
import { withActiveCourseStages } from "@/lib/assignments";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const course = searchParams.get("course");
  const country = searchParams.get("country");
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const db = await getDb();
  const rows = await db.collection("assignments").aggregate([
    ...withActiveCourseStages(),
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $sort: { "user.entity": 1, "user.lastName": 1 } }
  ]).toArray();

  const filtered = rows.filter((row: any) => {
    if (status && row.status !== status) return false;
    if (course && row.course.title !== course) return false;
    if (country && (row.user.country || "") !== country) return false;
    if (q) {
      const haystack = [
        row.user.firstName,
        row.user.lastName,
        row.user.email,
        row.user.entity,
        row.user.country,
        row.course.title,
        row.status
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const csv = stringify(filtered.map((row: any) => ({
    "First Name": row.user.firstName,
    "Last Name": row.user.lastName,
    "Corporate Email": row.user.email,
    "Entity": row.user.entity,
    "Country": row.user.country || "",
    "Course": row.course.title,
    "Status": formatAssignmentStatus(row.status),
    "Assessment Score": row.score ?? "",
    "Last Completed Page or Lesson": row.scormData?.lessonLocation || "",
    "Last Activity Date": row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : "",
    "Completion Date": row.completedAt ? new Date(row.completedAt).toISOString() : ""
  })), { header: true });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="otto-lms-progress-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
