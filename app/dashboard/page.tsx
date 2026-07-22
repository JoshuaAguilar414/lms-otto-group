import { ObjectId } from "mongodb";
import Link from "next/link";
import Shell from "@/components/Shell";
import { withActiveCourseStages } from "@/lib/assignments";
import { requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { AssignmentDocument, CourseDocument } from "@/lib/types";

export default async function LearnerOverviewPage() {
  const user = await requirePageUser(["LEARNER"]);
  const db = await getDb();
  const assignments = await db.collection<AssignmentDocument>("assignments").aggregate([
    { $match: { userId: new ObjectId(user.id) } },
    ...withActiveCourseStages()
  ]).toArray() as Array<AssignmentDocument & { course: CourseDocument }>;

  const total = assignments.length;
  const notStarted = assignments.filter((item) => item.status === "NOT_STARTED").length;
  const inProgress = assignments.filter((item) => item.status === "IN_PROGRESS").length;
  const completed = assignments.filter((item) => item.status === "COMPLETED").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <Shell user={user}>
      <h1 className="page-title">Overview</h1>
      <p className="page-subtitle">
        Welcome back, {user.firstName}. Track your training progress and open your courses when you are ready.
      </p>
      <div className="grid three">
        <div className="card">
          <div className="muted">Assigned courses</div>
          <div className="stat">{total}</div>
        </div>
        <div className="card">
          <div className="muted">In progress</div>
          <div className="stat">{inProgress}</div>
        </div>
        <div className="card">
          <div className="muted">Completed</div>
          <div className="stat">{completed}</div>
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Your status</h2>
          <p className="muted">Not started: {notStarted}</p>
          <p className="muted">In progress: {inProgress}</p>
          <p className="muted">Completed: {completed} of {total}</p>
          <div className="progress-track" style={{ marginTop: 12 }}>
            <div className="progress-bar" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        <div className="card">
          <h2>Continue training</h2>
          <p className="muted">Open your assigned SCORM courses and resume from your last saved position.</p>
          <div className="actions" style={{ marginTop: 16 }}>
            <Link className="btn" href="/dashboard/courses">View my courses</Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
