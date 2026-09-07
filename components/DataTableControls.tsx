"use client";

import { useEffect, useMemo, useState } from "react";

export function CheckboxFilter({
  label,
  options,
  selected,
  onChange,
  optionLabels
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  optionLabels?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  if (!options.length) return null;

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter((item) => item !== value));
    else onChange([...selected, value]);
  }

  return (
    <div className="checkbox-filter">
      <button
        type="button"
        className={`checkbox-filter-toggle${selected.length ? " active" : ""}`}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        {selected.length ? ` (${selected.length})` : ""}
      </button>
      {open && (
        <div className="checkbox-filter-panel">
          <div className="checkbox-filter-actions">
            <button type="button" className="linkish" onClick={() => onChange(options)}>
              Select all
            </button>
            <button type="button" className="linkish" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <div className="checkbox-filter-options">
            {options.map((option) => (
              <label key={option} className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span>{optionLabels?.[option] || option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function matchesSelected(value: string, selected: string[]): boolean {
  if (!selected.length) return true;
  return selected.includes(value);
}

export function uniqueSorted(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.map((value) => (value || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function ColumnManager({
  columns,
  visible,
  onChange,
  storageKey
}: {
  columns: Array<{ key: string; label: string }>;
  visible: string[];
  onChange: (keys: string[]) => void;
  storageKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const visibleSet = useMemo(() => new Set(visible), [visible]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const currentKeys = columns.map((column) => column.key);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      window.localStorage.setItem(storageKey, JSON.stringify({ visible, known: currentKeys }));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as string[] | { visible?: string[]; known?: string[] };
      const allowed = new Set(currentKeys);
      const storedVisible = Array.isArray(parsed) ? parsed : parsed.visible || [];
      const storedKnown = Array.isArray(parsed) ? currentKeys : parsed.known || currentKeys;
      const known = new Set(storedKnown);
      const nextVisible = [
        ...storedVisible.filter((key) => allowed.has(key)),
        ...currentKeys.filter((key) => !known.has(key))
      ];
      const uniqueVisible = [...new Set(nextVisible.length ? nextVisible : currentKeys)];
      onChange(uniqueVisible);
      window.localStorage.setItem(storageKey, JSON.stringify({ visible: uniqueVisible, known: currentKeys }));
    } catch {
      // ignore stored column preferences that cannot be parsed
    }
    // Intentionally run once when the manager mounts for a given table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle(key: string) {
    const next = visibleSet.has(key) ? visible.filter((item) => item !== key) : [...visible, key];
    const ordered = columns.map((column) => column.key).filter((item) => next.includes(item));
    onChange(ordered.length ? ordered : visible);
    if (storageKey) {
      const known = columns.map((column) => column.key);
      window.localStorage.setItem(storageKey, JSON.stringify({ visible: ordered.length ? ordered : visible, known }));
    }
  }

  return (
    <div className="column-manager">
      <button type="button" className="btn secondary small" onClick={() => setOpen((current) => !current)}>
        Manage columns
      </button>
      {open && (
        <div className="column-manager-panel">
          {columns.map((column) => (
            <label key={column.key} className="checkbox-filter-item">
              <input
                type="checkbox"
                checked={visibleSet.has(column.key)}
                onChange={() => toggle(column.key)}
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function FieldControl({
  field,
  value,
  extraOptions,
  onChange,
  idPrefix = "field"
}: {
  field: {
    key: string;
    label: string;
    type: "text" | "dropdown";
    required: boolean;
    options: string[];
  };
  value: string;
  extraOptions?: string[];
  onChange: (value: string) => void;
  idPrefix?: string;
}) {
  const options = [...new Set([...field.options, ...(extraOptions || []).filter(Boolean)])];
  const fieldId = `${idPrefix}-${field.key}`;
  return (
    <div className="field">
      <label htmlFor={fieldId}>
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {field.type === "dropdown" ? (
        <select
          id={fieldId}
          className="select"
          name={field.key}
          value={value}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
        >
          {!field.required && <option value="">Select one</option>}
          {field.required && !value && <option value="">Select one</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          className="input"
          name={field.key}
          value={value}
          required={field.required}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.type === "dropdown" && !options.length && (
        <p className="helper">No options yet. Add them in Settings before using this field.</p>
      )}
    </div>
  );
}
