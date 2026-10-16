import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useMe from '../../app/useMe.js';
import Badge from '../../components/Badge.jsx';
import api from '../../api/client.js';
import './nextRead.css';

const agentSteps = [
  { name: 'searchCatalog', label: 'Searching the catalog' },
  { name: 'checkStockAndLength', label: 'Checking availability and book length' },
  { name: 'compareClubConstraints', label: 'Checking your club schedule' },
];

export default function NextReadPage() {
  const { user } = useMe();
  const isAdmin = user?.roles?.includes('admin');

  const [clubs, setClubs] = useState([]);
  const [clubId, setClubId] = useState('');
  const [request, setRequest] = useState('');
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClubs() {
      try {
        const response = await api.get('/clubs');

        if (!cancelled) {
          const items = response?.items ?? [];
          const moderatorClubIds = (user?.moderatorOf ?? []).map(String);
          const visibleClubs = isAdmin
            ? items
            : items.filter((club) => moderatorClubIds.includes(String(club.id)));

          setClubs(visibleClubs);
          setClubId((currentId) =>
            visibleClubs.some((club) => String(club.id) === currentId)
              ? currentId
              : visibleClubs.length > 0
                ? String(visibleClubs[0].id)
                : '',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load clubs.');
        }
      } finally {
        if (!cancelled) {
          setLoadingClubs(false);
        }
      }
    }

    loadClubs();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!clubId || !request.trim() || running) return;

    setRunning(true);
    setError('');
    setSteps([]);
    setResult(null);

    try {
      const csrfResponse = await fetch('/api/auth/csrf', {
        credentials: 'include',
      });

      const csrfBody = await csrfResponse.json();

      if (!csrfResponse.ok || !csrfBody?.data?.token) {
        throw new Error('Could not start a secure request. Please refresh and try again.');
      }

      const response = await fetch('/api/reading-agent', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfBody.data.token,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          clubId,
          request: request.trim(),
        }),
      });

      if (!response.ok) {
        let message = 'Unable to get recommendations.';

        try {
          const body = await response.json();
          message = body?.error?.message ?? message;
        } catch {
          message = 'Unable to get recommendations.';
        }

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Live updates are not available in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processEvent(block) {
        const lines = block.split(/\r?\n/);
        let eventName = 'message';
        const dataLines = [];

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }

        if (dataLines.length === 0) return;

        let payload;

        try {
          payload = JSON.parse(dataLines.join('\n'));
        } catch {
          return;
        }

        if (eventName === 'tool') {
          setSteps((previous) => [...previous, payload]);
        } else if (eventName === 'final') {
          setResult(payload);
        } else if (eventName === 'error') {
          throw new Error(payload?.message ?? 'The reading agent failed.');
        }
      }

      while (true) {
        const { value, done } = await reader.read();

        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          processEvent(block);
        }

        if (done) break;
      }

      if (buffer.trim()) {
        processEvent(buffer);
      }
    } catch (err) {
      setError(err?.message ?? 'Something went wrong while finding your next read.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="next-read-page">
      <header className="next-read-header">
        <p className="next-read-eyebrow">14 · Moderators</p>
        <h1>Next Read</h1>
        <p className="next-read-description">
          Tell us what your club wants to read. The agent will search real books, check
          availability, and find options that fit your schedule.
        </p>
      </header>

      <section className="next-read-panel">
        <form className="next-read-form" onSubmit={handleSubmit}>
          <label className="next-read-field">
            Choose your club
            <select
              value={clubId}
              onChange={(event) => setClubId(event.target.value)}
              disabled={loadingClubs || running || clubs.length === 0}
              required
            >
              {loadingClubs && <option value="">Loading clubs...</option>}
              {!loadingClubs && clubs.length === 0 && <option value="">No clubs available</option>}
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>

          <label className="next-read-field">
            What would your club like to read?
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="A short mystery we can finish in 3 weeks..."
              maxLength={500}
              required
              disabled={running}
            />
          </label>

          {error && (
            <p className="next-read-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="next-read-submit"
            type="submit"
            disabled={loadingClubs || !clubId || !request.trim() || running}
          >
            {running ? 'Finding your next read...' : 'Find our next read'}
          </button>
        </form>
      </section>

      {(running || steps.length > 0) && (
        <section className="next-read-panel" aria-live="polite">
          <h2>Agent activity</h2>
          <p className="next-read-muted">
            {running
              ? 'The agent is working through your club requirements.'
              : 'The agent has finished its steps.'}
          </p>

          <ol className="next-read-steps">
            {agentSteps.map((step) => {
              const event = [...steps].reverse().find((item) => item?.name === step.name);
              const status = event?.status;
              const completed = status === 'succeeded';
              const failed = status === 'failed';

              return (
                <li className="next-read-step" key={step.name}>
                  <span className="next-read-step-marker">
                    {completed
                      ? 'Done'
                      : failed
                        ? 'Failed'
                        : status === 'started' || running
                          ? 'Working'
                          : ''}
                  </span>

                  <div>
                    <strong>{step.label}</strong>
                    {event?.summary && <p>{event.summary}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {result && (
        <section className="next-read-panel">
          <p className="next-read-eyebrow">THE SHORTLIST</p>
          <h2>Your club's next read</h2>

          {result.shortlist?.length > 0 ? (
            <div className="next-read-results">
              {result.shortlist.map((book) => {
                const isTight = String(book.timeFit ?? '')
                  .toLowerCase()
                  .includes('tight');

                return (
                  <article className="next-read-book" key={book.bookId}>
                    <h3>
                      <Link to={`/books/${book.bookId}`}>{book.title}</Link>
                    </h3>

                    <p>
                      <strong>Author:</strong>{' '}
                      {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}
                    </p>

                    <p>
                      <strong>Length:</strong> {book.pages} pages
                    </p>

                    <p>
                      <strong>Availability:</strong> {book.copies} copies
                    </p>

                    <p>
                      <strong>Schedule fit:</strong> <Badge>{isTight ? 'Tight' : 'Fits'}</Badge>
                    </p>

                    {book.evidence?.length > 0 && (
                      <ul className="next-read-evidence">
                        {book.evidence.map((item, index) => (
                          <li key={`${book.bookId}-evidence-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p>
              No books matched all your club's requirements. Try broadening your request or choosing
              a different reading duration.
            </p>
          )}

          {result.note && (
            <>
              <h2>Note for your club</h2>
              <div className="next-read-note">{result.note}</div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
