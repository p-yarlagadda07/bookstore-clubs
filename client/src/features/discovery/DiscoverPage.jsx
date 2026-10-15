import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Badge, Button, Card, EmptyState, PageTitle, Spinner } from '../../components';
import { stockTone } from '../books/stockTone.js';
import { spineColor } from '../books/spine.js';
import './discovery.css';

const EXAMPLES = [
  "the one about a lighthouse keeper's granddaughter",
  'a murder mystery on a train platform',
  'something hopeful about starting over',
  'a short story set in space',
];

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    if (query.trim().length < 3) {
      setError('Please enter at least 3 characters.');
      setBooks([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setBooks([]);
    setSearched(true);

    try {
      const result = await api.get('/books/discover', {
        params: { q: query.trim(), limit: 5 },
      });

      setBooks(result.items ?? []);
    } catch (err) {
      setError(
        err.code === 'AI_UNAVAILABLE' || err.code === 'AI_TIMEOUT'
          ? 'Smart Search is offline right now.'
          : err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="discover-page">
      <PageTitle number="01" label="Smart Search" title="Tell us the book you half remember.">
        A scene, a character, a feeling. Describe it in your own words and we&apos;ll find it on our
        shelves.
      </PageTitle>

      <form className="discover-form" onSubmit={handleSearch}>
        <label htmlFor="book-description">Describe the book you remember</label>

        <textarea
          id="book-description"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="the one about a lighthouse keeper's granddaughter"
          rows={4}
        />

        <div className="discover-examples">
          <span>Try:</span>
          {EXAMPLES.map((example) => (
            <button
              type="button"
              key={example}
              className="discover-example"
              onClick={() => setQuery(example)}
            >
              {example}
            </button>
          ))}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find books'}
        </Button>
      </form>

      {loading && (
        <div className="discover-status">
          <Spinner label="Checking the shelves..." />
        </div>
      )}

      {error && (
        <div className="discover-error" role="alert">
          <p>{error}</p>
          {error === 'Smart Search is offline right now.' && (
            <Link to="/books">Browse the catalog</Link>
          )}
        </div>
      )}

      {!loading && searched && !error && books.length === 0 && (
        <EmptyState
          title="No close matches"
          message="Try a different detail: where it happens, how it felt, or who is in it."
        />
      )}

      {!loading && books.length > 0 && (
        <div className="discover-results">
          <h2>Matching books</h2>

          {books.map((book) => (
            <Card
              key={book.id}
              className="card-hover spine"
              style={{ '--spine': spineColor(book.title) }}
            >
              <div>
                <h3>
                  <Link to={`/books/${book.id}`}>{book.title}</Link>
                </h3>

                <p className="discover-authors">
                  {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
                </p>

                {book.synopsis && (
                  <p className="discover-synopsis">
                    {book.synopsis.length > 150
                      ? `${book.synopsis.slice(0, 150)}...`
                      : book.synopsis}
                  </p>
                )}

                {book.availability?.label && (
                  <Badge tone={stockTone(book.availability.label)}>{book.availability.label}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
