"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { Info, X } from "lucide-react";

const RESET_PASSWORD_GUIDE =
  "https://drive.google.com/file/d/1JEfLKXcbUZSoqog5JBbBuAbxtR9RUfN3/view?usp=sharing";
const CREATE_ACCOUNT_GUIDE =
  "https://drive.google.com/file/d/1HiSu5EwBj5jP8GupGi6tlotb3vHZk4t3/view?usp=sharing";
const TROUBLESHOOTING_GUIDE =
  "https://sites.google.com/vectra-intl.com/otto-group-lmsguide/home";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpDialogRef = useRef<HTMLDialogElement>(null);
  const helpTitleId = useId();

  function openHelp() {
    helpDialogRef.current?.showModal();
    setHelpOpen(true);
  }

  function closeHelp() {
    helpDialogRef.current?.close();
  }

  useEffect(() => {
    const dialog = helpDialogRef.current;
    if (!dialog) return;
    function onClose() {
      setHelpOpen(false);
    }
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

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
    <>
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
        <div className="login-steps">
          <p className="login-step">
            <span className="login-step-label">Step 1</span>
            <span>
              New learner? <a href="/register">Register here</a>
            </span>
          </p>
          <p className="login-step">
            <span className="login-step-label">Step 2</span>
            <a href="/forgot-password">Forgot password?</a>
          </p>
          <button
            type="button"
            className="forgot-help-trigger"
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            onClick={openHelp}
          >
            <Info size={16} strokeWidth={2.25} aria-hidden="true" />
            Troubleshooting Guide
          </button>
        </div>
      </form>
      <dialog
        ref={helpDialogRef}
        className="forgot-help-dialog"
        aria-labelledby={helpTitleId}
        onClick={(event) => {
          if (event.target === helpDialogRef.current) closeHelp();
        }}
      >
        <div className="forgot-help-dialog-inner">
          <button type="button" className="forgot-help-close" aria-label="Close" onClick={closeHelp}>
            <X size={18} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <p>
            Please note: The Forgot Password option is only applicable to users who have already created an account.
          </p>
          <h2 id={helpTitleId} className="forgot-help-title">Need help?</h2>
          <ul className="forgot-help-links">
            <li>
              <a href={RESET_PASSWORD_GUIDE} target="_blank" rel="noopener noreferrer">
                How to reset your password
              </a>
            </li>
            <li>
              <a href={CREATE_ACCOUNT_GUIDE} target="_blank" rel="noopener noreferrer">
                How to create an account
              </a>
            </li>
          </ul>
          <a
            className="btn btn-otto forgot-help-troubleshooting"
            href={TROUBLESHOOTING_GUIDE}
            target="_blank"
            rel="noopener noreferrer"
          >
            Troubleshooting Guide
          </a>
        </div>
      </dialog>
    </>
  );
}
