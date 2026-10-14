
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Card, Badge, Button } from '../../components/index.js';

export default function ShelfAlerts() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts/mine'),
  });

  const removeAlert = useMutation({
    mutationFn: (id) => api.delete(`/alerts/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (isLoading || isError) return null;

  const items = data?.items ?? [];

  if (items.length === 0) return null;

  return (
    <section>
      <h2>Back on the Shelf</h2>

      {items.map((alert) => (
        <Card key={alert.id}>
          <div>
            <Link to={`/books/${alert.bookId}`}>
              {alert.title}
            </Link>

            <Badge
              tone={
                alert.status === 'waiting'
                  ? 'muted'
                  : 'success'
              }
            >
              {alert.status === 'waiting'
                ? 'Waiting'
                : 'Back on the shelf'}
            </Badge>

            <Button
              variant="secondary"
              onClick={() => removeAlert.mutate(alert.id)}
              disabled={removeAlert.isPending}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </section>
  );
}
