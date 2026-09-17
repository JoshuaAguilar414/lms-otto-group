import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/branding";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const branding = getBranding();
  return (
    <AuthShell>
      <div className="narrow">
        <div className="card card-otto">
          <div className="brand-lockup-text">{branding.productName}</div>
          <h1 className="page-title">Welcome back</h1>
          <p className="page-subtitle">
            Sign in with your registered corporate email address. If you have not registered yet, please{" "}
            <a href="/register">click here</a>.
          </p>
          <LoginForm />
        </div>
      </div>
    </AuthShell>
  );
}
