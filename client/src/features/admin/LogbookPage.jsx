import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, PageTitle, Spinner } from '../../components/index.js';
import api from '../../api/client.js';
import './logbook.css';

const LIMIT = 20;

const fmt = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

// turns the details object into one short line
function describeDetails(d) {
  if (!d) return '';
  if (d.reason) return d.reason;
  if (d.title) return d.title;
  if (d.before && d.after) {
    return Object.keys(d.after)
      .filter((key) => typeof d.after[key] !== 'object' && key !== 'updatedAt' && key !== '__v')
      .filter((key) => d.before[key] !== d.after[key])
      .map((key) => `${key} ${d.before[key] ?? '-'} to ${d.after[key]}`)
      .join(', ');
  }
  if (typeof d.approved === 'boolean') return d.approved ? 'approved' : 'not approved';
  return '';
}

export default function LogbookPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logbook', page],
    queryFn: () => api.get('/admin/audit', { params: { page, limit: LIMIT } }),
    retry: false,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasNext = page * LIMIT < total;

  return (
    <main className="logbook-page">
      <PageTitle number="10" label="Admin" title="Logbook" />

      {isLoading && <Spinner label="Opening the logbook..." />}

      {isError && (
        <ErrorState
          message={
            error?.code === 'FORBIDDEN'
              ? 'Only admins can read the Logbook.'
              : error?.message || 'Could not load the Logbook.'
          }
        />
      )}

      {!isLoading && !isError && items.length === 0 && (
        <Card>
          <p className="logbook-empty">Nothing in the Logbook yet.</p>
        </Card>
      )}

      {items.length > 0 && (
        <Card>
          <table className="logbook-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>What</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{fmt(item.at)}</td>
                  <td>
                    {item.actor ? (
                      <>
                        {item.actor.name}
                        <small>{item.actor.email}</small>
                      </>
                    ) : (
                      <span className="logbook-muted">Unknown</span>
                    )}
                  </td>
                  <td>
                    <Badge>{item.action}</Badge>
                  </td>
                  <td>{item.targetType || '-'}</td>
                  <td>
                    {describeDetails(item.details) || <span className="logbook-muted">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="logbook-pager">
            <Button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              Previous
            </Button>
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / LIMIT))}
            </span>
            <Button onClick={() => setPage((p) => p + 1)} disabled={!hasNext}>
              Next
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
