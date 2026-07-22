"use client";

import type { ReactNode } from "react";

export default function ListControls(props: {
  query: string;
  onQueryChange: (value: string) => void;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
}) {
  return (
    <div className="list-controls card">
      <div className="list-controls-row">
        <div className="field" style={{ marginBottom: 0, flex: 1 }}>
          <label htmlFor="list-search">Search</label>
          <input
            id="list-search"
            className="input"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={props.searchPlaceholder || "Search…"}
          />
        </div>
        <div className="field" style={{ marginBottom: 0, width: 120 }}>
          <label htmlFor="page-size">Page size</label>
          <select
            id="page-size"
            className="select"
            value={props.pageSize}
            onChange={(event) => props.onPageSizeChange(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      {props.filters && <div className="list-controls-filters">{props.filters}</div>}
      <div className="list-controls-footer">
        <span className="helper">
          Showing page {props.page} of {props.totalPages} · {props.total} result{props.total === 1 ? "" : "s"}
        </span>
        <div className="actions">
          <button
            type="button"
            className="btn secondary small"
            disabled={props.page <= 1}
            onClick={() => props.onPageChange(props.page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn secondary small"
            disabled={props.page >= props.totalPages}
            onClick={() => props.onPageChange(props.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
