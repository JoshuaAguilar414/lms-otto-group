import OttoLogo from "@/components/OttoLogo";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="narrow">
      <div className="card card-otto">
        <div className="brand-lockup">
          <OttoLogo className="otto-logo-md" />
          <div className="brand-lockup-text">Otto Group Academy</div>
        </div>
        <h1 className="page-title">Forgot password</h1>
        <p className="page-subtitle">Enter your corporate email and we will send a reset link if an account exists.</p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
