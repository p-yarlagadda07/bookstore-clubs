
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client.js';
import { getBook } from '../books/booksApi.js';

export default function PublicShelfPage() {
  const { id } = useParams();

  const {
    data: shelf,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['public-shelf', id],
    queryFn: () => api.get(`/reading-lists/${id}/public`),
    enabled: Boolean(id),
  });

  const items = shelf?.items ?? [];

  const booksQuery = useQuery({
    queryKey: ['public-shelf-books', id, items.map((item) => item.bookId).join(',')],
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
    enabled: Boolean(shelf),
  });

  if (isLoading) {
    return <section className="books-page"><h1>Public Shelf</h1><p>Loading shelf...</p></section>;
  }

  if (isError) {
    return (
      <section className="books-page">
        <h1>Public Shelf</h1>
        <p role="alert">{error?.message || 'Could not load this public shelf.'}</p>
        <Link to="/books">Browse books</Link>
      </section>
    );
  }

  return (
    <section className="books-page">
      <h1>{shelf.name}</h1>
      <p>{items.length} books on this shelf</p>

      {items.length === 0 ? (
        <p>This shelf has no books yet.</p>
      ) : booksQuery.isLoading ? (
        <p>Loading books...</p>
      ) : (
        <ul>
          {booksQuery.data?.map((item) => (
            <li key={item.bookId}>
              {item.book ? (
                <Link to={`/books/${item.book._id ?? item.book.id}`}>
                  {item.book.title}
                </Link>
              ) : (
                <span>Book details unavailable</span>
              )}
              {item.note && <p>{item.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
