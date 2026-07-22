"use client";

import { FormEvent, useState } from "react";

export default function ActivateForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("The passwords do not match");
      setBusy(false);
      return;
    }
    const response = await fetch("/api/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: form.get("password") })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Activation failed");
      setBusy(false);
      return;
    }
    setMessage("Your account is active. Redirecting to sign in…");
    setTimeout(() => { window.location.href = "/login"; }, 900);
  }

  if (!token) return <div className="alert error">The activation token is missing.</div>;

  return (
    <form onSubmit={submit}>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      <div className="field">
        <label htmlFor="password">New password</label>
        <input className="input" id="password" name="password" type="password" minLength={10} required />
        <div className="helper">At least 10 characters, with uppercase, lowercase, and a number.</div>
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input className="input" id="confirmPassword" name="confirmPassword" type="password" minLength={10} required />
      </div>
      <button className="btn" disabled={busy}>{busy ? "Activating…" : "Activate account"}</button>
    </form>
  );
}
