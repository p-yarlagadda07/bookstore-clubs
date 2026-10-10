import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';

export default function ListsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [message, setMessage] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reading-lists'],
    queryFn: () => api.get('/reading-lists'),
  });

  const lists = data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (listName) => api.post('/reading-lists', { name: listName }),
    onSuccess: () => {
      setName('');
      setMessage('Reading list created.');
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
    },
    onError: (err) => setMessage(err.message || 'Could not create the list.'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name: newName }) => api.patch(`/reading-lists/${id}`, { name: newName }),
    onSuccess: () => {
      setEditingId(null);
      setEditingName('');
      setMessage('Reading list renamed.');
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
    },
    onError: (err) => setMessage(err.message || 'Could not rename the list.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reading-lists/${id}`),
    onSuccess: () => {
      setMessage('Reading list deleted.');
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
    },
    onError: (err) => setMessage(err.message || 'Could not delete the list.'),
  });

  function createList(event) {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName) createMutation.mutate(cleanName);
  }

  function saveRename(event) {
    event.preventDefault();
    const cleanName = editingName.trim();
    if (cleanName && editingId) {
      renameMutation.mutate({ id: editingId, name: cleanName });
    }
  }

  if (isLoading)
    return (
      <section>
        <h1>My Reading Lists</h1>
        <p>Loading lists...</p>
      </section>
    );

  if (isError) {
    return (
      <section>
        <h1>My Reading Lists</h1>
        <p role="alert">{error?.message || 'Could not load reading lists.'}</p>
      </section>
    );
  }

  return (
    <section className="books-page">
      <h1>My Reading Lists</h1>
      <p>Save books you want to read and organise them into lists.</p>

      {message && <p role="status">{message}</p>}

      <form onSubmit={createList}>
        <label htmlFor="new-list-name">New list name</label>
        <input
          id="new-list-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Books to read"
          maxLength={80}
          required
        />
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create list'}
        </button>
      </form>

      {lists.length === 0 ? (
        <p>You haven't created any reading lists yet.</p>
      ) : (
        <ul>
          {lists.map((list) => {
            const id = list._id ?? list.id;

            return (
              <li key={id}>
                {editingId === id ? (
                  <form onSubmit={saveRename}>
                    <input
                      aria-label="New list name"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      maxLength={80}
                      required
                    />
                    <button type="submit" disabled={renameMutation.isPending}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <Link to={`/lists/${id}`}>{list.name}</Link>
                    <span> ({list.items?.length ?? 0} books)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(id);
                        setEditingName(list.name);
                        setMessage('');
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${list.name}"?`)) {
                          deleteMutation.mutate(id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
