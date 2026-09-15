"use client";

import { FormEvent, useMemo, useState } from "react";
import AdminRoles from "@/components/AdminRoles";
import { canToggleRequired, type FieldDefinitionView } from "@/lib/fields";
import type { RoleView } from "@/lib/role-catalog";

export default function AdminSettings({
  initialFields,
  initialRoles,
  canManageRoles
}: {
  initialFields: FieldDefinitionView[];
  initialRoles: RoleView[];
  canManageRoles: boolean;
}) {
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"text" | "dropdown">("dropdown");
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [editingOptionsId, setEditingOptionsId] = useState<string | null>(null);

  const sorted = useMemo(() => [...fields].sort((a, b) => a.order - b.order), [fields]);

  async function createField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const options = optionsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const response = await fetch("/api/admin/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, type, required, options })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not create field");
    setFields((current) => [...current, data.field].sort((a, b) => a.order - b.order));
    setMessage(`Added “${data.field.label}”. It is now available on the roster, users, and reports.`);
    setLabel("");
    setOptionsText("");
    setRequired(false);
    setType("dropdown");
  }

  async function patchField(id: string, payload: Record<string, unknown>) {
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/fields", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not update field");
    if (Array.isArray(data.fields)) setFields(data.fields);
    setMessage("Field settings saved.");
  }

  async function removeField(field: FieldDefinitionView) {
    if (field.system) return;
    if (!window.confirm(`Delete custom field “${field.label}”? Values stored for this field will be removed.`)) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/fields?id=${encodeURIComponent(field.id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not delete field");
    setFields(data.fields || []);
    setMessage(`Deleted “${field.label}”.`);
  }

  async function moveField(field: FieldDefinitionView, direction: -1 | 1) {
    const index = sorted.findIndex((item) => item.id === field.id);
    const swap = sorted[index + direction];
    if (!swap) return;
    await patchField(field.id, {
      reorder: [
        { id: field.id, order: swap.order },
        { id: swap.id, order: field.order }
      ]
    });
  }

  return (
    <div className="grid">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form className="card" onSubmit={createField}>
        <h2>Add custom field</h2>
        <p className="helper">
          New fields appear on Add organization, roster import validation, learner records, filters, and CSV exports.
          Prefer dropdowns so values stay consistent.
        </p>
        <div className="field">
          <label htmlFor="new-field-label">Field label</label>
          <input id="new-field-label" className="input" value={label} onChange={(event) => setLabel(event.target.value)} required />
        </div>
        <div className="grid two">
          <div className="field">
            <label htmlFor="new-field-type">Type</label>
            <select id="new-field-type" className="select" value={type} onChange={(event) => setType(event.target.value as "text" | "dropdown")}>
              <option value="dropdown">Dropdown</option>
              <option value="text">Text</option>
            </select>
          </div>
          <label className="checkbox-filter-item" style={{ alignSelf: "end", marginBottom: 14 }}>
            <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
            <span>Required</span>
          </label>
        </div>
        {type === "dropdown" && (
          <div className="field">
            <label htmlFor="new-field-options">Dropdown options (one per line)</label>
            <textarea id="new-field-options" className="textarea" value={optionsText} onChange={(event) => setOptionsText(event.target.value)} />
          </div>
        )}
        <button className="btn">Add field</button>
      </form>

      <div className="card">
        <h2>Roster and user fields</h2>
        <p className="helper">
          System fields cannot be deleted. Identity fields (stakeholder, Company ID, organization name) stay required.
          Tick Required to block saving or importing a row when that value is missing.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Required</th>
                <th>Dropdown options</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((field, index) => (
                <tr key={field.id}>
                  <td>
                    <strong>{field.label}</strong>
                    <div className="helper">{field.system ? "System field" : field.key}</div>
                  </td>
                  <td>{field.type === "dropdown" ? "Dropdown" : "Text"}</td>
                  <td>
                    <label className="checkbox-filter-item">
                      <input
                        type="checkbox"
                        checked={field.required}
                        disabled={!canToggleRequired(field)}
                        onChange={(event) => void patchField(field.id, { required: event.target.checked })}
                      />
                      <span>Required</span>
                    </label>
                  </td>
                  <td>
                    {field.type !== "dropdown" ? (
                      "—"
                    ) : field.lockedOptions ? (
                      field.options.join(", ")
                    ) : editingOptionsId === field.id ? (
                      <OptionsEditor
                        key={field.id}
                        initial={field.options.join("\n")}
                        onSave={(options) => {
                          void patchField(field.id, { options });
                          setEditingOptionsId(null);
                        }}
                        onCancel={() => setEditingOptionsId(null)}
                      />
                    ) : (
                      <div>
                        <div className="helper">{field.options.length ? field.options.join(", ") : "No options yet"}</div>
                        <button className="btn secondary small" type="button" onClick={() => setEditingOptionsId(field.id)}>
                          Edit options
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn secondary small" type="button" disabled={index === 0} onClick={() => void moveField(field, -1)}>
                        Up
                      </button>
                      <button className="btn secondary small" type="button" disabled={index === sorted.length - 1} onClick={() => void moveField(field, 1)}>
                        Down
                      </button>
                      {!field.system && (
                        <button className="btn danger small" type="button" onClick={() => void removeField(field)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canManageRoles && <AdminRoles initialRoles={initialRoles} />}
    </div>
  );
}

function OptionsEditor({
  initial,
  onSave,
  onCancel
}: {
  initial: string;
  onSave: (options: string[]) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <div className="grid">
      <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} />
      <div className="actions">
        <button
          className="btn small"
          type="button"
          onClick={() => onSave(text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))}
        >
          Save options
        </button>
        <button className="btn secondary small" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
