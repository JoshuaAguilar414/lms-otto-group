import Link from "next/link";
import AdminOverview from "@/components/AdminOverview";
import Shell from "@/components/Shell";
import { hasPage, isFullAdmin, requireStaffPage } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { getDb } from "@/lib/db";

export default async function AdminPage() {
  const user = await requireStaffPage("overview");
  const db = await getDb();
  const stats = await getDashboardStats(db);
  const fullAdmin = isFullAdmin(user);

  return (
    <Shell user={user}>
      <h1 className="page-title">Training overview</h1>
      <p className="page-subtitle">
        See who has started, who is in progress, and who has completed assigned courses.
        Filter by week, month, or year, then open reports for the same learner list.
      </p>
      <AdminOverview
        stats={stats}
        canViewReports={hasPage(user, "reports")}
        canViewUsers={hasPage(user, "users")}
        canViewSettings={hasPage(user, "settings")}
      />
      <div className="card" style={{ marginTop: 20 }}>
        <h2>{fullAdmin ? "Recommended onboarding sequence" : "Coordinator checklist"}</h2>
        {fullAdmin ? (
          <ol className="muted" style={{ marginBottom: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Import the VECTRA participant roster (Facilities / Business Partners + Company IDs).</li>
            <li>Upload the Freely Chosen Employment SCORM 1.2 course.</li>
            <li>Learners self-register with an approved Company ID, or import a learner CSV or XLSX file.</li>
            <li>Assign the course (auto-assigned on registration when the course title matches the topic).</li>
            <li>Export progress reports as training completes.</li>
          </ol>
        ) : (
          <ol className="muted" style={{ marginBottom: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Invite learners with an approved Company ID, or import learner CSV or XLSX.</li>
            <li>Upload or update SCORM 1.2 courses as needed.</li>
            <li>Assign courses to learners.</li>
            <li>Review and export progress reports.</li>
          </ol>
        )}
        <div className="actions" style={{ marginTop: 16 }}>
          {fullAdmin && <Link className="btn" href="/admin/participants">Open participant roster</Link>}
          <Link className="btn secondary" href="/admin/users">Manage learners</Link>
          <Link className="btn secondary" href="/admin/courses">Manage courses</Link>
          {hasPage(user, "settings") && <Link className="btn secondary" href="/admin/settings">Field settings</Link>}
          <div className="helper">Published courses: {stats.courses}</div>
        </div>
      </div>
    </Shell>
  );
}
