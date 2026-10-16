import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Input, PageTitle, Spinner } from '../../components/index.js';
import useMe from '../../app/useMe.js';
import api from '../../api/client.js';
import { stockTone } from './stockTone.js';
import { spineColor } from './spine.js';
import { listBooks } from './booksApi.js';
import './books.css';

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

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [preferencesCleared, setPreferencesCleared] = useState(false);
  const { user } = useMe();

  const { data: preferences } = useQuery({
    queryKey: ['myPreferences'],
    queryFn: () => api.get('/users/me/preferences'),
    enabled: Boolean(user),
    retry: false,
  });

  const params = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      theme: searchParams.get('theme') || '',
      mood: searchParams.get('mood') || '',
      maxPages: searchParams.get('maxPages') || '',
      available: searchParams.get('available') === 'true',
      page: Number(searchParams.get('page') || 1),
      limit: 6,
    }),
    [searchParams],
  );

  const fromSettings = searchParams.get('fromSettings') === 'true';

  useEffect(() => {
    if (!user || !preferences || preferencesCleared) return;

    const filterKeys = ['q', 'theme', 'mood', 'maxPages', 'available'];
    const hasUrlFilters = filterKeys.some((key) => searchParams.has(key));

    if (hasUrlFilters) return;

    const next = new URLSearchParams(searchParams);
    let appliedPreferences = false;

    const preferredTheme = preferences.genres?.find((genre) => THEMES.includes(genre));
    const preferredMood = preferences.moods?.find((mood) => MOODS.includes(mood));

    if (preferredTheme) {
      next.set('theme', preferredTheme);
      appliedPreferences = true;
    }

    if (preferredMood) {
      next.set('mood', preferredMood);
      appliedPreferences = true;
    }

    if (preferences.maxPages != null && preferences.maxPages !== '') {
      next.set('maxPages', String(preferences.maxPages));
      appliedPreferences = true;
    }

    if (appliedPreferences) {
      next.delete('page');
      next.set('fromSettings', 'true');
      setSearchParams(next, { replace: true });
    }
  }, [user, preferences, preferencesCleared, searchParams, setSearchParams]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['books', params],
    queryFn: () => listBooks(params),
  });

  function updateParam(name, value) {
    setPreferencesCleared(true);

    const next = new URLSearchParams(searchParams);
    next.delete('fromSettings');

    if (value === '' || value === false) {
      next.delete(name);
    } else {
      next.set(name, String(value));
    }

    if (name !== 'page') {
      next.delete('page');
    }

    setSearchParams(next);
  }

  function clearFilters() {
    setPreferencesCleared(true);
    setSearchParams({});
  }

  const books = data?.books || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = params.page;

  return (
    <main className="books-page">
      <PageTitle number="02" label="The shelves" title="Catalog">
        Browse everything we stock and hold a copy for pickup.
      </PageTitle>

      {fromSettings && (
        <p className="preferences-note">
          From your settings{' '}
          <button type="button" className="clear-filters" onClick={clearFilters}>
            Clear
          </button>
        </p>
      )}

      <section className="book-filters">
        <Input
          label="Search"
          type="search"
          value={params.q}
          onChange={(event) => updateParam('q', event.target.value)}
          placeholder="Search by title or author"
        />

        <label className="filter-field">
          <span>Theme</span>
          <select
            value={params.theme}
            onChange={(event) => updateParam('theme', event.target.value)}
          >
            <option value="">All themes</option>
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Mood</span>
          <select value={params.mood} onChange={(event) => updateParam('mood', event.target.value)}>
            <option value="">All moods</option>
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Maximum pages</span>
          <select
            value={params.maxPages}
            onChange={(event) => updateParam('maxPages', event.target.value)}
          >
            <option value="">Any length</option>
            <option value="200">200 pages</option>
            <option value="250">250 pages</option>
            <option value="300">300 pages</option>
            <option value="350">350 pages</option>
            <option value="400">400 pages</option>
          </select>
        </label>

        <label className="available-filter">
          <input
            type="checkbox"
            checked={params.available}
            onChange={(event) => updateParam('available', event.target.checked)}
          />
          <span>Available only</span>
        </label>

        <button type="button" className="clear-filters" onClick={clearFilters}>
          Clear filters
        </button>
      </section>

      {isLoading && <Spinner label="Printing the shelf..." />}

      {isError && (
        <div className="books-state" role="alert">
          <p>{error?.message || 'Unable to load books. Please try again.'}</p>
        </div>
      )}

      {!isLoading && !isError && books.length === 0 && (
        <EmptyState title="No books found" message="Try fewer filters or a different search.">
          <button type="button" className="clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        </EmptyState>
      )}

      {!isLoading && !isError && books.length > 0 && (
        <>
          <section className="book-grid">
            {books.map((book) => (
              <Card
                key={book._id ?? book.id}
                style={{ '--spine': spineColor(book.title) }}
                className={
                  book.availability?.label === 'Unavailable'
                    ? 'book-card card-hover spine book-card-unavailable'
                    : 'book-card card-hover spine'
                }
              >
                <div className="book-card-content">
                  <div className="book-card-top">
                    <Badge tone={stockTone(book.availability?.label)}>
                      {book.availability?.label}
                    </Badge>
                  </div>

                  <h2>{book.title}</h2>
                  <p className="book-authors">By {book.authors.join(', ')}</p>
                  <p className="book-pages">{book.pageCount} pages</p>

                  <div className="book-chips">
                    {book.themes.map((theme) => (
                      <span className="book-chip" key={theme}>
                        {theme}
                      </span>
                    ))}
                  </div>

                  <Link className="book-view-link" to={`/books/${book._id ?? book.id}`}>
                    View book
                  </Link>
                </div>
              </Card>
            ))}
          </section>

          <nav className="pagination" aria-label="Book pages">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => updateParam('page', currentPage - 1)}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => updateParam('page', currentPage + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
