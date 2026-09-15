"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DashboardStats, PeriodKey } from "@/lib/dashboard-stats";

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: "all", label: "All time" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" }
];

export default function AdminOverview({
  stats,
  canViewReports,
  canViewUsers,
  canViewSettings
}: {
  stats: DashboardStats;
  canViewReports: boolean;
  canViewUsers: boolean;
  canViewSettings: boolean;
}) {
  const [period, setPeriod] = useState<PeriodKey>("all");
  const current = stats.periods[period];
  const maxBar = Math.max(current.notStarted, current.inProgress, current.completed, 1);
  const started = current.inProgress + current.completed;
  const completionRate = current.total ? Math.round((current.completed / current.total) * 100) : 0;

  const bars = useMemo(
    () => [
      { key: "NOT_STARTED", label: "Not started", value: current.notStarted, tone: "muted" as const },
      { key: "IN_PROGRESS", label: "In progress", value: current.inProgress, tone: "warning" as const },
      { key: "COMPLETED", label: "Completed", value: current.completed, tone: "success" as const }
    ],
    [current]
  );

  return (
    <>
      <div className="dash-period" role="tablist" aria-label="Time range">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`dash-period-btn${period === item.key ? " active" : ""}`}
            onClick={() => setPeriod(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid four dash-stats">
        <div className="card">
          <div className="muted">Learners</div>
          <div className="stat">{stats.learners.total}</div>
          <div className="helper">{stats.learners.active} active · {stats.learners.invited} invited</div>
        </div>
        <div className="card">
          <div className="muted">{period === "all" ? "Assignments" : "Assigned in range"}</div>
          <div className="stat">{period === "all" ? current.total : current.assignedInPeriod}</div>
          <div className="helper">{stats.courses} published courses</div>
        </div>
        <div className="card">
          <div className="muted">Started</div>
          <div className="stat">{started}</div>
          <div className="helper">{current.notStarted} not opened yet</div>
        </div>
        <div className="card">
          <div className="muted">Completed</div>
          <div className="stat">{period === "all" ? current.completed : current.completedInPeriod}</div>
          <div className="helper">{completionRate}% of assignments in view</div>
        </div>
      </div>

      <div className="grid two" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Course progress</h2>
          <p className="helper">
            {period === "all"
              ? "Current status across every active assignment."
              : "Assignments created in this period, plus completions dated in this period."}
          </p>
          <div className="dash-stack" aria-hidden="true">
            {current.total > 0 && (
              <div className="dash-stack-track">
                <span className="dash-stack-seg muted" style={{ width: `${(current.notStarted / current.total) * 100}%` }} />
                <span className="dash-stack-seg warning" style={{ width: `${(current.inProgress / current.total) * 100}%` }} />
                <span className="dash-stack-seg success" style={{ width: `${(current.completed / current.total) * 100}%` }} />
              </div>
            )}
          </div>
          <div className="dash-bars">
            {bars.map((bar) => (
              <Link key={bar.key} className="dash-bar-row" href={canViewReports ? `/admin/reports?status=${bar.key}` : "/admin"}>
                <span>{bar.label}</span>
                <span className="dash-bar-track">
                  <span className={`dash-bar-fill ${bar.tone}`} style={{ width: `${(bar.value / maxBar) * 100}%` }} />
                </span>
                <strong>{bar.value}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Learner activations</h2>
          <p className="helper">Account status for learner user groups, plus new active learners in this range.</p>
          <div className="dash-activation">
            <div>
              <div className="muted">Invited</div>
              <div className="stat">{stats.learners.invited}</div>
            </div>
            <div>
              <div className="muted">Active</div>
              <div className="stat">{stats.learners.active}</div>
            </div>
            <div>
              <div className="muted">Inactive</div>
              <div className="stat">{stats.learners.inactive}</div>
            </div>
            <div>
              <div className="muted">New active {period === "all" ? "accounts" : "in range"}</div>
              <div className="stat">{current.newlyActivated}</div>
            </div>
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            {canViewReports && <Link className="btn" href="/admin/reports">Open reports</Link>}
            {canViewUsers && <Link className="btn secondary" href="/admin/users">Manage users</Link>}
            {canViewSettings && <Link className="btn secondary" href="/admin/settings">User groups</Link>}
          </div>
        </div>
      </div>
    </>
  );
}
