import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client.js';
import { pickupMockResponse } from './stock.mock';
import './stock.css';

const EMPTY_ADJUSTMENT = {
  condition: 'new',
  delta: '',
  reason: '',
};
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
  const [pickups, setPickups] = useState(pickupMockResponse.items);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustingBook, setAdjustingBook] = useState(null);
  const [adjustment, setAdjustment] = useState(EMPTY_ADJUSTMENT);
  const [error, setError] = useState('');
  const fetchStock = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/inventory', { params: { limit: 100 } });
      setStockItems(groupStockByBook(response.items ?? []));
    } catch (err) {
      setError(err.message || 'Failed to load stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStock();
  }, []);

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

  const toggleAvailability = (bookId) => {
    setStockItems((currentItems) =>
      currentItems.map((book) =>
        book.id === bookId
          ? {
              ...book,
              status: book.status === 'active' ? 'unavailable' : 'active',
            }
          : book,
      ),
    );
  };

  const confirmCollection = (reservationId) => {
    const pickup = pickups.find((item) => item.id === reservationId);

    if (!pickup) {
      return;
    }

    setStockItems((currentItems) =>
      currentItems.map((book) => {
        if (book.id !== pickup.bookId) {
          return book;
        }

        const currentStock = book[pickup.condition];

        if (!currentStock || currentStock.held <= 0) {
          return book;
        }

        const newHeld = currentStock.held - 1;
        const newTotal = Math.max(0, currentStock.total - 1);

        return {
          ...book,
          [pickup.condition]: {
            ...currentStock,
            total: newTotal,
            held: newHeld,
            available: newTotal - newHeld,
          },
        };
      }),
    );

    setPickups((currentPickups) => currentPickups.filter((item) => item.id !== reservationId));
  };

  return (
    <main className="stock-page">
      <header className="stock-page__header">
        <div>
          <p className="stock-page__eyebrow">Staff</p>
          <h1>Stockroom</h1>
          <p className="stock-page__description">Manage book inventory and reader pickups.</p>
        </div>
      </header>

      <div className="stock-tabs" role="tablist">
        <button
          type="button"
          className={activeTab === 'stock' ? 'active' : ''}
          onClick={() => setActiveTab('stock')}
        >
          Stock
        </button>

        <button
          type="button"
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
                              className="stock-button stock-button--text"
                              onClick={() => toggleAvailability(book.id)}
                            >
                              {book.status === 'active' ? 'Mark unavailable' : 'Mark available'}
                            </button>
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

      {activeTab === 'pickups' && (
        <section className="stock-section">
          <div className="stock-toolbar">
            <div>
              <h2>Held reservations</h2>
              <p>Confirm collection when a reader picks up their book.</p>
            </div>
          </div>

          <div className="stock-table-wrapper">
            <table className="stock-table pickups-table">
              <thead>
                <tr>
                  <th>Reader</th>
                  <th>Title</th>
                  <th>Pickup Window</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {pickups.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="stock-empty">
                      No held pickups remaining.
                    </td>
                  </tr>
                ) : (
                  pickups.map((pickup) => (
                    <tr key={pickup.id}>
                      <td>{pickup.reader}</td>
                      <td className="stock-title">{pickup.title}</td>
                      <td>{pickup.pickupWindow}</td>
                      <td>
                        <button
                          type="button"
                          className="stock-button stock-button--primary"
                          onClick={() => confirmCollection(pickup.id)}
                        >
                          Confirm collection
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
    </main>
  );
}

export default StockPage;
