import ActivateForm from "@/components/ActivateForm";
import OttoLogo from "@/components/OttoLogo";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <main className="narrow">
      <div className="card">
        <div className="brand-lockup">
          <OttoLogo className="otto-logo-md" />
          <div className="brand-lockup-text">Otto Group Academy</div>
        </div>
        <h1 className="page-title">Activate your account</h1>
        <p className="page-subtitle">Create a secure password to access your assigned training.</p>
        <ActivateForm token={params.token || ""} />
      </div>
    </main>
  );
}
