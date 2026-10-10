export default function Dialog({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>

        {children}

        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
