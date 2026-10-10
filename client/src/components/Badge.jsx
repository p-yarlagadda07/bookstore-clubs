export default function Badge({ tone = 'default', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
