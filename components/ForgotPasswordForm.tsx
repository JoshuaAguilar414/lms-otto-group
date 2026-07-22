"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to send reset email");
      setBusy(false);
      return;
    }
    setMessage(data.message || "Check your email for a reset link.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      <div className="field">
        <label htmlFor="email">Corporate email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <button className="btn btn-otto" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      <p className="helper" style={{ marginTop: 14 }}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}
