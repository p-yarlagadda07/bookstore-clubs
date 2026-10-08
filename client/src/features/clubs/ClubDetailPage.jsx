import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/client.js";
import "./clubs.css";

export default function ClubDetailPage() {
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClub() {
      try {
        setLoading(true);
        setError("");

        const clubData = await api.get(`/clubs/${id}`);

if (!cancelled) {
  setClub(clubData);
}
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "Unable to load club.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClub();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleJoin() {
    if (isJoined || joining) return;

    try {
      setJoining(true);
      setError("");

      await api.post(`/clubs/${id}/join`);

      setIsJoined(true);
    } catch (err) {
      if (err?.code === "CONFLICT") {
        setIsJoined(true);
      } else {
        setError(err?.message ?? "Unable to join club.");
      }
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <section className="clubs-page">
        <p>Loading club...</p>
      </section>
    );
  }

  if (error && !club) {
    return (
      <section className="clubs-page">
        <p role="alert">{error}</p>
      </section>
    );
  }

  if (!club) {
    return (
      <section className="clubs-page">
        <p>Club not found.</p>
      </section>
    );
  }

  return (
    <section className="clubs-page">
      <button className="club-button" onClick={() => window.history.back()}>
        ← Back to clubs
      </button>

      {error && <p role="alert">{error}</p>}

      <div className="club-detail-card">
        <div className="club-detail-header">
          <div>
            <p className="club-label">BOOK CLUB</p>
            <h1>{club.name}</h1>
          </div>

          <button
            className="club-button"
            onClick={handleJoin}
            disabled={isJoined || joining}
          >
            {joining ? "Joining..." : isJoined ? "Joined" : "Join Club"}
          </button>
        </div>

        <div className="club-section">
          <h2>Description</h2>
          <p>{club.description}</p>
        </div>

        {club.currentBook && (
          <div className="club-section">
            <h2>Current Book</h2>

            <div className="current-book">
              <strong>{club.currentBook.title}</strong>
              <span>by {club.currentBook.author}</span>
            </div>
          </div>
        )}

        <div className="club-section">
          <h2>Club Rules</h2>

          <ul>
            {club.rules?.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="club-section">
          <h2>Meetings</h2>

          <div className="meetings-list">
            {club.meetings?.map((meeting) => (
              <article className="meeting-card" key={meeting.id}>
              <strong>{new Date(meeting.date).toLocaleDateString()}</strong>
                <span>{meeting.time}</span>
                <span>{meeting.location}</span>
                <p>{meeting.agenda}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
