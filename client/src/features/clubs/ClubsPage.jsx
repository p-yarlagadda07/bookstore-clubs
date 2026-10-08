import { useEffect, useState } from "react";
import api from "../../api/client.js";
import ClubDetailPage from "./ClubDetailPage";
import "./clubs.css";

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClubs() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/clubs");
        const items = response.data?.items ?? [];

        if (!cancelled) {
          setClubs(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "Unable to load clubs.");
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

  if (selectedClub) {
    return (
      <ClubDetailPage
        club={selectedClub}
        onBack={() => setSelectedClub(null)}
      />
    );
  }

  return (
    <section className="clubs-page">
      <div className="clubs-header">
        <p className="club-label">COMMUNITY</p>
        <h1>Book Clubs</h1>
        <p>
          Discover local book clubs, see what they are reading, and join a
          community of readers.
        </p>
      </div>

      {loading && <p>Loading clubs...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && clubs.length === 0 && (
        <p>No clubs are available right now.</p>
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

              <button
                className="club-button"
                onClick={() => setSelectedClub(club)}
              >
                View Club
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
