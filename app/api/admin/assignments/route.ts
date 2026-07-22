import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import type { AssignmentDocument, CourseDocument, UserDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";
import { assignCourseSchema, bulkAssignSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const body = await request.json();

  // Single assign (existing contract)
  if (body.userId && body.courseId && !body.allLearners && !body.userIds && !body.companyId && !body.country && !body.stakeholderGroup) {
    const parsed = assignCourseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Select a learner and course" }, { status: 400 });
    const userId = safeObjectId(parsed.data.userId);
    const courseId = safeObjectId(parsed.data.courseId);
    if (!userId || !courseId) return NextResponse.json({ error: "Invalid learner or course" }, { status: 400 });
    const db = await getDb();
    const [learner, course] = await Promise.all([
      db.collection<UserDocument>("users").findOne({ _id: userId, role: "LEARNER", status: { $ne: "INACTIVE" } }),
      db.collection<CourseDocument>("courses").findOne({ _id: courseId, active: true, type: "SCORM_12" })
    ]);
    if (!learner || !course) return NextResponse.json({ error: "Learner or SCORM course not found" }, { status: 404 });
    const now = new Date();
    const result = await db.collection<AssignmentDocument>("assignments").updateOne(
      { userId, courseId },
      { $setOnInsert: { userId, courseId, status: "NOT_STARTED", progress: 0, scormData: {}, assignedAt: now, updatedAt: now } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, alreadyAssigned: result.upsertedCount === 0, assigned: result.upsertedCount });
  }

  const parsed = bulkAssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid bulk assignment" }, { status: 400 });
  }

  const courseId = safeObjectId(parsed.data.courseId);
  if (!courseId) return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  const db = await getDb();
  const course = await db.collection<CourseDocument>("courses").findOne({ _id: courseId, active: true, type: "SCORM_12" });
  if (!course) return NextResponse.json({ error: "SCORM course not found" }, { status: 404 });

  const learnerQuery: Record<string, unknown> = {
    role: "LEARNER",
    status: { $ne: "INACTIVE" }
  };
  if (parsed.data.userIds?.length) {
    const ids = parsed.data.userIds.map(safeObjectId).filter(Boolean) as ObjectId[];
    learnerQuery._id = { $in: ids };
  }
  if (parsed.data.companyId) learnerQuery.companyId = parsed.data.companyId.trim();
  if (parsed.data.country) learnerQuery.country = parsed.data.country.trim();
  if (parsed.data.stakeholderGroup) learnerQuery.stakeholderGroup = parsed.data.stakeholderGroup;

  const learners = await db.collection<UserDocument>("users").find(learnerQuery).toArray();
  if (!learners.length) {
    return NextResponse.json({ error: "No matching learners found for this assignment." }, { status: 404 });
  }

  const now = new Date();
  let assigned = 0;
  let alreadyAssigned = 0;
  for (const learner of learners) {
    if (!learner._id) continue;
    const result = await db.collection<AssignmentDocument>("assignments").updateOne(
      { userId: learner._id, courseId },
      {
        $setOnInsert: {
          userId: learner._id,
          courseId,
          status: "NOT_STARTED",
          progress: 0,
          scormData: {},
          assignedAt: now,
          updatedAt: now
        }
      },
      { upsert: true }
    );
    if (result.upsertedCount) assigned += 1;
    else alreadyAssigned += 1;
  }

  return NextResponse.json({
    ok: true,
    matchedLearners: learners.length,
    assigned,
    alreadyAssigned
  });
}

export async function DELETE(request: Request) {
  const admin = await requireApiUser(true);
  if (isApiError(admin)) return admin;
  const parsed = assignCourseSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Select a learner and course" }, { status: 400 });
  const userId = safeObjectId(parsed.data.userId);
  const courseId = safeObjectId(parsed.data.courseId);
  if (!userId || !courseId) return NextResponse.json({ error: "Invalid learner or course" }, { status: 400 });

  const db = await getDb();
  const result = await db.collection<AssignmentDocument>("assignments").deleteOne({ userId, courseId });
  if (!result.deletedCount) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
