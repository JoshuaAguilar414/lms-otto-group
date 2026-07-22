import Link from "next/link";
import { assignmentStatusBarWidth, formatAssignmentStatus } from "@/lib/assignment-display";

interface AssignmentView {
  id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  score?: number;
  lastActivityAt?: string;
  course: { title: string; description: string; type: string };
}

export default function LearnerCourses({ assignments }: { assignments: AssignmentView[] }) {
  if (!assignments.length) {
    return <div className="card"><h2>No courses assigned</h2><p className="muted">Your coordinator has not assigned training yet.</p></div>;
  }
  return (
    <div className="course-list">
      {assignments.map((assignment) => (
        <article className="card course-card" key={assignment.id}>
          <div>
            <div className={`badge ${assignment.status === "COMPLETED" ? "completed" : assignment.status === "IN_PROGRESS" ? "progress" : ""}`}>
              {formatAssignmentStatus(assignment.status)}
            </div>
            <h3 style={{ marginTop: 12 }}>{assignment.course.title}</h3>
            <p className="muted">{assignment.course.description || "Assigned Otto Group training course"}</p>
            <div className="progress-track"><div className="progress-bar" style={{ width: `${assignmentStatusBarWidth(assignment.status)}%` }} /></div>
            <p className="helper">{formatAssignmentStatus(assignment.status)}{assignment.score !== undefined ? ` · Score ${assignment.score}` : ""}</p>
          </div>
          <Link className="btn" href={`/learn/${assignment.id}`}>
            {assignment.status === "NOT_STARTED" ? "Start course" : assignment.status === "COMPLETED" ? "Review course" : "Continue course"}
          </Link>
        </article>
      ))}
    </div>
  );
}
