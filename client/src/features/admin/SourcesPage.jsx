import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageTitle,
  Spinner,
} from '../../components/index.js';
import './sources.css';

function SourcesPage() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.get('/admin/sources'),
  });

  const sources = data?.items ?? [];

  const permissionMutation = useMutation({
    mutationFn: ({ id, permission }) =>
      api.patch(`/admin/sources/${id}`, { permission }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  function changePermission(source, permission) {
    if (
      permission === 'revoked' &&
      !window.confirm(
        `Its ${source.bookCount} books will be hidden from the shop.`,
      )
    ) {
      return;
    }

    permissionMutation.mutate({
      id: source.id,
      permission,
    });
  }

  function badgeTone(permission) {
    if (permission === 'approved') return 'success';
    if (permission === 'revoked') return 'danger';
    return 'muted';
  }

  return (
    <main className="sources-page">
      <PageTitle number="13" label="Admin" title="Sources">
        Manage the sources used to build the bookstore catalog.
      </PageTitle>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState
          title="Could not load sources"
          message="Please check your admin access and try again."
        />
      ) : sources.length === 0 ? (
        <EmptyState
          title="No catalog sources"
          message="There are no sources to display."
        />
      ) : (
        <div className="sources-list">
          {sources.map((source) => (
            <Card key={source.id}>
              <article className="sources-card">
                <div className="sources-info">
                  <div className="sources-heading">
                    <h2>{source.name}</h2>
                    <Badge tone={badgeTone(source.permission)}>
                      {source.permission}
                    </Badge>
                  </div>

                  <dl className="sources-details">
                    <div>
                      <dt>Type</dt>
                      <dd>{source.type || 'Not specified'}</dd>
                    </div>

                    <div>
                      <dt>License</dt>
                      <dd>{source.license || 'Not specified'}</dd>
                    </div>

                    <div>
                      <dt>Books</dt>
                      <dd>{source.bookCount ?? 0}</dd>
                    </div>
                  </dl>
                </div>

                <div className="sources-actions">
                  {source.permission !== 'approved' && (
                    <Button
                      type="button"
                      disabled={permissionMutation.isPending}
                      onClick={() =>
                        changePermission(source, 'approved')
                      }
                    >
                      Approve
                    </Button>
                  )}

                  {source.permission !== 'revoked' && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={permissionMutation.isPending}
                      onClick={() =>
                        changePermission(source, 'revoked')
                      }
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </article>
            </Card>
          ))}
        </div>
      )}

      {permissionMutation.isError && (
        <p className="sources-error" role="alert">
          {permissionMutation.error?.message ??
            'Could not update the source. Please try again.'}
        </p>
      )}
    </main>
  );
}

export default SourcesPage;