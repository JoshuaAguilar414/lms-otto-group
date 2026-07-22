"use client";

import { FormEvent, useEffect, useState } from "react";

type StakeholderGroup = "Business Partner" | "Facility";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [stakeholderGroup, setStakeholderGroup] = useState<StakeholderGroup | "">("");
  const [facilityTraining, setFacilityTraining] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (stakeholderGroup !== "Facility" || !companyId.trim()) {
      setFacilities([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/facilities?companyId=${encodeURIComponent(companyId.trim())}`, {
          signal: controller.signal
        });
        const data = await response.json();
        if (response.ok) setFacilities(data.facilities || []);
      } catch {
        // ignore abort/network while typing
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [companyId, stakeholderGroup]);

  function selectStakeholder(group: StakeholderGroup) {
    setStakeholderGroup(group);
    if (group !== "Facility") setFacilityTraining("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stakeholderGroup) {
      setError("Select your stakeholder group.");
      return;
    }
    if (stakeholderGroup === "Facility" && !facilityTraining.trim()) {
      setError("Select your Facility Training name.");
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        companyId,
        stakeholderGroup,
        facilityTraining: stakeholderGroup === "Facility" ? facilityTraining.trim() : ""
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Registration failed");
      setBusy(false);
      return;
    }
    setMessage(data.message || "Registration received. Check your email for an activation link.");
    setDone(true);
    setBusy(false);
  }

  if (done) {
    return (
      <div>
        <div className="alert success">{message}</div>
        <p className="helper" style={{ marginBottom: 14 }}>
          After you set a password from the email link, sign in with your corporate email.
        </p>
        <a className="btn btn-otto" href="/login">Go to sign in</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert error">{error}</div>}

      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          className="input input-otto"
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="name">Full name</label>
        <input
          className="input input-otto"
          id="name"
          type="text"
          placeholder="First and last name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="companyId">Company ID</label>
        <input
          className="input input-otto"
          id="companyId"
          type="text"
          placeholder="From the participant / invitation list"
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          required
        />
        <div className="helper">Registration only succeeds if this ID is on the approved Vectra participant roster.</div>
      </div>

      <div className="field">
        <label>Stakeholder group</label>
        <div className="helper" style={{ marginBottom: 8 }}>Select one</div>
        <div className="reg-choices" role="radiogroup" aria-label="Stakeholder group">
          <button
            type="button"
            className={`reg-choice${stakeholderGroup === "Business Partner" ? " selected" : ""}`}
            onClick={() => selectStakeholder("Business Partner")}
            aria-pressed={stakeholderGroup === "Business Partner"}
          >
            <span className="reg-choice-num">1</span>
            Business Partner
          </button>
          <button
            type="button"
            className={`reg-choice${stakeholderGroup === "Facility" ? " selected" : ""}`}
            onClick={() => selectStakeholder("Facility")}
            aria-pressed={stakeholderGroup === "Facility"}
          >
            <span className="reg-choice-num">2</span>
            Facility
          </button>
        </div>
      </div>

      {stakeholderGroup === "Facility" && (
        <div className="field">
          <label htmlFor="facilityTraining">Facility Training</label>
          {facilities.length ? (
            <select
              className="select input-otto"
              id="facilityTraining"
              value={facilityTraining}
              onChange={(event) => setFacilityTraining(event.target.value)}
              required
            >
              <option value="">Select facility</option>
              {facilities.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          ) : (
            <input
              className="input input-otto"
              id="facilityTraining"
              type="text"
              placeholder={companyId.trim() ? "No facilities found for this Company ID" : "Enter Company ID first"}
              value={facilityTraining}
              onChange={(event) => setFacilityTraining(event.target.value)}
              required
            />
          )}
          <div className="helper">Must match the approved facility name for this Company ID.</div>
        </div>
      )}

      <button className="btn btn-otto" type="submit" disabled={busy}>
        {busy ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
