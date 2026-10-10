import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Card } from '../../components/index.js';
import useMe from '../../app/useMe.js';
import api from '../../api/client.js';
import { getBook } from './booksApi.js';
import ReserveDialog from './ReserveDialog.jsx';
import './books.css';

export default function BookDetailPage() {
  const { id } = useParams();
  const { data: meData } = useMe();
  const queryClient = useQueryClient();

  const [showListPicker, setShowListPicker] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');
  const [listMessage, setListMessage] = useState('');

  const {
    data: book,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['book', id],
    queryFn: () => getBook(id),
    enabled: Boolean(id),
  });

  const { data: listsData, isError: listsError } = useQuery({
    queryKey: ['reading-lists'],
    queryFn: () => api.get('/reading-lists'),
    enabled: Boolean(meData?.user),
  });

  const lists = listsData?.items ?? [];

  const addToListMutation = useMutation({
    mutationFn: ({ listId, bookId }) => api.post(`/reading-lists/${listId}/items`, { bookId }),
    onSuccess: () => {
      setListMessage('Book added to your reading list!');
      setShowListPicker(false);
      setSelectedListId('');
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
    },
    onError: (err) => {
      setListMessage(err.message || 'Could not add this book to the reading list.');
    },
  });

  if (isLoading) {
    return (
      <main className="books-page">
        <div className="books-state">
          <p>Loading book...</p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="books-page">
        <div className="books-state" role="alert">
          <h1>Book not found</h1>
          <p>{error?.message || 'Unable to load this book.'}</p>
          <Link to="/books">Back to catalog</Link>
        </div>
      </main>
    );
  }

  if (!book) {
    return null;
  }

  const user = meData?.user;
  const isLoggedIn = Boolean(user);
  const isVerified = Boolean(user?.emailVerifiedAt);

  const hasAvailableCopy = book.inventory?.some(
    (item) => item.status === 'active' && item.available > 0,
  );

  return (
    <main className="books-page">
      <Link className="back-link" to="/books">
        ← Back to catalog
      </Link>

      <section className="book-detail">
        <Card>
          <div className="book-detail-content">
            <div className="book-detail-header">
              <div>
                <h1>{book.title}</h1>
                <p className="book-authors">By {book.authors?.join(', ') || 'Unknown author'}</p>
              </div>

              <Badge>{book.availability?.label || 'Availability unknown'}</Badge>
            </div>

            <div className="book-detail-info">
              {book.pageCount && (
                <p>
                  <strong>Pages:</strong> {book.pageCount}
                </p>
              )}
              {book.chapterCount && (
                <p>
                  <strong>Chapters:</strong> {book.chapterCount}
                </p>
              )}
            </div>

            <div className="book-section">
              <h2>Synopsis</h2>
              <p>{book.synopsis || 'No synopsis available.'}</p>
            </div>

            <div className="book-section">
              <h2>Themes</h2>
              <div className="book-chips">
                {(book.themes ?? []).map((theme) => (
                  <span className="book-chip" key={theme}>
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            <div className="book-section">
              <h2>Moods</h2>
              <div className="book-chips">
                {(book.moods ?? []).map((mood) => (
                  <span className="book-chip" key={mood}>
                    {mood}
                  </span>
                ))}
              </div>
            </div>

            <div className="book-section">
              <h2>Availability</h2>

              <div className="inventory-list">
                {(book.inventory ?? []).length === 0 && (
                  <div className="inventory-row unavailable-row">
                    <span>All copies</span>
                    <Badge>Unavailable</Badge>
                  </div>
                )}

                {(book.inventory ?? []).map((item) => (
                  <div
                    className={
                      item.available > 0 ? 'inventory-row' : 'inventory-row unavailable-row'
                    }
                    key={item._id ?? item.id}
                  >
                    <div>
                      <strong>{item.condition === 'new' ? 'New' : 'Used'}</strong>
                      <span className="inventory-count">
                        {item.available > 0 ? `${item.available} available` : 'Unavailable'}
                      </span>
                    </div>

                    {item.available > 0 ? (
                      <Badge>{item.available === 1 ? 'Few left' : 'Available'}</Badge>
                    ) : (
                      <Badge>Unavailable</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="book-section">
              <h2>Reading Lists</h2>

              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setListMessage('');
                      setShowListPicker(true);
                    }}
                  >
                    Add to reading list
                  </button>

                  {showListPicker && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();

                        if (!selectedListId) {
                          setListMessage('Please select a reading list.');
                          return;
                        }

                        addToListMutation.mutate({
                          listId: selectedListId,
                          bookId: book._id ?? book.id,
                        });
                      }}
                    >
                      <div>
                        <label htmlFor="reading-list-choice">Choose a reading list</label>

                        <select
                          id="reading-list-choice"
                          value={selectedListId}
                          onChange={(event) => setSelectedListId(event.target.value)}
                          required
                        >
                          <option value="">Select a list</option>
                          {lists.map((list) => (
                            <option key={list._id ?? list.id} value={list._id ?? list.id}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {listsError && (
                        <p role="alert">Could not load your reading lists. Please try again.</p>
                      )}

                      {!listsError && lists.length === 0 && (
                        <p>
                          You don't have a reading list yet.{' '}
                          <Link to="/lists">Create one here</Link>.
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={!selectedListId || addToListMutation.isPending}
                      >
                        {addToListMutation.isPending ? 'Adding...' : 'Add book'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowListPicker(false);
                          setListMessage('');
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  )}

                  {listMessage && <p role="status">{listMessage}</p>}
                </>
              ) : (
                <Link to="/login" state={{ from: `/books/${id}` }}>
                  Log in to add books to a reading list
                </Link>
              )}
            </div>
            <div className="reserve-area">
              {!hasAvailableCopy || !book.availability?.reservable ? (
                <Badge>Unavailable</Badge>
              ) : !isLoggedIn ? (
                <Link className="reserve-link" to="/login" state={{ from: `/books/${id}` }}>
                  Log in to reserve
                </Link>
              ) : !isVerified ? (
                <p className="verify-message">Verify your email to reserve</p>
              ) : (
                <ReserveDialog book={book} />
              )}
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
