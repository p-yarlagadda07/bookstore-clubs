import { useState } from "react";
import { mockClubs } from "./clubs.mock";
import ClubDetailPage from "./ClubDetailPage";
import "./clubs.css";

export default function ClubsPage() {
  const [selectedClub, setSelectedClub] = useState(null);
  const [joinedClubs, setJoinedClubs] = useState([]);

  function handleJoin(clubId) {
    setJoinedClubs((current) => {
      if (current.includes(clubId)) {
        return current.filter((id) => id !== clubId);
      }

      return [...current, clubId];
    });
  }

  if (selectedClub) {
    return (
      <ClubDetailPage
        club={selectedClub}
        isJoined={joinedClubs.includes(selectedClub.id)}
        onJoin={() => handleJoin(selectedClub.id)}
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

      <div className="clubs-grid">
        {mockClubs.map((club) => (
          <article className="club-card" key={club.id}>
            <div>
              <p className="club-label">BOOK CLUB</p>

              <h2>{club.name}</h2>

              <p>{club.description}</p>

              <div className="current-book">
                <strong>{club.currentBook.title}</strong>
                <span>by {club.currentBook.author}</span>
              </div>
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
    </section>
  );
}   