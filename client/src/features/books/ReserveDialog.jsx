import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Dialog } from '../../components/index.js';
import { reserveBook } from './booksApi.js';

function formatPickupWindow(window) {
  const start = new Date(window.start);
  const end = new Date(window.end);

  const date = start.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const startTime = start.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTime = end.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${date}, ${startTime}-${endTime}`;
}

export default function ReserveDialog({ book }) {
  const queryClient = useQueryClient();
  const bookId = book._id ?? book.id;

  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState('');
  const [pickupWindowId, setPickupWindowId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableInventory = book.inventory.filter(
    (item) => item.status === 'active' && item.available > 0,
  );

  const selectedInventory = availableInventory.find((item) => item.condition === condition);

  const pickupWindows = selectedInventory?.pickupWindows || [];

  function handleOpen() {
    setOpen(true);
    setCondition('');
    setPickupWindowId('');
    setError('');
    setSuccess(false);
  }

  function handleClose() {
    if (!sending) {
      setOpen(false);
    }
  }

  function handleConditionChange(value) {
    setCondition(value);
    setPickupWindowId('');
    setError('');
  }

  async function handleConfirm() {
    if (!condition || !pickupWindowId) {
      return;
    }

    setSending(true);
    setError('');

    try {
      await reserveBook(bookId, {
        condition,
        pickupWindowId,
      });

      setSuccess(true);

      await queryClient.invalidateQueries({
        queryKey: ['book', bookId],
      });
    } catch (err) {
      if (err?.code === 'OUT_OF_STOCK' || err?.status === 409) {
        setError('Sorry, this copy was just taken.');

        await queryClient.invalidateQueries({
          queryKey: ['book', bookId],
        });
      } else if (err?.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email to reserve books.');
      } else {
        setError(err?.message || 'Unable to reserve this copy. Please try again.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button type="button" data-testid="reserve-btn" onClick={handleOpen}>
        Reserve a copy
      </Button>

      <Dialog open={open} onClose={handleClose} title={`Reserve "${book.title}"`}>
        {success ? (
          <div className="reserve-success">
            <p>Reserved! Pick it up in your window.</p>

            <Link to="/reservations">Go to reservations</Link>

            <Button type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="reserve-dialog">
            <div className="reserve-step">
              <h3>1. Choose condition</h3>

              <div className="radio-list">
                {availableInventory.map((item) => (
                  <label className="radio-option" key={item._id ?? item.id}>
                    <input
                      type="radio"
                      name="condition"
                      value={item.condition}
                      checked={condition === item.condition}
                      onChange={(event) => handleConditionChange(event.target.value)}
                    />

                    <span>
                      {item.condition === 'new' ? 'New' : 'Used'} - {item.available} available
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="reserve-step">
              <h3>2. Choose pickup window</h3>

              {!condition ? (
                <p className="reserve-hint">Choose a condition first.</p>
              ) : pickupWindows.length === 0 ? (
                <p className="reserve-hint">No pickup windows available.</p>
              ) : (
                <div className="radio-list">
                  {pickupWindows.map((window) => (
                    <label className="radio-option" key={window._id}>
                      <input
                        type="radio"
                        name="pickupWindow"
                        value={window._id}
                        checked={pickupWindowId === window._id}
                        onChange={(event) => setPickupWindowId(event.target.value)}
                      />

                      <span>{formatPickupWindow(window)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="reserve-actions">
              <Button type="button" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!condition || !pickupWindowId || sending}
              >
                {sending ? 'Reserving...' : 'Confirm reservation'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
