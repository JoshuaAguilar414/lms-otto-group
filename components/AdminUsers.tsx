"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import ListControls from "@/components/ListControls";
import { useFilteredPagination } from "@/lib/useFilteredPagination";

interface UserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  entity: string;
  companyId?: string;
  stakeholderGroup?: string;
  role: string;
  status: string;
  createdAt: string;
}

type StakeholderGroup = "Business Partner" | "Facility";

export default function AdminUsers({
  initialUsers,
  permissions
}: {
  initialUsers: UserView[];
  permissions: {
    canCreateStaff: boolean;
    canRemoveUsers: boolean;
  };
}) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("LEARNER");
  const [stakeholderGroup, setStakeholderGroup] = useState<StakeholderGroup | "">("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const getSearchValues = useCallback(
    (item: UserView) => [
      item.firstName,
      item.lastName,
      item.email,
      item.entity,
      item.companyId,
      item.stakeholderGroup,
      item.role,
      item.status
    ],
    []
  );

  const filteredBySelects = useMemo(
    () => users.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (roleFilter !== "ALL" && item.role !== roleFilter) return false;
      return true;
    }),
    [users, statusFilter, roleFilter]
  );

  const list = useFilteredPagination(filteredBySelects, getSearchValues, { initialPageSize: 10 });

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setMessage("");
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "User creation failed");
    setUsers((current) => [data.user, ...current]);
    setMessage(data.message || "User created. An activation link has been sent to their email.");
    formElement.reset();
    setRole("LEARNER");
    setStakeholderGroup("");
  }

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setMessage("");
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/users/import", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "CSV import failed");
    setMessage(
      `Imported ${data.created} users; ${data.skipped} rows were skipped.` +
      (data.errors?.length ? ` First issues: ${data.errors.slice(0, 3).join(" | ")}` : "")
    );
    const refreshed = await fetch("/api/admin/users");
    const body = await refreshed.json();
    if (refreshed.ok && Array.isArray(body.users)) setUsers(body.users);
    formElement.reset();
  }

  async function resendInvite(user: UserView) {
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}/resend`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to resend activation email");
    setMessage(data.message || `Activation email resent to ${user.email}.`);
  }

  async function setStatus(user: UserView, nextStatus: "ACTIVE" | "INACTIVE") {
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update user status");
      return;
    }
    setUsers((items) => items.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item)));
    setMessage(`${user.firstName} ${user.lastName} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`);
  }

  async function removeUser(user: UserView) {
    const confirmed = window.confirm(
      `Remove ${user.firstName} ${user.lastName} (${user.email})? This permanently deletes the user and their course assignments.`
    );
    if (!confirmed) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to remove user");
      return;
    }
    setUsers((items) => items.filter((item) => item.id !== user.id));
    setMessage(`${user.firstName} ${user.lastName} was removed.`);
  }

  return (
    <div className="grid">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="grid two">
        <form className="card" onSubmit={createUser}>
          <h2>Create and invite user</h2>
          <p className="helper">Learners use the same fields as self-registration and must match the participant roster.</p>
          <div className="field">
            <label>Role</label>
            <select className="select" name="role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="LEARNER">LEARNER</option>
              {permissions.canCreateStaff && (
                <>
                  <option value="COORDINATOR">COORDINATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </>
              )}
            </select>
          </div>
          <div className="field">
            <label>Corporate email</label>
            <input className="input" name="email" type="email" required />
          </div>

          {role === "LEARNER" ? (
            <>
              <div className="field">
                <label>Full name</label>
                <input className="input" name="name" required />
              </div>
              <div className="field">
                <label>Company ID</label>
                <input className="input" name="companyId" required />
              </div>
              <div className="field">
                <label>Stakeholder group</label>
                <select
                  className="select"
                  name="stakeholderGroup"
                  value={stakeholderGroup}
                  onChange={(event) => setStakeholderGroup(event.target.value as StakeholderGroup | "")}
                  required
                >
                  <option value="">Select one</option>
                  <option value="Business Partner">Business Partner</option>
                  <option value="Facility">Facility</option>
                </select>
              </div>
              {stakeholderGroup && (
                <div className="field">
                  <label>Organizational name</label>
                  <input className="input" name="facilityTraining" required />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid two">
                <div className="field"><label>First name</label><input className="input" name="firstName" required /></div>
                <div className="field"><label>Last name</label><input className="input" name="lastName" required /></div>
              </div>
              <div className="field"><label>Entity or company</label><input className="input" name="entity" required /></div>
            </>
          )}
          <button className="btn">Create and send activation email</button>
        </form>

        <form className="card" onSubmit={importCsv}>
          <h2>Import learner CSV</h2>
          <p className="muted">
            Required headers: First Name, Last Name, Corporate Email, Company ID, Stakeholder Group, Organizational Name.
            Company ID and Stakeholder Group must match the participant roster.
          </p>
          <div className="field"><label>CSV file</label><input className="input" name="file" type="file" accept=".csv,text/csv" required /></div>
          <button className="btn">Import users</button>
        </form>
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
        searchPlaceholder="Search name, email, company ID…"
        filters={(
          <div className="list-controls-row">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Status</label>
              <select className="select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); list.setPage(1); }}>
                <option value="ALL">All</option>
                <option value="INVITED">Invited</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Role</label>
              <select className="select" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); list.setPage(1); }}>
                <option value="ALL">All</option>
                <option value="LEARNER">Learner</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        )}
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Entity</th>
              <th>Company ID</th>
              <th>Stakeholder</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!list.pageItems.length && <tr><td colSpan={8}>No users match the current filters.</td></tr>}
            {list.pageItems.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.firstName} {item.lastName}</strong></td>
                <td>{item.email}</td>
                <td>{item.entity}</td>
                <td>{item.companyId || "—"}</td>
                <td>{item.stakeholderGroup || "—"}</td>
                <td>{item.role}</td>
                <td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>
                  <div className="actions">
                    {item.status === "INVITED" && (permissions.canCreateStaff || item.role === "LEARNER") && (
                      <>
                        <button className="btn small" type="button" onClick={() => void resendInvite(item)}>
                          Resend invite
                        </button>
                        <button className="btn secondary small" type="button" onClick={() => void setStatus(item, "INACTIVE")}>
                          Deactivate
                        </button>
                      </>
                    )}
                    {item.status === "INACTIVE" && (permissions.canCreateStaff || item.role === "LEARNER") && (
                      <button className="btn small" type="button" onClick={() => void setStatus(item, "ACTIVE")}>
                        Activate
                      </button>
                    )}
                    {item.status === "ACTIVE" && (permissions.canCreateStaff || item.role === "LEARNER") && (
                      <button className="btn secondary small" type="button" onClick={() => void setStatus(item, "INACTIVE")}>
                        Deactivate
                      </button>
                    )}
                    {permissions.canRemoveUsers && (
                      <button className="btn danger small" type="button" onClick={() => void removeUser(item)}>
                        Remove
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
  );
}
