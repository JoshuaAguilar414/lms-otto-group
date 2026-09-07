"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckboxFilter, ColumnManager, FieldControl, matchesSelected, uniqueSorted } from "@/components/DataTableControls";
import ListControls from "@/components/ListControls";
import { defaultFieldValues, getRecordValue, type FieldDefinitionView, type ParticipantView } from "@/lib/fields";
import { SPREADSHEET_ACCEPT } from "@/lib/spreadsheet";
import { useFilteredPagination } from "@/lib/useFilteredPagination";

export default function AdminParticipants({
  initialParticipants,
  fields,
  canManage
}: {
  initialParticipants: ParticipantView[];
  fields: FieldDefinitionView[];
  canManage: boolean;
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [formValues, setFormValues] = useState<Record<string, string>>(() => defaultFieldValues(fields));
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const tableColumns = useMemo(
    () => fields.map((field) => ({ key: field.key, label: field.label })),
    [fields]
  );
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => tableColumns.map((column) => column.key));

  const filterableFields = fields.filter((field) => field.filterable);
  const editing = participants.find((item) => item.id === editingId) || null;

  const extraOptionsByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const field of fields) {
      map[field.key] = uniqueSorted(participants.map((item) => getRecordValue(item, field)));
    }
    return map;
  }, [fields, participants]);

  const getSearchValues = useCallback(
    (item: ParticipantView) => fields.map((field) => getRecordValue(item, field)),
    [fields]
  );

  const filteredBySelects = useMemo(
    () => participants.filter((item) =>
      filterableFields.every((field) => matchesSelected(getRecordValue(item, field), filters[field.key] || []))
    ),
    [participants, filterableFields, filters]
  );

  const list = useFilteredPagination(filteredBySelects, getSearchValues, { initialPageSize: 10 });
  const facilities = participants.filter((item) => item.stakeholderGroup === "Facility").length;
  const partners = participants.filter((item) => item.stakeholderGroup === "Business Partner").length;
  const pageIds = list.pageItems.map((item) => item.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const visibleFieldColumns = tableColumns.filter((column) => visibleColumns.includes(column.key));
  const requiredHeaders = fields.filter((field) => field.required).map((field) => field.label);

  function startEdit(item: ParticipantView) {
    setEditingId(item.id);
    setEditValues(Object.fromEntries(fields.map((field) => [field.key, getRecordValue(item, field)])));
  }

  function setFieldValue(key: string, value: string) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPage() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function bulkRemoveSelected() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const confirmed = window.confirm(`Remove ${ids.length} selected organization(s) from the approved roster?`);
    if (!confirmed) return;
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/participants/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Bulk remove failed");
    const removed = new Set<string>(data.removedIds || []);
    setParticipants((items) => items.filter((item) => !removed.has(item.id)));
    setSelectedIds((current) => {
      const next = new Set(current);
      removed.forEach((id) => next.delete(id));
      return next;
    });
    if (editingId && removed.has(editingId)) setEditingId(null);
    setMessage(
      `Removed ${data.removed} organization(s)` +
      (data.skipped ? `; ${data.skipped} could not be removed.` : ".") +
      (data.errors?.length ? ` First issues: ${data.errors.slice(0, 3).join(" | ")}` : "")
    );
  }

  async function refreshParticipants() {
    const refreshed = await fetch("/api/admin/participants");
    const body = await refreshed.json();
    if (refreshed.ok) setParticipants(body.participants || []);
  }

  async function createParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not create organization");
    setParticipants((current) => [data.participant, ...current]);
    setMessage(data.restored ? "Organization restored and updated." : "Organization added to the roster.");
    setFormValues(defaultFieldValues(fields));
  }

  async function saveParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/participants/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues)
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not update organization");
    setParticipants((current) => current.map((item) => (item.id === editing.id ? data.participant : item)));
    setMessage("Organization updated.");
    setEditingId(null);
  }

  async function removeParticipant(item: ParticipantView) {
    if (!window.confirm(`Remove “${item.name}” (${item.companyId}) from the approved roster?`)) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/participants/${item.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not remove organization");
    setParticipants((current) => current.filter((row) => row.id !== item.id));
    if (editingId === item.id) setEditingId(null);
    setMessage("Organization removed from the roster.");
  }

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setMessage("");
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/participants/import", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) {
      const extra = Array.isArray(data.errors) && data.errors.length ? ` ${data.errors.slice(0, 3).join(" | ")}` : "";
      setError((data.error || "Participant import failed") + extra);
      return;
    }
    setMessage(
      `Imported ${data.imported} rows (${data.upserted} new, ${data.updated} updated).` +
      (data.skipped ? ` ${data.skipped} row(s) skipped.` : "") +
      (data.errors?.length ? ` First issues: ${data.errors.slice(0, 3).join(" | ")}` : "")
    );
    await refreshParticipants();
    formElement.reset();
  }

  const colSpan = (canManage ? 2 : 1) + visibleFieldColumns.length;

  return (
    <div className="grid">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="grid three">
        <div className="card"><div className="muted">Approved organizations</div><div className="stat">{participants.length}</div></div>
        <div className="card"><div className="muted">Facilities</div><div className="stat">{facilities}</div></div>
        <div className="card"><div className="muted">Business Partners</div><div className="stat">{partners}</div></div>
      </div>

      {canManage ? (
        <div className="grid two">
          <form className="card" onSubmit={createParticipant}>
            <h2>Add organization</h2>
            <p className="helper">
              Fields and required rules are managed in Settings. Dropdowns keep roster values consistent for filters and reports.
            </p>
            {fields.map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                value={formValues[field.key] || ""}
                extraOptions={extraOptionsByKey[field.key]}
                onChange={(value) => setFieldValue(field.key, value)}
                idPrefix="add-field"
              />
            ))}
            <button className="btn">Add to roster</button>
          </form>
          <form className="card" onSubmit={importCsv}>
            <h2>Import roster</h2>
            <p className="helper">
              Bulk import from CSV or XLSX. Required headers: {requiredHeaders.join(", ") || "none"}.
              Empty required cells are rejected. New dropdown values are imported and added to Settings.
            </p>
            <div className="field">
              <label>CSV or XLSX file</label>
              <input className="input" name="file" type="file" accept={SPREADSHEET_ACCEPT} required />
            </div>
            <button className="btn">Import roster</button>
          </form>
        </div>
      ) : (
        <div className="alert info">
          Coordinators can view the approved roster. Only administrators can add, update, remove, or import organizations.
        </div>
      )}

      {canManage && editing && (
        <form className="card" onSubmit={saveParticipant} key={editing.id}>
          <h2>Edit organization</h2>
          <div className="grid two">
            {fields.map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                value={editValues[field.key] || ""}
                extraOptions={extraOptionsByKey[field.key]}
                onChange={(value) => setEditValues((current) => ({ ...current, [field.key]: value }))}
                idPrefix="edit-field"
              />
            ))}
          </div>
          <p className="helper">Edit the values above, then save. Required fields must be filled.</p>
          <div className="actions">
            <button className="btn" type="submit">Save changes</button>
            <button className="btn secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </form>
      )}

      <ListControls
        query={list.query}
        onQueryChange={list.setQuery}
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
        searchPlaceholder="Search company ID, name, country…"
        filters={(
          <div className="filter-toolbar">
            <div className="checkbox-filter-bar">
              {filterableFields.map((field) => (
                <CheckboxFilter
                  key={field.key}
                  label={field.label}
                  options={uniqueSorted([...(field.options || []), ...extraOptionsByKey[field.key]])}
                  selected={filters[field.key] || []}
                  onChange={(next) => {
                    setFilters((current) => ({ ...current, [field.key]: next }));
                    list.setPage(1);
                  }}
                />
              ))}
            </div>
            <ColumnManager
              columns={tableColumns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              storageKey="otto-participants-columns"
            />
          </div>
        )}
      />

      {canManage && selectedIds.size > 0 && (
        <div className="card bulk-actions">
          <span className="helper">{selectedIds.size} selected</span>
          <div className="actions">
            <button className="btn danger small" type="button" onClick={() => void bulkRemoveSelected()}>
              Remove selected
            </button>
            <button className="btn secondary small" type="button" onClick={() => setSelectedIds(new Set())}>
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {canManage && (
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                  />
                </th>
              )}
              {visibleFieldColumns.map((column) => <th key={column.key}>{column.label}</th>)}
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {!list.pageItems.length && (
              <tr><td colSpan={colSpan}>No organizations match the current filters.</td></tr>
            )}
            {list.pageItems.map((item) => (
              <tr key={item.id}>
                {canManage && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                    />
                  </td>
                )}
                {visibleFieldColumns.map((column) => {
                  const value = getRecordValue(item, { key: column.key });
                  return (
                    <td key={column.key}>
                      {column.key === "stakeholderGroup" ? <span className="badge">{value}</span> : (value || "—")}
                    </td>
                  );
                })}
                {canManage && (
                  <td>
                    <div className="actions">
                      <button className="btn secondary small" type="button" onClick={() => startEdit(item)}>Edit</button>
                      <button className="btn danger small" type="button" onClick={() => void removeParticipant(item)}>Remove</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
