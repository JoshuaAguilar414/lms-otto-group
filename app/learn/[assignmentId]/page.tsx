import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import ScormPlayer from "@/components/ScormPlayer";
import { requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { AssignmentDocument, CourseDocument } from "@/lib/types";
import { safeObjectId } from "@/lib/utils";

export default async function LearnPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requirePageUser();
  const { assignmentId } = await params;
  const assignmentObjectId = safeObjectId(assignmentId);
  if (!assignmentObjectId) notFound();

  const db = await getDb();
  const assignment = await db.collection<AssignmentDocument>("assignments").findOne({
    _id: assignmentObjectId,
    ...(user.role === "LEARNER" ? { userId: new ObjectId(user.id) } : {})
  });
  if (!assignment) notFound();
  const course = await db.collection<CourseDocument>("courses").findOne({
    _id: assignment.courseId,
    active: true,
    type: "SCORM_12"
  });
  if (!course?._id || !course.launchPath) notFound();

  const launchUrl = `/api/scorm/${course._id.toHexString()}/content/${course.launchPath.split("/").map(encodeURIComponent).join("/")}`;

  return (
    <>
      <link rel="preconnect" href="https://app.mindsmith.ai" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://app.mindsmith.ai" />
      <link rel="preload" href="/mindsmith-scorm-interface.js" as="script" />
      <link rel="prefetch" href={launchUrl} />
      <ScormPlayer
        assignmentId={assignmentId}
        courseTitle={course.title}
        initialStatus={assignment.status}
        launchUrl={launchUrl}
        initialValues={{
        "cmi.core.student_id": user.id,
        "cmi.core.student_name": `${user.lastName}, ${user.firstName}`,
        "cmi.core.credit": "credit",
        "cmi.core.lesson_mode": "normal",
        "cmi.core.entry": assignment.status === "NOT_STARTED" ? "ab-initio" : "resume",
        "cmi.core.lesson_location": assignment.scormData.lessonLocation || "",
        "cmi.core.lesson_status": assignment.scormData.lessonStatus || "not attempted",
        "cmi.core.score.raw": assignment.scormData.scoreRaw?.toString() || "",
        "cmi.core.score.min": assignment.scormData.scoreMin?.toString() || "0",
        "cmi.core.score.max": assignment.scormData.scoreMax?.toString() || "100",
        "cmi.suspend_data": assignment.scormData.suspendData || "",
        "cmi.progress_measure": assignment.scormData.progressMeasure?.toString() || "",
        "cmi.core.total_time": assignment.scormData.totalTime || "0000:00:00.00",
        "cmi.core.exit": assignment.scormData.exit || ""
        }}
      />
    </>
  );
}
