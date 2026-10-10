export default function EmptyState({ message = 'Nothing here yet.' }) {
  return <p className="empty-state">{message}</p>;
}
