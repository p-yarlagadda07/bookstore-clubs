// Temporary start page. Member 9 replaces this with the app shell (router, layout, api client).
import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((b) => setHealth(b.ok ? `API ok, database ${b.data.db}` : 'API error'))
      .catch(() => setHealth('API not reachable - is the server running?'));
  }, []);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '48px auto',
        padding: 16,
      }}
    >
      <h1>Independent Bookstore Discovery and Clubs</h1>
      <p>
        Setup check: <strong>{health}</strong>
      </p>
      <p>
        If you can see &quot;API ok, database connected&quot;, your setup works. Now do the practice
        PR.
      </p>
    </main>
  );
}
