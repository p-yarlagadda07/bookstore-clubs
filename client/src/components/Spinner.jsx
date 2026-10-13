export default function Spinner({ label }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner-roller" aria-hidden="true">
        <span />
      </span>
      <span className={label ? 'spinner-label' : 'sr-only'}>{label || 'Loading'}</span>
    </div>
  );
}
