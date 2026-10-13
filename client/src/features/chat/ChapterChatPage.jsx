
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import useMe from '../../app/useMe.js';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Spinner,
} from '../../components/index.js';
import {
  askChat,
  getMyBookmarks,
  setBookmark,
} from './chatApi.js';
import './chat.css';

export default function ChapterChatPage() {
  const [searchParams] = useSearchParams();
  const { user } = useMe();

  const initialBookId = searchParams.get('bookId') ?? '';

  const [tab, setTab] = useState('chapter');
  const [bookmarks, setBookmarks] = useState([]);
  const [bookTitles, setBookTitles] = useState({});
  const [bookId, setBookId] = useState(initialBookId);
  const [chapter, setChapter] = useState('');
  const [savedChapter, setSavedChapter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedBookmark = useMemo(
    () =>
      bookmarks.find(
        (item) => String(item.bookId) === String(bookId),
      ),
    [bookmarks, bookId],
  );

  // Load saved progress and book titles, including a book passed in the URL.
  useEffect(() => {
    let active = true;

    async function loadBooks() {
      try {
        const rows = await getMyBookmarks();
        if (!active) return;

        const list = Array.isArray(rows) ? rows : [];
        setBookmarks(list);

        const ids = [
          ...new Set(
            [...list.map((item) => item.bookId), initialBookId].filter(Boolean),
          ),
        ];

        const pairs = await Promise.all(
          ids.map(async (id) => {
            try {
              const book = await api.get(`/books/${id}`);
              return [
                String(id),
                book.title ?? book.book?.title ?? 'Book',
              ];
            } catch {
              return [String(id), 'Book'];
            }
          }),
        );

        if (active) {
          setBookTitles(Object.fromEntries(pairs));
        }
      } catch {
        if (active) {
          setBookmarks([]);
        }
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, [initialBookId]);

  // Keep the chapter input in sync with saved progress.
  useEffect(() => {
    if (selectedBookmark?.chapter != null) {
      setSavedChapter(selectedBookmark.chapter);
      setChapter(String(selectedBookmark.chapter));
    } else {
      setSavedChapter(null);
      setChapter('');
    }
  }, [selectedBookmark]);

  function switchTab(nextTab) {
    setTab(nextTab);
    setMessages([]);
    setConversationId(null);
    setError('');
  }

  async function handleSaveBookmark(event) {
    event.preventDefault();

    if (!bookId || !chapter || Number(chapter) < 1) {
      setError('Choose a book and enter a valid chapter number.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await setBookmark({
        bookId,
        chapter: Number(chapter),
      });

      setSavedChapter(Number(chapter));

      const updated = await getMyBookmarks();
      setBookmarks(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setError(err.message ?? 'Could not save your chapter progress.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();

    const question = message.trim();
    if (!question || loading) return;

    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
    ]);
    setMessage('');
    setLoading(true);
    setError('');

    try {
      const result = await askChat({
        message: question,
        ...(tab === 'chapter' && bookId ? { bookId } : {}),
        ...(conversationId ? { conversationId } : {}),
      });

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: result.answer ?? 'No answer was returned.',
          status: result.status,
          citations: result.citations ?? [],
        },
      ]);
    } catch (err) {
      setError(err.message ?? 'Unable to get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canAsk = tab === 'shop' || Boolean(bookId);

  return (
    <section className="chapter-chat page-stack">
      <header className="chat-heading">
        <p className="eyebrow">BOOKLORE · READER SPACE</p>
        <h1>Ask a little. Discover a lot.</h1>
        <p>
          Explore a book without spoilers, or ask our shop about reservations
          and store policies.
        </p>
      </header>

      <div className="chat-tabs" role="tablist" aria-label="Chat type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chapter'}
          className={tab === 'chapter' ? 'active' : ''}
          onClick={() => switchTab('chapter')}
        >
          Chapter Chat
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'shop'}
          className={tab === 'shop' ? 'active' : ''}
          onClick={() => switchTab('shop')}
        >
          Ask the Shop
        </button>
      </div>

      {tab === 'chapter' && (
        <Card title="Your reading progress">
          <form className="bookmark-form" onSubmit={handleSaveBookmark}>
            <div className="chat-book-select">
              <label htmlFor="chat-book">Choose a book</label>
              <select
                id="chat-book"
                value={bookId}
                onChange={(event) => {
                  setBookId(event.target.value);
                  setMessages([]);
                  setConversationId(null);
                  setError('');
                }}
              >
                <option value="">Select a book</option>
                {Object.entries(bookTitles).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="I'm on chapter"
              type="number"
              min="1"
              value={chapter}
              onChange={(event) => setChapter(event.target.value)}
              placeholder="e.g. 4"
              required
            />

            <Button type="submit" disabled={saving || !bookId}>
              {saving ? 'Saving…' : 'Save chapter'}
            </Button>
          </form>

          {savedChapter != null && (
            <p className="bookmark-success">
              <Badge tone="success">Saved</Badge>
              {' '}You're on chapter {savedChapter}.
            </p>
          )}
        </Card>
      )}

      {error && (
        <div className="chat-error" role="alert">
          <ErrorState message={error} />
        </div>
      )}

      <Card title={tab === 'chapter' ? 'Chapter Chat' : 'Ask the Shop'}>
        {tab === 'chapter' ? (
          <p className="chat-intro">
            Ask about characters, events, or themes up to your reading progress.
            We'll do our best to avoid spoilers.
          </p>
        ) : (
          <p className="chat-intro">
            Ask about reservations, pickup windows, availability, and store
            policies. You don't need to select a book.
          </p>
        )}

        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="chat-empty">
              <span className="chat-sparkle" aria-hidden="true">✳</span>
              <p>
                {tab === 'chapter'
                  ? 'What would you like to know about your book?'
                  : 'How can our bookshop help you today?'}
              </p>
            </div>
          )}

          {messages.map((item, index) => (
            <div
              className={`chat-message ${item.role}`}
              key={`${item.role}-${index}`}
            >
              <div className="chat-bubble">
                <span className="chat-speaker">
                  {item.role === 'user' ? 'You' : 'Booklore'}
                </span>
                <p>{item.text}</p>

                {item.status === 'needs_progress' && (
                  <p className="chat-muted">
                    Save your current chapter above so we can keep answers
                    within your reading progress.
                  </p>
                )}

                {item.status === 'not_in_sources' && (
                  <p className="chat-muted">
                    This answer couldn't be verified in the available sources.
                  </p>
                )}

                {item.citations?.length > 0 && (
                  <div className="chat-citations">
                    <strong>Sources</strong>
                    {item.citations.map((citation, citationIndex) => (
                      <span
                        key={`${citation.kind}-${citationIndex}`}
                      >
                        {citation.kind === 'excerpt'
                          ? `Chapter ${citation.chapter ?? '?'}${
                              citation.pageStart != null
                                ? `, pages ${citation.pageStart} to ${
                                    citation.pageEnd ?? citation.pageStart
                                  }`
                                : ''
                            }`
                          : citation.title ??
                            citation.documentTitle ??
                            'Store policy'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-bubble thinking">
                <Spinner />
                <span>Thinking…</span>
              </div>
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={handleAsk}>
          <Input
            label="Your question"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              tab === 'chapter'
                ? 'Ask about the story…'
                : 'How long do you hold a reserved book?'
            }
            disabled={loading || !canAsk}
            required
          />

          <Button
            type="submit"
            disabled={loading || !canAsk || !message.trim()}
          >
            {loading ? 'Thinking…' : 'Ask'}
          </Button>
        </form>

        {tab === 'chapter' && !bookId && (
          <p className="chat-muted">
            Open a book's detail page and click Ask Chapter Chat, or select a
            bookmarked book above.
          </p>
        )}

        <p className="chat-footnote">
          {user?.name
            ? `A quiet reading corner for ${user.name}.`
            : 'A quiet reading corner.'}{' '}
          No spoilers intended.
        </p>
      </Card>
    </section>
  );
}
