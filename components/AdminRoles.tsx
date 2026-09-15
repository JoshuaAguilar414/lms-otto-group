"use client";

import { FormEvent, useMemo, useState } from "react";
import { STAFF_PAGES, type RoleView } from "@/lib/role-catalog";
import type { StaffPage } from "@/lib/types";

export default function AdminRoles({ initialRoles }: { initialRoles: RoleView[] }) {
  const [roles, setRoles] = useState(initialRoles);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState<StaffPage[]>(["overview", "reports"]);
  const [canManageRoster, setCanManageRoster] = useState(false);
  const [canCreateStaff, setCanCreateStaff] = useState(false);
  const [canRemoveUsers, setCanRemoveUsers] = useState(false);

  const sorted = useMemo(
    () => [...roles].sort((a, b) => Number(b.system) - Number(a.system) || a.name.localeCompare(b.name)),
    [roles]
  );

  function togglePage(page: StaffPage, current: StaffPage[], setter: (next: StaffPage[]) => void) {
    setter(current.includes(page) ? current.filter((item) => item !== page) : [...current, page]);
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, pages, canManageRoster, canCreateStaff, canRemoveUsers })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not create user group");
    setRoles((current) => [...current, data.role]);
    setMessage(`Added user group “${data.role.name}”. Assign it when inviting staff.`);
    setName("");
    setDescription("");
    setPages(["overview", "reports"]);
    setCanManageRoster(false);
    setCanCreateStaff(false);
    setCanRemoveUsers(false);
  }

  async function patchRole(key: string, payload: Record<string, unknown>) {
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...payload })
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not update user group");
    setRoles((current) => current.map((role) => (role.key === key ? data.role : role)));
    setMessage("User group saved.");
  }

  async function removeRole(role: RoleView) {
    if (role.system) return;
    if (!window.confirm(`Delete user group “${role.name}”? Users already assigned this role must be changed first.`)) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/roles?key=${encodeURIComponent(role.key)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not delete user group");
    setRoles((current) => current.filter((item) => item.key !== role.key));
    setMessage(`Deleted “${role.name}”.`);
  }

  return (
    <div className="grid">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <form className="card" onSubmit={createRole}>
        <h2>Add user group</h2>
        <p className="helper">
          Create a role such as Facilitator or Partner. Tick the pages that group can open. Admin remains full control.
        </p>
        <div className="field">
          <label htmlFor="role-name">Group name</label>
          <input id="role-name" className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="role-description">Description</label>
          <input id="role-description" className="input" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <fieldset className="field">
          <legend>Pages</legend>
          <div className="role-page-grid">
            {STAFF_PAGES.map((page) => (
              <label key={page.key} className="checkbox-filter-item">
                <input
                  type="checkbox"
                  checked={pages.includes(page.key)}
                  onChange={() => togglePage(page.key, pages, setPages)}
                />
                <span>{page.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="role-page-grid">
          <label className="checkbox-filter-item">
            <input type="checkbox" checked={canManageRoster} onChange={(event) => setCanManageRoster(event.target.checked)} />
            <span>Edit participant roster</span>
          </label>
          <label className="checkbox-filter-item">
            <input type="checkbox" checked={canCreateStaff} onChange={(event) => setCanCreateStaff(event.target.checked)} />
            <span>Create staff accounts</span>
          </label>
          <label className="checkbox-filter-item">
            <input type="checkbox" checked={canRemoveUsers} onChange={(event) => setCanRemoveUsers(event.target.checked)} />
            <span>Remove users</span>
          </label>
        </div>
        <button className="btn" type="submit">Add user group</button>
      </form>

      <div className="card">
        <h2>User groups</h2>
        <p className="helper">
          System groups cannot be deleted. Admin and Learner pages stay locked. Coordinator and custom groups can change page access.
        </p>
        <div className="grid">
          {sorted.map((role) => (
            <RoleEditor
              key={role.key}
              role={role}
              onSave={(payload) => void patchRole(role.key, payload)}
              onDelete={() => void removeRole(role)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleEditor({
  role,
  onSave,
  onDelete
}: {
  role: RoleView;
  onSave: (payload: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const locked = role.key === "ADMIN" || role.key === "LEARNER";
  const [pages, setPages] = useState<StaffPage[]>(role.pages);
  const [canManageRoster, setCanManageRoster] = useState(role.canManageRoster);
  const [canCreateStaff, setCanCreateStaff] = useState(role.canCreateStaff);
  const [canRemoveUsers, setCanRemoveUsers] = useState(role.canRemoveUsers);

  return (
    <div className="role-card">
      <div>
        <strong>{role.name}</strong>
        <div className="helper">{role.system ? `${role.key} · system` : role.key}</div>
        {role.description && <p className="muted" style={{ marginBottom: 0 }}>{role.description}</p>}
      </div>
      <div className="role-page-grid">
        {STAFF_PAGES.map((page) => (
          <label key={page.key} className="checkbox-filter-item">
            <input
              type="checkbox"
              checked={locked ? role.pages.includes(page.key) : pages.includes(page.key)}
              disabled={locked}
              onChange={() => {
                setPages((current) => (
                  current.includes(page.key) ? current.filter((item) => item !== page.key) : [...current, page.key]
                ));
              }}
            />
            <span>{page.label}</span>
          </label>
        ))}
      </div>
      {!locked && (
        <div className="role-page-grid">
          <label className="checkbox-filter-item">
            <input type="checkbox" checked={canManageRoster} onChange={(event) => setCanManageRoster(event.target.checked)} />
            <span>Edit roster</span>
          </label>
          <label className="checkbox-filter-item">
            <input type="checkbox" checked={canCreateStaff} onChange={(event) => setCanCreateStaff(event.target.checked)} />
            <span>Create staff</span>
          </label>
          <label className="checkbox-filter-item">
            <input type="checkbox" checked={canRemoveUsers} onChange={(event) => setCanRemoveUsers(event.target.checked)} />
            <span>Remove users</span>
          </label>
        </div>
      )}
      <div className="actions">
        {!locked && (
          <button
            className="btn small"
            type="button"
            onClick={() => onSave({ pages, canManageRoster, canCreateStaff, canRemoveUsers })}
          >
            Save access
          </button>
        )}
        {!role.system && (
          <button className="btn danger small" type="button" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
