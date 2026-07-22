import Link from "next/link";
import Shell from "@/components/Shell";
import { withActiveCourseStages } from "@/lib/assignments";
import { isFullAdmin, requirePageUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { CourseDocument, ParticipantDocument, UserDocument } from "@/lib/types";

export default async function AdminPage() {
  const user = await requirePageUser(["ADMIN", "COORDINATOR"]);
  const db = await getDb();
  const [activeUsers, courses, assignmentStats, participants] = await Promise.all([
    db.collection<UserDocument>("users").countDocuments({ role: "LEARNER", status: { $ne: "INACTIVE" } }),
    db.collection<CourseDocument>("courses").countDocuments({ active: true }),
    db.collection("assignments").aggregate([
      ...withActiveCourseStages(),
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }
        }
      }
    ]).toArray(),
    db.collection<ParticipantDocument>("participants").countDocuments({ active: true })
  ]);
  const assignments = assignmentStats[0]?.total || 0;
  const completed = assignmentStats[0]?.completed || 0;
  const completionRate = assignments ? Math.round((completed / assignments) * 100) : 0;
  const fullAdmin = isFullAdmin(user.role);

  return (
    <Shell user={user}>
      <h1 className="page-title">Administration overview</h1>
      <p className="page-subtitle">
        {fullAdmin
          ? "Full administrator access: roster, learners, courses, assignments, and reporting."
          : "Coordinator access: manage learners, upload and assign courses, and view reports."}
      </p>
      <div className="grid three">
        <div className="card"><div className="muted">Approved organizations</div><div className="stat">{participants}</div></div>
        <div className="card"><div className="muted">Active and invited learners</div><div className="stat">{activeUsers}</div></div>
        <div className="card"><div className="muted">Assignment completion</div><div className="stat">{completionRate}%</div></div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h2>{fullAdmin ? "Recommended onboarding sequence" : "Coordinator checklist"}</h2>
        {fullAdmin ? (
          <ol className="muted" style={{ marginBottom: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Import the Vectra participant roster (Facilities / Business Partners + Company IDs).</li>
            <li>Upload the Freely Chosen Employment SCORM 1.2 course.</li>
            <li>Learners self-register with an approved Company ID, or import a learner email CSV.</li>
            <li>Assign the course (auto-assigned on registration when the course title matches the topic).</li>
            <li>Export progress reports as training completes.</li>
          </ol>
        ) : (
          <ol className="muted" style={{ marginBottom: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Invite learners with an approved Company ID, or import learner CSV.</li>
            <li>Upload or update SCORM 1.2 courses as needed.</li>
            <li>Assign courses to learners.</li>
            <li>Review and export progress reports.</li>
          </ol>
        )}
        <div className="actions" style={{ marginTop: 16 }}>
          {fullAdmin && <Link className="btn" href="/admin/participants">Open participant roster</Link>}
          <Link className="btn secondary" href="/admin/users">Manage learners</Link>
          <Link className="btn secondary" href="/admin/courses">Manage courses</Link>
          <div className="helper">Published courses: {courses}</div>
        </div>
      </div>
    </Shell>
  );
}
