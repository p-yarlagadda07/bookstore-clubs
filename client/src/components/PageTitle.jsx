export default function PageTitle({ number, label, title, children }) {
  return (
    <header className="page-title">
      <p className="page-title-label">
        <span>No. {number}</span>
        {label}
      </p>
      <h1>{title}</h1>
      {children && <p className="page-title-intro">{children}</p>}
    </header>
  );
}
