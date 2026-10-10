import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client.js';
import { getBook } from '../books/booksApi.js';

export default function ListDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const {
    data: list,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reading-list', id],
    queryFn: () => api.get(`/reading-lists/${id}`),
    enabled: Boolean(id),
  });

  const removeMutation = useMutation({
    mutationFn: (bookId) => api.delete(`/reading-lists/${id}/items/${bookId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-list', id] });
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
    },
  });

  const items = list?.items ?? [];

  const booksQuery = useQuery({
    queryKey: ['reading-list-books', id, items.map((item) => item.bookId).join(',')],
    queryFn: async () =>
      Promise.all(
        items.map(async (item) => {
          try {
            const book = await getBook(item.bookId);
            return { ...item, book };
          } catch {
            return { ...item, book: null };
          }
        }),
      ),
    enabled: Boolean(list),
  });

  if (isLoading)
    return (
      <section>
        <h1>Reading List</h1>
        <p>Loading list...</p>
      </section>
    );

  if (isError) {
    return (
      <section>
        <h1>Reading List</h1>
        <p role="alert">{error?.message || 'Could not load this list.'}</p>
        <Link to="/lists">Back to my lists</Link>
      </section>
    );
  }

  if (!list) return null;

  return (
    <section className="books-page">
      <Link to="/lists">← Back to my lists</Link>
      <h1>{list.name}</h1>
      <p>{items.length} books in this list</p>

      {removeMutation.isError && (
        <p role="alert">{removeMutation.error?.message || 'Could not remove the book.'}</p>
      )}

      {booksQuery.isLoading ? (
        <p>Loading books...</p>
      ) : items.length === 0 ? (
        <p>This list is empty. Add a book from its book detail page.</p>
      ) : (
        <ul>
          {booksQuery.data?.map((item) => (
            <li key={item.bookId}>
              {item.book ? (
                <>
                  <Link to={`/books/${item.book._id ?? item.book.id}`}>{item.book.title}</Link>
                  {item.book.authors?.length > 0 && <span>, {item.book.authors.join(', ')}</span>}
                </>
              ) : (
                <span>Book details unavailable ({item.bookId})</span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Remove this book from the list?')) {
                    removeMutation.mutate(item.bookId);
                  }
                }}
                disabled={removeMutation.isPending}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
