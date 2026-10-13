export default function EmptyState({ title, message = 'Nothing here yet.', children }) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true">
        <rect x="18" y="62" width="84" height="16" rx="3" className="es-book es-book-1" />
        <rect x="24" y="46" width="72" height="16" rx="3" className="es-book es-book-2" />
        <rect
          x="30"
          y="24"
          width="62"
          height="16"
          rx="3"
          className="es-book es-book-3"
          transform="rotate(-8 61 32)"
        />
        <line x1="10" y1="80" x2="110" y2="80" className="es-floor" />
      </svg>
      {title && <h2>{title}</h2>}
      <p>{message}</p>
      {children}
    </div>
  );
}
