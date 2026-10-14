import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  PageTitle,
  Spinner,
} from '../../components/index.js';
import {
  askChat,
  getMyBookmarks,
  setBookmark,
} from './chatApi.js';
import EarlierChats from './EarlierChats.jsx';

export default function ChapterChatPage() {
  const [searchParams] = useSearchParams();
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
  const [chatRefreshKey, setChatRefreshKey] = useState(0);

  const selectedBookmark = useMemo(
    () => bookmarks.find((item) => String(item.bookId) === String(bookId)),
    [bookmarks, bookId],
  );

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      try {
        const [bookmarkResult, booksResult] = await Promise.all([
          getMyBookmarks(),
          api.get('/books'),
        ]);

        if (!active) return;

        const bookmarkList = Array.isArray(bookmarkResult)
          ? bookmarkResult
          : Array.isArray(bookmarkResult?.items)
            ? bookmarkResult.items
            : [];

        const books = Array.isArray(booksResult?.items)
          ? booksResult.items
          : [];

        setBookmarks(bookmarkList);

        const titles = Object.fromEntries(
          books.map((book) => [
            String(book._id ?? book.id),
            book.title ?? 'Book',
          ]),
        );

        setBookTitles(titles);

        const availableIds = new Set(Object.keys(titles));

        if (initialBookId && availableIds.has(String(initialBookId))) {
          setBookId(String(initialBookId));
        }
      } catch (err) {
        if (active) {
          setBookmarks([]);
          setBookTitles({});
          setError(err.message ?? 'Could not load books.');
        }
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, [initialBookId]);

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

      setBookmarks(
        Array.isArray(updated)
          ? updated
          : Array.isArray(updated?.items)
            ? updated.items
            : [],
      );
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

      setChatRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message ?? 'Unable to get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(conversation) {
    setTab(conversation.kind === 'shop' ? 'shop' : 'chapter');
    setBookId(conversation.bookId ?? '');
    setMessages(conversation.messages ?? []);
    setConversationId(conversation.id);
    setMessage('');
    setError('');
  }

  const canAsk = tab === 'shop' || Boolean(bookId);

  return (
    <section className="chapter-chat page-stack">
      <PageTitle number="06" label="Spoiler-safe" title="Chapter Chat">
        Ask about the book up to the chapter you're on, or ask the shop anything.
      </PageTitle>

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

      <EarlierChats
        onOpen={openConversation}
        refreshKey={chatRefreshKey}
      />

      {tab === 'chapter' && (
        <Card title="Your reading progress">
          <form className="reading-progress-form" onSubmit={handleSaveBookmark}>
            <label>
              Choose a book
              <select
                value={bookId}
                onChange={(event) => setBookId(event.target.value)}
              >
                <option value="">Select a book</option>

                {Object.entries(bookTitles)
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([id, title]) => (
                    <option key={id} value={id}>
                      {title}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              I'm on chapter
              <Input
                type="number"
                min="1"
                value={chapter}
                onChange={(event) => setChapter(event.target.value)}
                placeholder="e.g. 4"
              />
            </label>

            <Button
              type="submit"
              disabled={saving || !bookId || !chapter || Number(chapter) < 1}
            >
              {saving ? 'Saving...' : 'Save chapter'}
            </Button>
          </form>

          {savedChapter != null && (
            <p className="chat-muted">
              Saved progress: chapter {savedChapter}
            </p>
          )}
        </Card>
      )}

      <Card title={tab === 'shop' ? 'Ask the Shop' : 'Chapter Chat'}>
        <p className="chat-muted">
          {tab === 'shop'
            ? 'Ask questions about books, stock, and the shop.'
            : "Ask about characters, events, or themes up to your reading progress. We'll do our best to avoid spoilers."}
        </p>

        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 && (
            <p className="chat-empty">
              {tab === 'shop'
                ? 'What would you like to know about the shop?'
                : 'What would you like to know about your book?'}
            </p>
          )}

          {messages.map((item, index) => (
            <div
              className={`chat-message ${item.role === 'user' ? 'user' : 'assistant'}`}
              key={`${conversationId ?? 'new'}-${index}`}
            >
              <strong>
                {item.role === 'user' ? 'You' : 'Booklore'}
              </strong>

              <p>{item.text}</p>

              {item.status && (
                <Badge>{item.status.replaceAll('_', ' ')}</Badge>
              )}

              {item.citations?.length > 0 && (
                <div className="chat-citations">
                  <strong>Sources</strong>
                  {item.citations.map((citation, citationIndex) => (
                    <p key={citation.id ?? citationIndex}>
                      {citation.title ??
                        citation.text ??
                        `Source ${citationIndex + 1}`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && <Spinner />}
        </div>

        {error && (
          <ErrorState
            title="Something went wrong"
            message={error}
          />
        )}

        <form className="chat-composer" onSubmit={handleAsk}>
          <label>
            Your question
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                tab === 'shop'
                  ? 'Ask about books or the shop...'
                  : 'Ask about the story...'
              }
            />
          </label>

          <Button type="submit" disabled={!canAsk || loading || !message.trim()}>
            {loading ? 'Asking...' : 'Ask'}
          </Button>
        </form>
      </Card>
    </section>
  );
}