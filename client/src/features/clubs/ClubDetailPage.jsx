import "./clubs.css";

export default function ClubDetailPage({
  club,
  isJoined,
  onJoin,
  onBack,
}) {
  if (!club) {
    return (
      <section className="clubs-page">
        <p>Club not found.</p>
        <button className="club-button" onClick={onBack}>
          Back to clubs
        </button>
      </section>
    );
  }

  return (
    <section className="clubs-page">
      <button className="back-button" onClick={onBack}>
        ← Back to clubs
      </button>

      <div className="club-detail-card">
        <div className="club-detail-header">
          <div>
            <p className="club-label">BOOK CLUB</p>
            <h1>{club.name}</h1>
          </div>

          <button className="club-button" onClick={onJoin}>
            {isJoined ? "Joined" : "Join Club"}
          </button>
        </div>

        <div className="club-section">
          <h2>Description</h2>
          <p>{club.description}</p>
        </div>

        <div className="club-section">
          <h2>Current Book</h2>

          <div className="current-book">
            <strong>{club.currentBook.title}</strong>
            <span>by {club.currentBook.author}</span>
          </div>
        </div>

        <div className="club-section">
          <h2>Club Rules</h2>

          <ul>
            {club.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="club-section">
          <h2>Meetings</h2>

          <div className="meetings-list">
            {club.meetings.map((meeting) => (
              <article className="meeting-card" key={meeting.id}>
                <strong>{meeting.date}</strong>
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