export function LoadingSpinner() {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__circle" aria-hidden="true" />
      <span>Analizando imagen…</span>
    </div>
  );
}
