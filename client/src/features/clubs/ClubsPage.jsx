import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { EmptyState, PageTitle, Spinner } from '../../components/index.js';
import './clubs.css';

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadClubs() {
      try {
        setLoading(true);
        setError('');

        const { items } = await api.get('/clubs');

        if (!cancelled) {
          setClubs(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load clubs.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClubs();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="clubs-page">
      <PageTitle number="03" label="Book clubs" title="Reading Circles">
        See what each circle is reading, when they meet next, and pull up a chair.
      </PageTitle>

      {loading && <Spinner label="Setting out the chairs..." />}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && clubs.length === 0 && (
        <EmptyState title="No circles yet" message="New reading circles will show up here." />
      )}

      {!loading && !error && clubs.length > 0 && (
        <div className="clubs-grid">
          {clubs.map((club) => (
            <article className="club-card" key={club.id}>
              <div>
                <p className="club-label">BOOK CLUB</p>
                <h2>{club.name}</h2>

                <p>{club.description}</p>

                {club.currentBook && (
                  <div className="current-book">
                    <strong>{club.currentBook.title}</strong>
                    <span>by {club.currentBook.author}</span>
                  </div>
                )}
              </div>
              <Link className="club-button" to={`/clubs/${club.id}`}>
                View Club
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
