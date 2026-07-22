"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to reset password");
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  if (!token) {
    return (
      <div>
        <div className="alert error">Missing reset token. Use the link from your email.</div>
        <Link className="btn btn-otto" href="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <div className="alert success">Password updated. You can sign in now.</div>
        <Link className="btn btn-otto" href="/login">Go to sign in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert error">{error}</div>}
      <div className="field">
        <label htmlFor="password">New password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
        <div className="helper">At least 10 characters, with upper, lower, and a number.</div>
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm password</label>
        <input className="input" id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} />
      </div>
      <button className="btn btn-otto" disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
    </form>
  );
}
