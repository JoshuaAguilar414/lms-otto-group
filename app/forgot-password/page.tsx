import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { getBranding } from "@/lib/branding";

export default function ForgotPasswordPage() {
  const branding = getBranding();
  return (
    <AuthShell>
      <div className="narrow">
        <div className="card card-otto">
          <div className="brand-lockup-text">{branding.productName}</div>
          <h1 className="page-title">Forgot password</h1>
          <p className="page-subtitle">Enter your corporate email and we will send a reset link if an account exists.</p>
          <ForgotPasswordForm />
        </div>
      </div>
    </AuthShell>
  );
}
