import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { Badge, Card, Button, Spinner } from '../../components';
import './discovery.css';

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
        err.code === 'AI_UNAVAILABLE'
          ? 'Smart Search is offline right now.'
          : err.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="discover-page">
      <h1>Smart Search</h1>
      <p className="discover-intro">
        Remember a story, scene, or character? Describe it and find the book.
      </p>

      <form className="discover-form" onSubmit={handleSearch}>
        <label htmlFor="book-description">Describe the book you remember</label>

        <textarea
          id="book-description"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="the one about a lighthouse keeper's granddaughter"
          rows={4}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find books'}
        </Button>
      </form>

      {loading && (
        <div className="discover-status" role="status">
          <Spinner />
          <p>Searching for matching books...</p>
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
        <p className="discover-empty">No close matches, try describing it differently</p>
      )}

      {!loading && books.length > 0 && (
        <div className="discover-results">
          <h2>Matching books</h2>

          {books.map((book) => (
            <Card key={book.id}>
              <h3>
                <Link to={`/books/${book.id}`}>{book.title}</Link>
              </h3>

              <p className="discover-authors">
                {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
              </p>

              {book.synopsis && (
                <p className="discover-synopsis">
                  {book.synopsis.length > 150 ? `${book.synopsis.slice(0, 150)}...` : book.synopsis}
                </p>
              )}

              {book.availability?.label && <Badge>{book.availability.label}</Badge>}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
