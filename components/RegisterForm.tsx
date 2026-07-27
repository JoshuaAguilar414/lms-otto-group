"use client";

import { FormEvent, useEffect, useState } from "react";

type StakeholderGroup = "Business Partner" | "Facility";

type OrgMatch = {
  name: string;
  stakeholderGroup: StakeholderGroup;
  companyId: string;
};

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [stakeholderGroup, setStakeholderGroup] = useState<StakeholderGroup | "">("");
  const [organizationalName, setOrganizationalName] = useState("");
  const [matches, setMatches] = useState<OrgMatch[]>([]);
  const [lookupDone, setLookupDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const organizations = [...new Set(matches.map((item) => item.name))];
  const needsOrgChoice = organizations.length > 1;

  useEffect(() => {
    if (!companyId.trim()) {
      setMatches([]);
      setOrganizationalName("");
      setLookupDone(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ companyId: companyId.trim() });
        if (stakeholderGroup) params.set("stakeholderGroup", stakeholderGroup);
        const response = await fetch(`/api/facilities?${params}`, {
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) return;

        const nextMatches: OrgMatch[] = Array.isArray(data.matches) ? data.matches : [];
        setMatches(nextMatches);
        setLookupDone(true);

        const names = [...new Set(nextMatches.map((item) => item.name))];
        if (names.length === 1) {
          setOrganizationalName(names[0]);
          if (!stakeholderGroup && nextMatches[0]?.stakeholderGroup) {
            setStakeholderGroup(nextMatches[0].stakeholderGroup);
          }
        } else if (names.length === 0) {
          setOrganizationalName("");
        } else if (!names.includes(organizationalName)) {
          setOrganizationalName("");
        }
      } catch {
        // ignore abort/network while typing
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // organizationalName intentionally omitted — only react to company/stakeholder changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, stakeholderGroup]);

  function selectStakeholder(group: StakeholderGroup) {
    setStakeholderGroup(group);
  }

  function onCompanyIdChange(value: string) {
    setCompanyId(value);
    if (!value.trim()) {
      setOrganizationalName("");
      setMatches([]);
      setLookupDone(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stakeholderGroup) {
      setError("Select your stakeholder group.");
      return;
    }
    if (!organizationalName.trim()) {
      setError("Enter a valid Company ID so the organizational name can be filled.");
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
        facilityTraining: organizationalName.trim()
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

  const orgPlaceholder = !companyId.trim()
    ? "Filled automatically from Company ID"
    : lookupDone && organizations.length === 0
      ? "No organization found for this Company ID"
      : "Looking up organization…";

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
          onChange={(event) => onCompanyIdChange(event.target.value)}
          required
        />
        <div className="helper">
          Registration only succeeds if this ID is on the approved VECTRA participant roster.
          {organizations.length === 1 && (
            <> Matched organization: <strong>{organizations[0]}</strong>.</>
          )}
          {organizations.length > 1 && (
            <> Multiple organizations found — choose one below.</>
          )}
          {lookupDone && companyId.trim() && organizations.length === 0 && (
            <> No organization found for this Company ID.</>
          )}
        </div>
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

      <div className="field">
        <label htmlFor="organizationalName">Organizational name</label>
        {needsOrgChoice ? (
          <select
            className="select input-otto"
            id="organizationalName"
            value={organizationalName}
            onChange={(event) => setOrganizationalName(event.target.value)}
            required
          >
            <option value="">Select organization</option>
            {organizations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        ) : (
          <input
            className="input input-otto"
            id="organizationalName"
            type="text"
            placeholder={orgPlaceholder}
            value={organizationalName}
            readOnly
            required
          />
        )}
        <div className="helper">
          {needsOrgChoice
            ? "Choose the organization for this Company ID."
            : "Filled automatically when the Company ID matches the roster."}
        </div>
      </div>

      <button className="btn btn-otto" type="submit" disabled={busy}>
        {busy ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
