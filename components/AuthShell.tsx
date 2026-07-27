export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="otto-auth-shell">
      <main className="otto-auth-main">{children}</main>
    </div>
  );
}
