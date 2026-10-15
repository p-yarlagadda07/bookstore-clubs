import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, EmptyState, PageTitle, Spinner } from '../../components/index.js';
import api from '../../api/client.js';
import './settings.css';

const THEMES = [
  'Mystery',
  'Books',
  'Science Fiction',
  'Space',
  'Programming',
  'Technology',
  'Environment',
  'Nature',
  'Crime',
  'Society',
  'Drama',
  'Self Development',
  'Wellness',
  'Adventure',
  'Travel',
  'Innovation',
  'Future',
];

const MOODS = [
  'Calm',
  'Curious',
  'Adventurous',
  'Exciting',
  'Motivational',
  'Focused',
  'Peaceful',
  'Thoughtful',
  'Suspenseful',
  'Dark',
  'Emotional',
  'Hopeful',
  'Creative',
  'Reflective',
  'Imaginative',
];

const DEFAULTS = {
  genres: [],
  moods: [],
  maxPages: '',
  spoilerStrict: false,
  bookmarkVisibility: 'club',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['myPreferences'],
    queryFn: () => api.get('/users/me/preferences'),
  });

  useEffect(() => {
    if (data) {
      setPreferences({
        ...DEFAULTS,
        ...data,
        genres: data.genres ?? [],
        moods: data.moods ?? [],
        maxPages: data.maxPages == null ? '' : String(data.maxPages),
        spoilerStrict: data.spoilerStrict ?? false,
        bookmarkVisibility: data.bookmarkVisibility ?? 'club',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (changes) => api.patch('/users/me/preferences', changes),
    onSuccess: (result) => {
      const updated = result ?? preferences;

      setPreferences((current) => ({
        ...current,
        ...updated,
        genres: updated.genres ?? current.genres,
        moods: updated.moods ?? current.moods,
        maxPages: updated.maxPages == null ? '' : String(updated.maxPages),
      }));

      queryClient.setQueryData(['myPreferences'], updated);
      setSaved(true);
      setMessage('Your preferences have been saved.');
    },
    onError: (err) => {
      setSaved(false);
      setMessage(err.message || 'Unable to save preferences. Please try again.');
    },
  });

  function toggleItem(field, item) {
    setPreferences((current) => ({
      ...current,
      [field]: current[field].includes(item)
        ? current[field].filter((value) => value !== item)
        : [...current[field], item],
    }));

    setSaved(false);
    setMessage('');
  }

  function savePreferences() {
    const changes = {};

    for (const field of Object.keys(DEFAULTS)) {
      const currentValue = preferences[field];
      const originalValue = data?.[field] ?? DEFAULTS[field];

      const normalizedCurrent =
        field === 'maxPages' && currentValue !== '' ? Number(currentValue) : currentValue;

      const normalizedOriginal =
        field === 'maxPages' && originalValue !== '' ? Number(originalValue) : originalValue;

      if (JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal)) {
        changes[field] = field === 'maxPages' && currentValue === '' ? null : normalizedCurrent;
      }
    }

    if (Object.keys(changes).length === 0) {
      setSaved(true);
      setMessage('Your preferences are already up to date.');
      return;
    }

    saveMutation.mutate(changes);
  }

  if (isLoading) {
    return <Spinner label="Loading your preferences..." />;
  }

  if (isError) {
    return (
      <main className="settings-page">
        <PageTitle number="11" label="You" title="Settings">
          Make Booklore feel more like your own.
        </PageTitle>
        <EmptyState
          title="Settings could not be loaded"
          message={error?.message || 'Please refresh the page and try again.'}
        />
      </main>
    );
  }

  return (
    <main className="settings-page">
      <PageTitle number="11" label="You" title="Settings">
        Choose the themes and reading preferences that suit you.
      </PageTitle>

      <Card className="settings-card">
        <section className="settings-section">
          <h2>Favourite themes</h2>
          <p>Choose the subjects you enjoy reading about.</p>
          <div className="settings-chips">
            {THEMES.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`settings-chip ${preferences.genres.includes(theme) ? 'selected' : ''}`}
                aria-pressed={preferences.genres.includes(theme)}
                onClick={() => toggleItem('genres', theme)}
              >
                {theme}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Reading moods</h2>
          <p>Pick the moods you want your recommendations to match.</p>
          <div className="settings-chips">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                className={`settings-chip ${preferences.moods.includes(mood) ? 'selected' : ''}`}
                aria-pressed={preferences.moods.includes(mood)}
                onClick={() => toggleItem('moods', mood)}
              >
                {mood}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <label htmlFor="settings-max-pages">
            <h2>Maximum page count</h2>
          </label>
          <p>Choose the maximum length you prefer for a book.</p>
          <select
            id="settings-max-pages"
            className="settings-select"
            value={preferences.maxPages}
            onChange={(event) => {
              setPreferences((current) => ({
                ...current,
                maxPages: event.target.value,
              }));
              setSaved(false);
              setMessage('');
            }}
          >
            <option value="">Any length</option>
            {[200, 250, 300, 350, 400].map((pages) => (
              <option key={pages} value={pages}>
                {pages} pages
              </option>
            ))}
          </select>
        </section>

        <section className="settings-section">
          <h2>Spoiler protection</h2>
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={preferences.spoilerStrict}
              onChange={(event) => {
                setPreferences((current) => ({
                  ...current,
                  spoilerStrict: event.target.checked,
                }));
                setSaved(false);
                setMessage('');
              }}
            />
            <span>Enable strict spoilers</span>
          </label>
          <p className="settings-help">Chapter Chat only uses chapters before the one you're on.</p>
        </section>

        <section className="settings-section">
          <h2>Bookmark visibility</h2>
          <p>Choose who can see your bookmarks.</p>
          <div className="settings-radio-group">
            {[
              ['private', 'Only me', 'Private'],
              ['club', 'My club', 'Visible to your club'],
              ['public', 'Everyone', 'Public'],
            ].map(([value, label, description]) => (
              <label className="settings-radio" key={value}>
                <input
                  type="radio"
                  name="bookmarkVisibility"
                  value={value}
                  checked={preferences.bookmarkVisibility === value}
                  onChange={() => {
                    setPreferences((current) => ({
                      ...current,
                      bookmarkVisibility: value,
                    }));
                    setSaved(false);
                    setMessage('');
                  }}
                />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="settings-actions">
          <Button onClick={savePreferences} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save preferences'}
          </Button>

          {saved && <Badge tone="success">Saved</Badge>}
        </div>

        {message && (
          <p className={`settings-message ${saveMutation.isError ? 'error' : ''}`} role="status">
            {message}
          </p>
        )}
      </Card>
    </main>
  );
}
