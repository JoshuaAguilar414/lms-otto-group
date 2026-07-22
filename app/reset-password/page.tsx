import { Suspense } from "react";
import OttoLogo from "@/components/OttoLogo";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="narrow">
      <div className="card card-otto">
        <div className="brand-lockup">
          <OttoLogo className="otto-logo-md" />
          <div className="brand-lockup-text">Otto Group Academy</div>
        </div>
        <h1 className="page-title">Reset password</h1>
        <p className="page-subtitle">Choose a new password for your Otto Group Academy account.</p>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
