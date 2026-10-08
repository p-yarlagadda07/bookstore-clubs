import { useMemo } from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Input } from '../../components/index.js';
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
    [searchParams]
  );

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['books', params],
    queryFn: () => listBooks(params),
  });

  function updateParam(name, value) {
    const next = new URLSearchParams(searchParams);

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
    setSearchParams({});
  }

  const books = data?.books || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = params.page;

  return (
    <main className="books-page">
      <section className="books-header">
        <div>
          <h1>Book Catalog</h1>
          <p>
            Browse books and reserve an available copy.
          </p>
        </div>
      </section>

      <section className="book-filters">
        <Input
          label="Search"
          type="search"
          value={params.q}
          onChange={(event) =>
            updateParam('q', event.target.value)
          }
          placeholder="Search by title or author"
        />

        <label className="filter-field">
          <span>Theme</span>
          <select
            value={params.theme}
            onChange={(event) =>
              updateParam('theme', event.target.value)
            }
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
          <select
            value={params.mood}
            onChange={(event) =>
              updateParam('mood', event.target.value)
            }
          >
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
            onChange={(event) =>
              updateParam('maxPages', event.target.value)
            }
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
            onChange={(event) =>
              updateParam(
                'available',
                event.target.checked
              )
            }
          />
          <span>Available only</span>
        </label>

        <button
          type="button"
          className="clear-filters"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </section>

      {isLoading && (
        <div className="books-state">
          <p>Loading books...</p>
        </div>
      )}

      {isError && (
        <div className="books-state" role="alert">
          <p>
            {error?.message ||
              'Unable to load books. Please try again.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && books.length === 0 && (
        <div className="books-state">
          <h2>No books found</h2>
          <p>
            Try changing your search or filters.
          </p>
        </div>
      )}

      {!isLoading && !isError && books.length > 0 && (
        <>
          <section className="book-grid">
            {books.map((book) => (
              <Card
             key={book._id ?? book.id}
                className={
                  book.availability.label === 'Unavailable'
                    ? 'book-card book-card-unavailable'
                    : 'book-card'
                }
              >
                <div className="book-card-content">
                  <div className="book-card-top">
                    <Badge>
                      {book.availability.label}
                    </Badge>
                  </div>

                  <h2>{book.title}</h2>

                  <p className="book-authors">
                    By {book.authors.join(', ')}
                  </p>

                  <p className="book-pages">
                    {book.pageCount} pages
                  </p>

                  <div className="book-chips">
                    {book.themes.map((theme) => (
                      <span
                        className="book-chip"
                        key={theme}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>

                  <Link
                    className="book-view-link"
                    to={`/books/${book._id ?? book.id}`}
                  >
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
              onClick={() =>
                updateParam(
                  'page',
                  currentPage - 1
                )
              }
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                updateParam(
                  'page',
                  currentPage + 1
                )
              }
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}