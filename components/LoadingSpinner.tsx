export default function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-spinner-ring" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
