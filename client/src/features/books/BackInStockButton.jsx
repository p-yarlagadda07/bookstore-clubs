import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/index.js';
import api from '../../api/client.js';

export default function BackInStockButton({ bookId, user, isVerified }) {
  const alertMutation = useMutation({
    mutationFn: () => api.post(`/books/${bookId}/alerts`),
  });

  if (!isVerified) {
    if (user) {
      return null;
    }

    return (
      <Link className="reserve-link" to="/login">
        Log in to get an alert
      </Link>
    );
  }

  if (alertMutation.isSuccess) {
    return (
      <span>
        <Badge tone="success">On the list</Badge> We'll tell you when it's back
      </span>
    );
  }

  if (alertMutation.isError) {
    const message =
      alertMutation.error?.code === 'IN_STOCK'
        ? alertMutation.error.message
        : alertMutation.error?.message || 'Could not create a stock alert. Please try again.';

    return (
      <div>
        <p role="alert">{message}</p>
        <button type="button" onClick={() => alertMutation.reset()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="reserve-link"
      disabled={alertMutation.isPending}
      onClick={() => alertMutation.mutate()}
    >
      {alertMutation.isPending ? 'Adding alert...' : "Tell me when it's back"}
    </button>
  );
}
