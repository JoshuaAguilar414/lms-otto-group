"use client";

import { useMemo, useState } from "react";
import ListControls from "@/components/ListControls";
import { formatAssignmentStatus } from "@/lib/assignment-display";
import { useFilteredPagination } from "@/lib/useFilteredPagination";

interface ReportRow {
  id: string;
  learnerName: string;
  email: string;
  entity: string;
  country: string;
  courseTitle: string;
  status: string;
  progress: number;
  score?: number;
  lastActivityAt?: string;
  completedAt?: string;
}

export default function AdminReports({ rows }: { rows: ReportRow[] }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");

  const courses = useMemo(
    () => [...new Set(rows.map((item) => item.courseTitle))].sort(),
    [rows]
  );
  const countries = useMemo(
    () => [...new Set(rows.map((item) => item.country).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(
    () => rows.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (courseFilter !== "ALL" && item.courseTitle !== courseFilter) return false;
      if (countryFilter !== "ALL" && item.country !== countryFilter) return false;
      return true;
    }),
    [rows, statusFilter, courseFilter, countryFilter]
  );

  const list = useFilteredPagination(
    filtered,
    (item) => [item.learnerName, item.email, item.entity, item.courseTitle, item.country, item.status],
    { initialPageSize: 25 }
  );

  const csvHref = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (courseFilter !== "ALL") params.set("course", courseFilter);
    if (countryFilter !== "ALL") params.set("country", countryFilter);
    if (list.query.trim()) params.set("q", list.query.trim());
    const query = params.toString();
    return `/api/admin/reports/csv${query ? `?${query}` : ""}`;
  }, [statusFilter, courseFilter, countryFilter, list.query]);

  return (
    <div className="grid">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Progress reports</h1>
          <p className="page-subtitle">Review active learners, completed courses, and outstanding requirements.</p>
        </div>
        <a className="btn" href={csvHref}>Export CSV</a>
      </div>

      <ListControls
        query={list.query}
        onQueryChange={list.setQuery}
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        searchPlaceholder="Search learner, email, entity, course…"
        filters={(
          <div className="list-controls-row">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select className="select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); list.setPage(1); }}>
                <option value="ALL">All</option>
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Course</label>
              <select className="select" value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); list.setPage(1); }}>
                <option value="ALL">All</option>
                {courses.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Country</label>
              <select className="select" value={countryFilter} onChange={(event) => { setCountryFilter(event.target.value); list.setPage(1); }}>
                <option value="ALL">All</option>
                {countries.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </div>
          </div>
        )}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Learner</th>
              <th>Entity</th>
              <th>Course</th>
              <th>Status</th>
              <th>Score</th>
              <th>Last activity</th>
              <th>Completion</th>
            </tr>
          </thead>
          <tbody>
            {!list.pageItems.length && (
              <tr><td colSpan={7}>No rows match the current filters.</td></tr>
            )}
            {list.pageItems.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.learnerName}</strong><br />
                  <span className="helper">{row.email}</span>
                </td>
                <td>{row.entity}</td>
                <td>{row.courseTitle}</td>
                <td>
                  <span className={`badge ${row.status === "COMPLETED" ? "completed" : row.status === "IN_PROGRESS" ? "progress" : ""}`}>
                    {formatAssignmentStatus(row.status)}
                  </span>
                </td>
                <td>{row.score ?? "—"}</td>
                <td>{row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : "—"}</td>
                <td>{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
