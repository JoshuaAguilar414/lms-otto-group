"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import ListControls from "@/components/ListControls";
import { useFilteredPagination } from "@/lib/useFilteredPagination";

interface ParticipantView {
  id: string;
  stakeholderGroup: string;
  companyId: string;
  name: string;
  belongsToBp: string;
  country: string;
  topic: string;
  nominatedProvider: string;
}

const emptyForm = {
  stakeholderGroup: "Facility",
  companyId: "",
  name: "",
  belongsToBp: "",
  country: "",
  topic: "Freely Chosen Employment",
  nominatedProvider: "VECTRA"
};

export default function AdminParticipants({
  initialParticipants,
  canManage
}: {
  initialParticipants: ParticipantView[];
  canManage: boolean;
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [stakeholderFilter, setStakeholderFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);

  const countries = useMemo(
    () => [...new Set(participants.map((item) => item.country).filter(Boolean))].sort(),
    [participants]
  );

  const getSearchValues = useCallback(
    (item: ParticipantView) => [
      item.stakeholderGroup,
      item.companyId,
      item.name,
      item.belongsToBp,
      item.country,
      item.topic,
      item.nominatedProvider
    ],
    []
  );

  const filteredBySelects = useMemo(
    () => participants.filter((item) => {
      if (stakeholderFilter !== "ALL" && item.stakeholderGroup !== stakeholderFilter) return false;
      if (countryFilter !== "ALL" && item.country !== countryFilter) return false;
      return true;
    }),
    [participants, stakeholderFilter, countryFilter]
  );

  const list = useFilteredPagination(filteredBySelects, getSearchValues, { initialPageSize: 10 });
  const facilities = participants.filter((item) => item.stakeholderGroup === "Facility").length;
  const partners = participants.filter((item) => item.stakeholderGroup === "Business Partner").length;
  const editing = participants.find((item) => item.id === editingId) || null;

  async function refreshParticipants() {
    const refreshed = await fetch("/api/admin/participants");
    const body = await refreshed.json();
    if (refreshed.ok) setParticipants(body.participants || []);
  }

  function readForm(form: FormData) {
    return {
      stakeholderGroup: String(form.get("stakeholderGroup") || ""),
      companyId: String(form.get("companyId") || "").trim(),
      name: String(form.get("name") || "").trim(),
      belongsToBp: String(form.get("belongsToBp") || "").trim(),
      country: String(form.get("country") || "").trim(),
      topic: String(form.get("topic") || "").trim() || "Freely Chosen Employment",
      nominatedProvider: String(form.get("nominatedProvider") || "").trim() || "VECTRA"
    };
  }

  async function createParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readForm(new FormData(formElement)))
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not create organization");
    setParticipants((current) => [data.participant, ...current]);
    setMessage(data.restored ? "Organization restored and updated." : "Organization added to the roster.");
    formElement.reset();
  }

  async function saveParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/participants/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readForm(new FormData(event.currentTarget)))
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
      setError(data.error || "Participant import failed");
      return;
    }
    setMessage(`Imported ${data.imported} rows (${data.upserted} new, ${data.updated} updated).`);
    await refreshParticipants();
    formElement.reset();
  }

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
            <p className="helper">Add a Facility or Business Partner so learners can register with this Company ID.</p>
            <div className="field">
              <label>Stakeholder group</label>
              <select className="select" name="stakeholderGroup" defaultValue={emptyForm.stakeholderGroup} required>
                <option value="Facility">Facility</option>
                <option value="Business Partner">Business Partner</option>
              </select>
            </div>
            <div className="field"><label>Company ID</label><input className="input" name="companyId" required /></div>
            <div className="field"><label>Organization name</label><input className="input" name="name" required /></div>
            <div className="field"><label>Belongs to BP</label><input className="input" name="belongsToBp" /></div>
            <div className="field"><label>Country</label><input className="input" name="country" /></div>
            <div className="field"><label>Topic</label><input className="input" name="topic" defaultValue={emptyForm.topic} /></div>
            <div className="field"><label>Nominated provider</label><input className="input" name="nominatedProvider" defaultValue={emptyForm.nominatedProvider} /></div>
            <button className="btn">Add to roster</button>
          </form>
          <form className="card" onSubmit={importCsv}>
            <h2>Import roster CSV</h2>
            <p className="helper">
              Bulk import from the VECTRA participant list. Headers: Stakeholder, ID, Name, Belongs to BP, Country, Topic, Nominated Provider.
            </p>
            <div className="field">
              <label>CSV file</label>
              <input className="input" name="file" type="file" accept=".csv,text/csv" required />
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
            <div className="field">
              <label>Stakeholder group</label>
              <select className="select" name="stakeholderGroup" defaultValue={editing.stakeholderGroup} required>
                <option value="Facility">Facility</option>
                <option value="Business Partner">Business Partner</option>
              </select>
            </div>
            <div className="field"><label>Company ID</label><input className="input" name="companyId" defaultValue={editing.companyId} required /></div>
            <div className="field"><label>Organization name</label><input className="input" name="name" defaultValue={editing.name} required /></div>
            <div className="field"><label>Belongs to BP</label><input className="input" name="belongsToBp" defaultValue={editing.belongsToBp} /></div>
            <div className="field"><label>Country</label><input className="input" name="country" defaultValue={editing.country} /></div>
            <div className="field"><label>Topic</label><input className="input" name="topic" defaultValue={editing.topic} /></div>
            <div className="field"><label>Nominated provider</label><input className="input" name="nominatedProvider" defaultValue={editing.nominatedProvider} /></div>
          </div>
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
          <div className="list-controls-row">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Stakeholder</label>
              <select className="select" value={stakeholderFilter} onChange={(event) => { setStakeholderFilter(event.target.value); list.setPage(1); }}>
                <option value="ALL">All</option>
                <option value="Facility">Facility</option>
                <option value="Business Partner">Business Partner</option>
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
              <th>Stakeholder</th>
              <th>Company ID</th>
              <th>Name</th>
              <th>Belongs to BP</th>
              <th>Country</th>
              <th>Topic</th>
              <th>Provider</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {!list.pageItems.length && (
              <tr><td colSpan={canManage ? 8 : 7}>No organizations match the current filters.</td></tr>
            )}
            {list.pageItems.map((item) => (
              <tr key={item.id}>
                <td><span className="badge">{item.stakeholderGroup}</span></td>
                <td>{item.companyId}</td>
                <td>{item.name}</td>
                <td>{item.belongsToBp || "—"}</td>
                <td>{item.country || "—"}</td>
                <td>{item.topic || "—"}</td>
                <td>{item.nominatedProvider || "—"}</td>
                {canManage && (
                  <td>
                    <div className="actions">
                      <button className="btn secondary small" type="button" onClick={() => setEditingId(item.id)}>Edit</button>
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
