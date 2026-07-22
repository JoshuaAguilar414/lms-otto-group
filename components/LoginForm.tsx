"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to sign in");
      setBusy(false);
      return;
    }
    window.location.href = data.redirectTo || "/";
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert error">{error}</div>}
      <div className="field">
        <label htmlFor="email">Corporate email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn btn-otto" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="helper" style={{ marginTop: 14 }}>
        <a href="/forgot-password">Forgot password?</a>
      </p>
    </form>
  );
}
