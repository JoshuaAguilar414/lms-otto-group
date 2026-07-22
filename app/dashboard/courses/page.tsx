import { ObjectId } from "mongodb";
import Shell from "@/components/Shell";
import LearnerCourses from "@/components/LearnerCourses";
import { withActiveCourseStages } from "@/lib/assignments";
import { requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { AssignmentDocument, CourseDocument } from "@/lib/types";

export default async function LearnerCoursesPage() {
  const user = await requirePageUser(["LEARNER"]);
  const db = await getDb();
  const assignments = await db.collection<AssignmentDocument>("assignments").aggregate([
    { $match: { userId: new ObjectId(user.id) } },
    ...withActiveCourseStages(),
    { $sort: { assignedAt: -1 } }
  ]).toArray() as Array<AssignmentDocument & { course: CourseDocument }>;

  const data = assignments.map((item) => ({
    id: item._id!.toHexString(),
    status: item.status,
    progress: item.progress,
    score: item.score,
    lastActivityAt: item.lastActivityAt?.toISOString(),
    course: {
      title: item.course.title,
      description: item.course.description,
      type: item.course.type
    }
  }));

  return (
    <Shell user={user}>
      <h1 className="page-title">My courses</h1>
      <p className="page-subtitle">Open an assigned course or continue from your saved position.</p>
      <LearnerCourses assignments={data} />
    </Shell>
  );
}
