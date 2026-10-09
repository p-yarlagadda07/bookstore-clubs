
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => api.get('/reservations/mine'),
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: (reservationId) =>
      api.delete(`/reservations/${reservationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['my-reservations'],
      });
    },
  });

  const reservations = data?.items ?? [];

  if (isLoading) {
    return (
      <main className="books-page">
        <h1>My Reservations</h1>
        <p>Loading your reservations...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="books-page">
        <h1>My Reservations</h1>
        <p role="alert">
          Reservations are temporarily unavailable. The reservations API
          may not be connected yet.
        </p>
        {error?.message && <p>{error.message}</p>}
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="books-page">
      <h1>My Reservations</h1>
      <p>View and manage your book reservations.</p>

      {cancelMutation.isError && (
        <p role="alert">
          {cancelMutation.error?.message ||
            'Could not cancel this reservation. Please try again.'}
        </p>
      )}

      {reservations.length === 0 ? (
        <p>You don't have any reservations yet.</p>
      ) : (
        <ul>
          {reservations.map((reservation) => {
            const reservationId = reservation.id ?? reservation._id;
            const status = reservation.status ?? 'unknown';

            return (
              <li key={reservationId}>
                <h2>{reservation.title || 'Reserved book'}</h2>

                <p>
                  <strong>Condition:</strong>{' '}
                  {reservation.condition || 'Not specified'}
                </p>

                <p>
                  <strong>Status:</strong> {status}
                </p>

                {reservation.pickupWindow && (
                  <p>
                    <strong>Pickup window:</strong>{' '}
                    {reservation.pickupWindow.start || 'N/A'}
                    {' – '}
                    {reservation.pickupWindow.end || 'N/A'}
                  </p>
                )}

                {reservation.expiresAt && (
                  <p>
                    <strong>Expires:</strong>{' '}
                    {new Date(reservation.expiresAt).toLocaleString()}
                  </p>
                )}

                {status === 'held' && (
                  <button
                    type="button"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Cancel your reservation for "${reservation.title || 'this book'}"?`,
                        )
                      ) {
                        cancelMutation.mutate(reservationId);
                      }
                    }}
                  >
                    {cancelMutation.isPending
                      ? 'Cancelling...'
                      : 'Cancel reservation'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
