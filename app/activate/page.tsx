import AuthShell from "@/components/AuthShell";
import ActivateForm from "@/components/ActivateForm";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell>
      <div className="narrow">
        <div className="card card-otto">
          <div className="brand-lockup-text">Otto Group Academy</div>
          <h1 className="page-title">Activate your account</h1>
          <p className="page-subtitle">Create a secure password to access your assigned training.</p>
          <ActivateForm token={params.token || ""} />
        </div>
      </div>
    </AuthShell>
  );
}
