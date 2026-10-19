import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import BookFormDialog from './BookFormDialog.jsx';
import PageTitle from '../../components/PageTitle.jsx';
import './stock.css';

const EMPTY_ADJUSTMENT = {
  condition: 'new',
  delta: '',
  reason: '',
};

function formatPickupWindow(window) {
  const start = new Date(window.start);
  const end = new Date(window.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Invalid pickup time';
  }

  const dateAndStart = start.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const endTime = end.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${dateAndStart} to ${endTime}`;
}

function groupStockByBook(items) {
  const books = new Map();

  for (const item of items) {
    const bookId = item.bookId;

    if (!books.has(bookId)) {
      books.set(bookId, {
        id: bookId,
        title: item.title,
        author: Array.isArray(item.authors) ? item.authors.join(', ') : '',
        status: item.status,
        new: null,
        used: null,
      });
    }

    const book = books.get(bookId);

    book[item.condition] = {
      id: item.id,
      total: item.total,
      available: item.available,
      held: item.held,
      pickupWindows: item.pickupWindows ?? [],
    };

    if (item.status !== 'active') {
      book.status = item.status;
    }
  }

  return Array.from(books.values());
}

function StockPage() {
  const [activeTab, setActiveTab] = useState('stock');
  const [stockItems, setStockItems] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickupsLoading, setPickupsLoading] = useState(false);
  const [collectingId, setCollectingId] = useState(null);
  const [search, setSearch] = useState('');
  const [adjustingBook, setAdjustingBook] = useState(null);
  const [adjustment, setAdjustment] = useState(EMPTY_ADJUSTMENT);
  const [error, setError] = useState('');
  const [pickupsError, setPickupsError] = useState('');
  const [bookForm, setBookForm] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupWindowForm, setPickupWindowForm] = useState({
    start: '',
    end: '',
  });
  const [pickupWindowBusy, setPickupWindowBusy] = useState(false);
  const [pickupWindowError, setPickupWindowError] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/inventory', {
        params: { limit: 100 },
      });

      setStockItems(groupStockByBook(response.items ?? []));
    } catch (err) {
      setError(err.message || 'Failed to load stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openPickupWindows = (book, condition) => {
    const inventory = book[condition];

    if (!inventory) {
      return;
    }

    setSelectedPickup({
      bookId: book.id,
      condition,
      inventoryId: inventory.id,
    });

    setPickupWindowForm({ start: '', end: '' });
    setPickupWindowError('');
  };

  const closePickupWindows = () => {
    setSelectedPickup(null);
    setPickupWindowForm({ start: '', end: '' });
    setPickupWindowError('');
  };

  const addPickupWindow = async (event) => {
    event.preventDefault();

    if (!selectedPickup) {
      return;
    }

    if (!pickupWindowForm.start || !pickupWindowForm.end) {
      setPickupWindowError('Please enter both start and end times.');
      return;
    }

    const start = new Date(pickupWindowForm.start);
    const end = new Date(pickupWindowForm.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setPickupWindowError('Please enter valid date and time values.');
      return;
    }

    if (end <= start) {
      setPickupWindowError('End time must be after start time.');
      return;
    }

    setPickupWindowBusy(true);
    setPickupWindowError('');

    try {
      await api.post(`/inventory/${selectedPickup.inventoryId}/pickup-windows`, {
        start: start.toISOString(),
        end: end.toISOString(),
      });

      setPickupWindowForm({ start: '', end: '' });
      await fetchStock();
    } catch (err) {
      setPickupWindowError(err.message || 'Failed to add pickup window.');
    } finally {
      setPickupWindowBusy(false);
    }
  };

  const removePickupWindow = async (windowId) => {
    if (!selectedPickup) {
      return;
    }

    setPickupWindowBusy(true);
    setPickupWindowError('');

    try {
      await api.delete(`/inventory/${selectedPickup.inventoryId}/pickup-windows/${windowId}`);

      await fetchStock();
    } catch (err) {
      setPickupWindowError(err.message || 'Failed to remove pickup window.');
    } finally {
      setPickupWindowBusy(false);
    }
  };

  const fetchPickups = async () => {
    setPickupsLoading(true);
    setPickupsError('');

    try {
      const response = await api.get('/reservations/held');
      setPickups(response.items ?? []);
    } catch (err) {
      setPickupsError(err.message || 'Failed to load held reservations. Please try again.');
    } finally {
      setPickupsLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (activeTab === 'pickups') {
      fetchPickups();
    }
  }, [activeTab]);

  const filteredStock = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return stockItems;
    }

    return stockItems.filter((book) => {
      const title = (book.title ?? '').toLowerCase();
      const authors = (book.author ?? '').toLowerCase();

      return title.includes(query) || authors.includes(query);
    });
  }, [search, stockItems]);

  const selectedPickupInventory = selectedPickup
    ? stockItems.find((book) => book.id === selectedPickup.bookId)?.[selectedPickup.condition]
    : null;

  const openAdjustDialog = (book) => {
    setAdjustingBook(book);
    setAdjustment(EMPTY_ADJUSTMENT);
    setError('');
  };

  const closeAdjustDialog = () => {
    setAdjustingBook(null);
    setAdjustment(EMPTY_ADJUSTMENT);
    setError('');
  };

  const handleAdjustment = async (event) => {
    event.preventDefault();

    const delta = Number(adjustment.delta);
    const reason = adjustment.reason.trim();
    const current = adjustingBook?.[adjustment.condition];

    if (!reason) {
      return setError('Reason is required.');
    }

    if (!Number.isInteger(delta) || delta === 0) {
      return setError('Amount must be a non-zero whole number.');
    }

    if (!current) {
      return setError('No inventory record exists for this condition.');
    }

    if (current.total + delta < current.held) {
      return setError("Total can't be lower than copies on hold.");
    }

    try {
      setError('');

      await api.patch(`/inventory/${current.id}`, {
        delta,
        reason,
      });

      closeAdjustDialog();
      await fetchStock();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock. Please try again.');
    }
  };

  const toggleAvailability = async (bookId) => {
    const book = stockItems.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    const nextStatus = book.status === 'active' ? 'unavailable' : 'active';

    try {
      setError('');

      const inventoryItems = [book.new, book.used].filter(Boolean);

      if (inventoryItems.length === 0) {
        setError('No inventory records exist for this book.');
        return;
      }

      for (const inventory of inventoryItems) {
        await api.patch(`/inventory/${inventory.id}`, {
          status: nextStatus,
          reason: 'Marked from the stockroom',
        });
      }

      await fetchStock();
    } catch (err) {
      setError(err.message || 'Could not update availability. Please try again.');
    }
  };

  const confirmCollection = async (reservationId) => {
    setCollectingId(reservationId);
    setPickupsError('');

    try {
      await api.patch(`/reservations/${reservationId}/collect`);

      await Promise.all([fetchPickups(), fetchStock()]);
    } catch (err) {
      setPickupsError(err.message || 'Could not confirm collection. Please try again.');
    } finally {
      setCollectingId(null);
    }
  };

  return (
    <main className="stock-page">
      <header className="stock-page__header">
        <div>
          <PageTitle number="08" label="Staff" title="Stockroom">
            Manage book inventory and reader pickups.
          </PageTitle>
        </div>

        <button
          type="button"
          className="stock-button stock-button--primary"
          onClick={() => setBookForm('new')}
        >
          Add a book
        </button>
      </header>

      <div className="stock-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stock'}
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          Stock
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pickups'}
          className={activeTab === 'pickups' ? 'active' : ''}
          onClick={() => setActiveTab('pickups')}
        >
          Pickups
        </button>
      </div>

      {activeTab === 'stock' && (
        <section className="stock-section">
          <div className="stock-toolbar">
            <div>
              <h2>Book inventory</h2>
              <p>
                {filteredStock.length} book
                {filteredStock.length === 1 ? '' : 's'} shown
              </p>
            </div>

            <label className="stock-search">
              <span>Search</span>
              <input
                type="search"
                placeholder="Search by title or author"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {error && <p className="stock-error">{error}</p>}

          {loading ? (
            <p className="stock-empty">Loading stock...</p>
          ) : (
            <div className="stock-table-wrapper">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th colSpan="3">New</th>
                    <th colSpan="3">Used</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                  <tr className="stock-table__subhead">
                    <th></th>
                    <th></th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Held</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Held</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="stock-empty">
                        No books found.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((book) => (
                      <tr key={book.id}>
                        <td className="stock-title">{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.new?.total ?? 0}</td>
                        <td>{book.new?.available ?? 0}</td>
                        <td>{book.new?.held ?? 0}</td>
                        <td>{book.used?.total ?? 0}</td>
                        <td>{book.used?.available ?? 0}</td>
                        <td>{book.used?.held ?? 0}</td>
                        <td>
                          <span className={`stock-status stock-status--${book.status}`}>
                            {book.status}
                          </span>
                        </td>
                        <td>
                          <div className="stock-actions">
                            <button
                              type="button"
                              className="stock-button stock-button--secondary"
                              onClick={() => openAdjustDialog(book)}
                            >
                              Adjust
                            </button>

                            <button
                              type="button"
                              className="stock-button stock-button--secondary"
                              onClick={() => setBookForm(book.id)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="stock-button stock-button--text"
                              onClick={() => toggleAvailability(book.id)}
                            >
                              {book.status === 'active' ? 'Mark unavailable' : 'Mark available'}
                            </button>

                            {book.new && (
                              <button
                                type="button"
                                className="stock-button stock-button--secondary"
                                onClick={() => openPickupWindows(book, 'new')}
                              >
                                Pickup times (New)
                              </button>
                            )}

                            {book.used && (
                              <button
                                type="button"
                                className="stock-button stock-button--secondary"
                                onClick={() => openPickupWindows(book, 'used')}
                              >
                                Pickup times (Used)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selectedPickup && (
        <div
          className="stock-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pickupWindowBusy) {
              closePickupWindows();
            }
          }}
        >
          <section
            className="stock-dialog pickup-window-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pickup-window-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="stock-dialog__header">
              <div>
                <p className="stock-page__eyebrow">Pickup times</p>
                <h2 id="pickup-window-title">
                  {stockItems.find((book) => book.id === selectedPickup.bookId)?.title ?? 'Book'} (
                  {selectedPickup.condition === 'new' ? 'New' : 'Used'})
                </h2>
              </div>

              <button
                type="button"
                className="stock-dialog__close"
                onClick={closePickupWindows}
                aria-label="Close pickup times"
                disabled={pickupWindowBusy}
              >
                ×
              </button>
            </div>

            {pickupWindowError && (
              <p className="stock-form-error" role="alert">
                {pickupWindowError}
              </p>
            )}

            <div className="pickup-window-list">
              <h3>Available pickup windows</h3>

              {!selectedPickupInventory ? (
                <p className="stock-empty">Loading pickup windows...</p>
              ) : selectedPickupInventory.pickupWindows.length === 0 ? (
                <p className="stock-empty">No pickup times added yet.</p>
              ) : (
                <ul>
                  {selectedPickupInventory.pickupWindows.map((window) => (
                    <li key={window.id} className="pickup-window-item">
                      <span>{formatPickupWindow(window)}</span>

                      <button
                        type="button"
                        className="stock-button stock-button--text"
                        aria-label={`Remove pickup window ${formatPickupWindow(window)}`}
                        disabled={pickupWindowBusy}
                        onClick={() => removePickupWindow(window.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={addPickupWindow} className="pickup-window-form">
              <h3>Add a pickup window</h3>

              <label>
                Start date and time
                <input
                  type="datetime-local"
                  value={pickupWindowForm.start}
                  onChange={(event) =>
                    setPickupWindowForm((current) => ({
                      ...current,
                      start: event.target.value,
                    }))
                  }
                  disabled={pickupWindowBusy}
                  required
                />
              </label>

              <label>
                End date and time
                <input
                  type="datetime-local"
                  value={pickupWindowForm.end}
                  onChange={(event) =>
                    setPickupWindowForm((current) => ({
                      ...current,
                      end: event.target.value,
                    }))
                  }
                  disabled={pickupWindowBusy}
                  required
                />
              </label>

              <div className="stock-dialog__actions">
                <button
                  type="button"
                  className="stock-button stock-button--secondary"
                  onClick={closePickupWindows}
                  disabled={pickupWindowBusy}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="stock-button stock-button--primary"
                  disabled={pickupWindowBusy}
                >
                  {pickupWindowBusy ? 'Saving...' : 'Add pickup time'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {activeTab === 'pickups' && (
        <section className="stock-section">
          <div className="stock-toolbar">
            <div>
              <h2>Held reservations</h2>
              <p>Confirm collection when a reader picks up their book.</p>
            </div>
          </div>

          {pickupsError && <p className="stock-error">{pickupsError}</p>}

          {pickupsLoading ? (
            <p className="stock-empty">Loading held reservations...</p>
          ) : (
            <div className="stock-table-wrapper">
              <table className="stock-table pickups-table">
                <thead>
                  <tr>
                    <th>Reader</th>
                    <th>Email</th>
                    <th>Title</th>
                    <th>Condition</th>
                    <th>Pickup expires</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pickups.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="stock-empty">
                        No held pickups remaining.
                      </td>
                    </tr>
                  ) : (
                    pickups.map((pickup) => (
                      <tr key={pickup.id}>
                        <td>{pickup.reader?.name ?? 'Unknown reader'}</td>
                        <td>{pickup.reader?.email ?? '-'}</td>
                        <td className="stock-title">{pickup.title}</td>
                        <td>{pickup.condition}</td>
                        <td>
                          {pickup.expiresAt ? new Date(pickup.expiresAt).toLocaleString() : '-'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="stock-button stock-button--primary"
                            disabled={collectingId !== null}
                            onClick={() => confirmCollection(pickup.id)}
                          >
                            {collectingId === pickup.id ? 'Confirming...' : 'Confirm collection'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {adjustingBook && (
        <div className="stock-dialog-backdrop" role="presentation" onMouseDown={closeAdjustDialog}>
          <div
            className="stock-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adjust-stock-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="stock-dialog__header">
              <div>
                <p className="stock-page__eyebrow">Adjust stock</p>
                <h2 id="adjust-stock-title">{adjustingBook.title}</h2>
              </div>

              <button
                type="button"
                className="stock-dialog__close"
                onClick={closeAdjustDialog}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdjustment}>
              <label>
                Condition
                <select
                  value={adjustment.condition}
                  onChange={(event) =>
                    setAdjustment((current) => ({
                      ...current,
                      condition: event.target.value,
                    }))
                  }
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  step="1"
                  placeholder="Example: +2 or -1"
                  value={adjustment.delta}
                  onChange={(event) =>
                    setAdjustment((current) => ({
                      ...current,
                      delta: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Reason <span aria-hidden="true">*</span>
                <textarea
                  rows="4"
                  placeholder="Why is the stock changing?"
                  value={adjustment.reason}
                  onChange={(event) =>
                    setAdjustment((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                />
              </label>

              {error && <p className="stock-form-error">{error}</p>}

              <div className="stock-dialog__actions">
                <button
                  type="button"
                  className="stock-button stock-button--secondary"
                  onClick={closeAdjustDialog}
                >
                  Cancel
                </button>

                <button type="submit" className="stock-button stock-button--primary">
                  Save adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bookForm && (
        <BookFormDialog
          bookId={bookForm === 'new' ? null : bookForm}
          onClose={() => setBookForm(null)}
          onSaved={() => {
            setBookForm(null);
            fetchStock();
          }}
        />
      )}
    </main>
  );
}

export default StockPage;
