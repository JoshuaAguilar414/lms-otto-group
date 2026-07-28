"use client";

import { FormEvent, useState } from "react";

interface ProfileView {
  firstName: string;
  lastName: string;
  email: string;
  entity: string;
  companyId?: string;
  stakeholderGroup?: string;
  role: string;
}

export default function ProfileForm({ initialProfile }: { initialProfile: ProfileView }) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: String(form.get("name") || "").trim() })
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Could not update profile");
      return;
    }

    setProfile(data.profile);
    setMessage("Your name has been updated.");
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="grid">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <div className="grid two">
        <form className="card" onSubmit={saveProfile}>
          <h2>Your name</h2>
          <p className="helper">
            Update how your name appears in the LMS and on course certificates. You do not need to register again.
          </p>
          <div className="field">
            <label>Full name</label>
            <input className="input" name="name" defaultValue={fullName} required />
          </div>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="card">
          <h2>Account details</h2>
          <p className="muted">Email: {profile.email}</p>
          <p className="muted">Organization: {profile.entity}</p>
          {profile.companyId && <p className="muted">Company ID: {profile.companyId}</p>}
          {profile.stakeholderGroup && <p className="muted">Stakeholder group: {profile.stakeholderGroup}</p>}
          <p className="helper" style={{ marginTop: 16 }}>
            To change your email or organization, contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
