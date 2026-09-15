import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getBranding } from "@/lib/branding";

export default function ResetPasswordPage() {
  const branding = getBranding();
  return (
    <AuthShell>
      <div className="narrow">
        <div className="card card-otto">
          <div className="brand-lockup-text">{branding.productName}</div>
          <h1 className="page-title">Reset password</h1>
          <p className="page-subtitle">Choose a new password for your {branding.productName} account.</p>
          <Suspense fallback={<p className="muted">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </AuthShell>
  );
}
