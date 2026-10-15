import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client.js';
import { Card, EmptyState, PageTitle, Spinner } from '../../components/index.js';
import { spineColor } from '../books/spine.js';
import '../books/books.css';

export default function PublicShelfPage() {
  const { id } = useParams();

  const {
    data: shelf,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-shelf', id],
    queryFn: () => api.get(`/reading-lists/${id}/public`),
    retry: false,
  });

  if (isLoading) return <Spinner label="Loading shelf" />;

  if (error) {
    return (
      <section>
        <PageTitle number="05" label="Shared shelf" title="Shelf" />
        <EmptyState
          title={error.code === 'NOT_FOUND' ? 'This shelf is private' : 'Could not load this shelf'}
          message="The owner may have stopped sharing it."
        >
          <Link to="/books">Browse the catalog</Link>
        </EmptyState>
      </section>
    );
  }

  return (
    <section>
      <PageTitle number="05" label="Shared shelf" title={shelf.name}>
        Shelf by {shelf.owner}, {shelf.items.length} {shelf.items.length === 1 ? 'book' : 'books'}
      </PageTitle>

      {shelf.items.length === 0 ? (
        <EmptyState title="Nothing on this shelf yet" message="Check back later." />
      ) : (
        <section className="book-grid">
          {shelf.items.map((item) => (
            <Card
              key={item.bookId}
              className="book-card card-hover spine"
              style={{ '--spine': spineColor(item.title) }}
            >
              <div className="book-card-content">
                <h2>
                  <Link to={`/books/${item.bookId}`}>{item.title}</Link>
                </h2>
                <p className="book-authors">{item.authors?.join(', ')}</p>
              </div>
            </Card>
          ))}
        </section>
      )}
    </section>
  );
}
