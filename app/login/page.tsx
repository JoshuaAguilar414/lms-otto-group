import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import OttoLogo from "@/components/OttoLogo";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="narrow">
      <div className="card card-otto">
        <div className="brand-lockup">
          <OttoLogo className="otto-logo-md" />
          <div className="brand-lockup-text">Otto Group Academy</div>
        </div>
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Sign in with your registered corporate email address.</p>
        <LoginForm />
        <p className="reg-footer">
          New learner? <a href="/register">Register here</a>
        </p>
      </div>
    </main>
  );
}
