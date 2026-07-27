import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthShell>
      <div className="narrow">
        <div className="card card-otto">
          <div className="brand-lockup-text">Otto Group Academy</div>
          <h1 className="page-title">Welcome back</h1>
          <p className="page-subtitle">Sign in with your registered corporate email address.</p>
          <LoginForm />
          <p className="reg-footer">
            New learner? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
