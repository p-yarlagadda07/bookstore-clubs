import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from '../../components/index.js';
import { getEarlierChats, getConversation } from './chatApi.js';

export default function EarlierChats({ onOpen, refreshKey = 0 }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadChats() {
      setLoading(true);
      setError('');

      try {
        const result = await getEarlierChats();
        const items = Array.isArray(result.items) ? result.items : [];

        items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        if (active) {
          setChats(items.slice(0, 20));
        }
      } catch (err) {
        if (active) {
          setError(err.message ?? 'Could not load earlier chats.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadChats();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function handleOpen(chat) {
    setOpeningId(chat.id);
    setError('');

    try {
      const conversation = await getConversation(chat.id);
      await onOpen(conversation);
    } catch (err) {
      setError(err.message ?? 'Could not open this conversation.');
    } finally {
      setOpeningId(null);
    }
  }

  if (!loading && chats.length === 0 && !error) {
    return null;
  }

  return (
    <Card title="Earlier chats">
      {loading && <Spinner />}

      {error && (
        <p className="chat-muted" role="alert">
          {error}
        </p>
      )}

      {!loading &&
        chats.map((chat) => (
          <div className="earlier-chat-item" key={chat.id}>
            <div>
              <p>{chat.lastMessage || 'Previous conversation'}</p>
              <small>
                {chat.updatedAt ? new Date(chat.updatedAt).toLocaleString() : 'Date unavailable'}
              </small>
              <small>{chat.kind === 'shop' ? 'Ask the Shop' : 'Chapter Chat'}</small>
            </div>

            <Button type="button" disabled={openingId !== null} onClick={() => handleOpen(chat)}>
              {openingId === chat.id ? 'Opening...' : 'Open chat'}
            </Button>
          </div>
        ))}
    </Card>
  );
}
