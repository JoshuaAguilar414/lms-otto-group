import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { isApiError, requireApiUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { computeActivitySteps, computeScormProgress, countScormInteractions, parseProgressMeasure } from "@/lib/scorm-progress";
import type { AssignmentDocument, ScormData } from "@/lib/types";
import { clamp, safeObjectId } from "@/lib/utils";
import { progressSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requireApiUser();
  if (isApiError(user)) return user;
  const { assignmentId } = await params;
  const id = safeObjectId(assignmentId);
  if (!id) return NextResponse.json({ error: "Invalid assignment" }, { status: 400 });
  const parsed = progressSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid SCORM progress payload" }, { status: 400 });

  const db = await getDb();
  const assignment = await db.collection<AssignmentDocument>("assignments").findOne({
    _id: id,
    ...(user.role === "LEARNER" ? { userId: new ObjectId(user.id) } : {})
  });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const values = parsed.data.values;
  const prev = assignment.scormData || {};
  const lessonStatus = pickString(values["cmi.core.lesson_status"], prev.lessonStatus) || "incomplete";
  const scoreRaw = pickNumber(values["cmi.core.score.raw"], prev.scoreRaw);
  const scoreMin = pickNumber(values["cmi.core.score.min"], prev.scoreMin);
  const scoreMax = pickNumber(values["cmi.core.score.max"], prev.scoreMax) ?? 100;
  const lessonLocation = pickString(values["cmi.core.lesson_location"], prev.lessonLocation) || "";
  const suspendData = pickString(values["cmi.suspend_data"], prev.suspendData) || "";
  const progressMeasure = pickProgressMeasure(values["cmi.progress_measure"], prev.progressMeasure);
  const totalTime = pickString(values["cmi.core.total_time"], prev.totalTime) || "";
  const sessionTime = pickString(values["cmi.core.session_time"], prev.sessionTime) || "";
  const exit = pickString(values["cmi.core.exit"], prev.exit) || "";

  const completed = ["completed", "passed"].includes(lessonStatus.toLowerCase());
  const started =
    lessonStatus.toLowerCase() !== "not attempted" ||
    Boolean(lessonLocation || suspendData || scoreRaw !== undefined || progressMeasure !== undefined);
  const now = new Date();
  const interactionCount = countScormInteractions(values);
  const { activitySteps, lastProgressBumpAt } = computeActivitySteps({
    previousSteps: prev.activitySteps ?? 0,
    previousInteractionCount: prev.interactionCount ?? 0,
    interactionCount,
    started,
    completed,
    now,
    lastProgressBumpAt: prev.lastProgressBumpAt
  });
  const progress = computeScormProgress({
    completed,
    started,
    previous: assignment.progress,
    progressMeasure,
    scoreRaw,
    scoreMin,
    scoreMax,
    activitySteps
  });

  const scormData: ScormData = {
    lessonLocation,
    lessonStatus,
    scoreRaw,
    scoreMin,
    scoreMax,
    progressMeasure,
    interactionCount,
    activitySteps,
    ...(lastProgressBumpAt ? { lastProgressBumpAt } : {}),
    suspendData,
    totalTime,
    sessionTime,
    exit
  };

  await db.collection<AssignmentDocument>("assignments").updateOne(
    { _id: id },
    {
      $set: {
        status: completed ? "COMPLETED" : started ? "IN_PROGRESS" : "NOT_STARTED",
        progress: clamp(progress, 0, 100),
        ...(scoreRaw !== undefined ? { score: scoreRaw } : {}),
        scormData,
        lastActivityAt: now,
        updatedAt: now,
        ...(completed && !assignment.completedAt ? { completedAt: now } : {})
      }
    }
  );
  return NextResponse.json({ ok: true, completed, progress });
}

function pickString(next: string | undefined, previous: string | undefined): string | undefined {
  if (next !== undefined && next !== "") return next;
  return previous;
}

function pickNumber(next: string | undefined, previous: number | undefined): number | undefined {
  if (next !== undefined && next.trim() !== "") {
    const parsed = Number(next);
    return Number.isFinite(parsed) ? parsed : previous;
  }
  return previous;
}

function pickProgressMeasure(next: string | undefined, previous: number | undefined): number | undefined {
  if (next !== undefined && next.trim() !== "") {
    return parseProgressMeasure(next) ?? previous;
  }
  return previous;
}
