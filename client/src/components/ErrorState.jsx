export default function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <p className="error-state" role="alert">
      {message}
    </p>
  );
}
