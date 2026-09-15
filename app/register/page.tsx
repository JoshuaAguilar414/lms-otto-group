import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/branding";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  const branding = getBranding();
  return (
    <AuthShell>
      <div className="narrow">
        <div className="card card-otto">
          <div className="brand-lockup-text">{branding.productName}</div>
          <h1 className="page-title">Registration</h1>
          <p className="page-subtitle">Create your learner account to access assigned training.</p>
          <RegisterForm />
          <p className="reg-footer">
            Already registered? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
