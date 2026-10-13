export default function Card({ title, className = '', style, children }) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}
