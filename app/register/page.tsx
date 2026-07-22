import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import OttoLogo from "@/components/OttoLogo";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="narrow">
      <div className="card card-otto">
        <div className="brand-lockup">
          <OttoLogo className="otto-logo-md" />
          <div className="brand-lockup-text">Otto Group Academy</div>
        </div>
        <h1 className="page-title">Registration</h1>
        <p className="page-subtitle">Create your learner account to access Otto training.</p>
        <RegisterForm />
        <p className="reg-footer">
          Already registered? <a href="/login">Sign in</a>
        </p>
      </div>
    </main>
  );
}
