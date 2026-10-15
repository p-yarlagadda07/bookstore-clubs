import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import useMe from '../../app/useMe.js';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageTitle,
  Spinner,
} from '../../components/index.js';
import './staff.css';

function StaffPage() {
  const [search, setSearch] = useState('');
  const [selectedClubs, setSelectedClubs] = useState({});
  const queryClient = useQueryClient();
  const { user } = useMe();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff', search],
    queryFn: () =>
      api.get('/admin/users', {
        params: search.trim() ? { q: search.trim() } : {},
      }),
  });

  const { data: clubsData } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => api.get('/clubs'),
  });

  const users = data?.items ?? [];
  const clubs = useMemo(() => {
    const result = clubsData?.items ?? clubsData ?? [];
    return Array.isArray(result) ? result : [];
  }, [clubsData]);

  const roleMutation = useMutation({
    mutationFn: ({ id, action, role, clubId }) =>
      api.patch(`/users/${id}/staff-role`, {
        action,
        role,
        ...(clubId ? { clubId } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  function changeSelectedClub(userId, clubId) {
    setSelectedClubs((current) => ({ ...current, [userId]: clubId }));
  }

  function updateRole(id, action, role, clubId) {
    roleMutation.mutate({ id, action, role, clubId });
  }

  return (
    <main className="staff-page">
      <PageTitle number="10" label="Admin" title="Staff">
        Manage bookseller access and club moderators.
      </PageTitle>

      <Card>
        <div className="staff-toolbar">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search users by name or email"
          />
          <span className="staff-count">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <EmptyState
            title="Could not load staff"
            description="Please check your access and try again."
          />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try another name or email." />
        ) : (
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Roles</th>
                  <th>Bookseller access</th>
                  <th>Club moderation</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const isSelf = String(item.id) === String(user?._id ?? user?.id);
                  const isBookseller = item.roles?.includes('bookseller');
                  const selectedClub = selectedClubs[item.id] ?? '';

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        <span className="staff-email">{item.email}</span>
                      </td>

                      <td>
                        <div className="staff-badges">
                          {item.roles?.map((role) => (
                            <Badge
                              key={role}
                              tone={
                                role === 'bookseller'
                                  ? 'success'
                                  : role === 'admin'
                                    ? 'accent'
                                    : 'default'
                              }
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      <td>
                        {isSelf ? (
                          <span className="staff-muted">Your account</span>
                        ) : (
                          <Button
                            type="button"
                            variant={isBookseller ? 'secondary' : 'primary'}
                            disabled={roleMutation.isPending}
                            onClick={() =>
                              updateRole(item.id, isBookseller ? 'revoke' : 'grant', 'bookseller')
                            }
                          >
                            {isBookseller ? 'Remove bookseller' : 'Make bookseller'}
                          </Button>
                        )}
                      </td>

                      <td>
                        <div className="staff-moderator-list">
                          {(item.moderatorOf ?? []).map((club) => (
                            <span className="staff-moderator" key={club.id}>
                              {club.name}
                              {!isSelf && (
                                <button
                                  type="button"
                                  className="staff-remove-club"
                                  aria-label={`Remove ${club.name} moderator role`}
                                  disabled={roleMutation.isPending}
                                  onClick={() =>
                                    updateRole(item.id, 'revoke', 'moderator', club.id)
                                  }
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>

                        {!isSelf && (
                          <div className="staff-add-moderator">
                            <select
                              aria-label={`Choose club for ${item.name}`}
                              value={selectedClub}
                              onChange={(event) => changeSelectedClub(item.id, event.target.value)}
                            >
                              <option value="">Choose a club</option>
                              {clubs
                                .filter(
                                  (club) =>
                                    !(item.moderatorOf ?? []).some(
                                      (existing) =>
                                        String(existing.id) === String(club.id ?? club._id),
                                    ),
                                )
                                .map((club) => (
                                  <option key={club.id ?? club._id} value={club.id ?? club._id}>
                                    {club.name}
                                  </option>
                                ))}
                            </select>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={!selectedClub || roleMutation.isPending}
                              onClick={() =>
                                updateRole(item.id, 'grant', 'moderator', selectedClub)
                              }
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {roleMutation.isError && (
          <p className="staff-error" role="alert">
            {roleMutation.error?.message ?? 'Could not update the role. Please try again.'}
          </p>
        )}
      </Card>
    </main>
  );
}

export default StaffPage;
