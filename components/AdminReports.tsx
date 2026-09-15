"use client";

import { useMemo, useState } from "react";
import { CheckboxFilter, ColumnManager, matchesSelected, uniqueSorted } from "@/components/DataTableControls";
import ListControls from "@/components/ListControls";
import { formatAssignmentStatus } from "@/lib/assignment-display";
import { csvFilename, downloadCsv } from "@/lib/csv-download";
import { getUserFieldValue, type FieldDefinitionView } from "@/lib/fields";
import { matchesQuery } from "@/lib/pagination";
import { useFilteredPagination } from "@/lib/useFilteredPagination";

export interface ReportRow {
  id: string;
  learnerName: string;
  email: string;
  entity: string;
  companyId: string;
  stakeholderGroup: string;
  belongsToBp: string;
  country: string;
  topic: string;
  nominatedProvider: string;
  customFields: Record<string, string>;
  courseTitle: string;
  status: string;
  progress: number;
  score?: number;
  lastActivityAt?: string;
  completedAt?: string;
}

const FIXED_COLUMNS = [
  { key: "learnerName", label: "Learner" },
  { key: "email", label: "Email" },
  { key: "entity", label: "Entity" }
];

const RESULT_COLUMNS = [
  { key: "courseTitle", label: "Course" },
  { key: "status", label: "Status" },
  { key: "score", label: "Score" },
  { key: "lastActivityAt", label: "Last activity" },
  { key: "completedAt", label: "Completion" }
];

export default function AdminReports({
  rows,
  fields,
  initialStatus
}: {
  rows: ReportRow[];
  fields: FieldDefinitionView[];
  initialStatus?: string;
}) {
  const [filters, setFilters] = useState<Record<string, string[]>>(
    initialStatus ? { status: [initialStatus] } : {}
  );
  const filterableFields = fields.filter((field) => field.filterable);
  const fieldColumns = fields
    .filter((field) => field.key !== "name")
    .map((field) => ({ key: field.key, label: field.label }));
  const tableColumns = [...FIXED_COLUMNS, ...fieldColumns, ...RESULT_COLUMNS];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => [
    "learnerName",
    "email",
    "entity",
    "country",
    "topic",
    "courseTitle",
    "status",
    "score",
    "lastActivityAt",
    "completedAt"
  ].filter((key) => tableColumns.some((column) => column.key === key)));

  function rowFieldValue(row: ReportRow, field: FieldDefinitionView): string {
    return getUserFieldValue(row, field);
  }

  const afterNonCourseFilters = useMemo(
    () => rows.filter((item) => {
      if (!matchesSelected(item.status, filters.status || [])) return false;
      return filterableFields.every((field) => matchesSelected(rowFieldValue(item, field), filters[field.key] || []));
    }),
    [rows, filters, filterableFields]
  );

  const courseOptions = useMemo(
    () => uniqueSorted(afterNonCourseFilters.map((item) => item.courseTitle)),
    [afterNonCourseFilters]
  );

  const courseFilter = useMemo(
    () => (filters.courseTitle || []).filter((course) => courseOptions.includes(course)),
    [filters.courseTitle, courseOptions]
  );

  const filtered = useMemo(
    () => afterNonCourseFilters.filter((item) => matchesSelected(item.courseTitle, courseFilter)),
    [afterNonCourseFilters, courseFilter]
  );

  const list = useFilteredPagination(
    filtered,
    (item) => [
      item.learnerName,
      item.email,
      item.entity,
      item.courseTitle,
      item.country,
      item.topic,
      item.status,
      ...fields.map((field) => rowFieldValue(item, field))
    ],
    { initialPageSize: 25 }
  );

  const visibleTableColumns = tableColumns.filter((column) => visibleColumns.includes(column.key));

  function cellValue(row: ReportRow, key: string): string {
    if (key === "learnerName") return row.learnerName;
    if (key === "email") return row.email;
    if (key === "entity") return row.entity;
    if (key === "courseTitle") return row.courseTitle;
    if (key === "status") return formatAssignmentStatus(row.status);
    if (key === "score") return row.score == null ? "" : String(row.score);
    if (key === "lastActivityAt") return row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : "";
    if (key === "completedAt") return row.completedAt ? new Date(row.completedAt).toLocaleDateString() : "";
    const field = fields.find((item) => item.key === key);
    return field ? rowFieldValue(row, field) : "";
  }

  function exportFilteredCsv() {
    const searched = filtered.filter((item) =>
      matchesQuery(
        [
          item.learnerName,
          item.email,
          item.entity,
          item.courseTitle,
          item.country,
          item.topic,
          item.status,
          ...fields.map((field) => rowFieldValue(item, field))
        ],
        list.query
      )
    );
    downloadCsv(
      csvFilename("otto-lms-progress"),
      visibleTableColumns,
      searched.map((row) => Object.fromEntries(visibleTableColumns.map((column) => [column.key, cellValue(row, column.key)])))
    );
  }

  const colSpan = visibleTableColumns.length || 1;

  return (
    <div className="grid">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Progress reports</h1>
          <p className="page-subtitle">Review active learners, completed courses, and outstanding requirements.</p>
        </div>
        <button className="btn" type="button" onClick={exportFilteredCsv}>Export CSV</button>
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
          <div className="filter-toolbar">
            <div className="checkbox-filter-bar">
              <CheckboxFilter
                label="Status"
                options={["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]}
                optionLabels={{ NOT_STARTED: "Not started", IN_PROGRESS: "In progress", COMPLETED: "Completed" }}
                selected={filters.status || []}
                onChange={(next) => { setFilters((current) => ({ ...current, status: next })); list.setPage(1); }}
              />
              {filterableFields.map((field) => (
                <CheckboxFilter
                  key={field.key}
                  label={field.label}
                  options={uniqueSorted([
                    ...(field.options || []),
                    ...rows.map((item) => rowFieldValue(item, field))
                  ])}
                  selected={filters[field.key] || []}
                  onChange={(next) => {
                    setFilters((current) => {
                      const updated = { ...current, [field.key]: next };
                      if (field.key === "topic" && (updated.courseTitle || []).length) {
                        const allowed = new Set(
                          rows
                            .filter((item) => matchesSelected(rowFieldValue(item, field), next))
                            .map((item) => item.courseTitle)
                        );
                        updated.courseTitle = (updated.courseTitle || []).filter((course) => allowed.has(course));
                      }
                      return updated;
                    });
                    list.setPage(1);
                  }}
                />
              ))}
              <CheckboxFilter
                label="Course"
                options={courseOptions}
                selected={courseFilter}
                onChange={(next) => { setFilters((current) => ({ ...current, courseTitle: next })); list.setPage(1); }}
              />
            </div>
            <ColumnManager
              columns={tableColumns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              storageKey="otto-reports-columns"
            />
          </div>
        )}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {visibleTableColumns.map((column) => <th key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {!list.pageItems.length && (
              <tr><td colSpan={colSpan}>No rows match the current filters.</td></tr>
            )}
            {list.pageItems.map((row) => (
              <tr key={row.id}>
                {visibleTableColumns.map((column) => {
                  if (column.key === "learnerName") {
                    return (
                      <td key={column.key}>
                        <strong>{row.learnerName}</strong><br />
                        <span className="helper">{row.email}</span>
                      </td>
                    );
                  }
                  if (column.key === "status") {
                    return (
                      <td key={column.key}>
                        <span className={`badge ${row.status === "COMPLETED" ? "completed" : row.status === "IN_PROGRESS" ? "progress" : ""}`}>
                          {formatAssignmentStatus(row.status)}
                        </span>
                      </td>
                    );
                  }
                  return <td key={column.key}>{cellValue(row, column.key) || "—"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
