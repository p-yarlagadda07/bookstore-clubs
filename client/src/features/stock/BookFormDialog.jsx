import { useEffect, useState } from 'react';
import { createBook, getBook, updateBook } from '../books/booksApi.js';

const EMPTY = {
  title: '',
  authors: '',
  isbn: '',
  pageCount: '',
  chapterCount: '',
  themes: '',
  moods: '',
  synopsis: '',
};

const splitList = (text) =>
  text
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

function toForm(book) {
  return {
    title: book.title ?? '',
    authors: (book.authors ?? []).join(', '),
    isbn: book.isbn ?? '',
    pageCount: book.pageCount ?? '',
    chapterCount: book.chapterCount ?? '',
    themes: (book.themes ?? []).join(', '),
    moods: (book.moods ?? []).join(', '),
    synopsis: book.synopsis ?? '',
  };
}

function toBody(form) {
  const body = {
    title: form.title.trim(),
    authors: splitList(form.authors),
    pageCount: Number(form.pageCount),
    themes: splitList(form.themes),
    moods: splitList(form.moods),
    synopsis: form.synopsis.trim(),
  };
  if (form.isbn.trim()) body.isbn = form.isbn.trim();
  if (form.chapterCount) body.chapterCount = Number(form.chapterCount);
  return body;
}

// bookId set means edit, otherwise add
function BookFormDialog({ bookId, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(Boolean(bookId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookId) return;
    getBook(bookId)
      .then((book) => setForm(toForm(book)))
      .catch((err) => setError(err.message || 'Could not load this book.'))
      .finally(() => setLoading(false));
  }, [bookId]);

  const change = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = toBody(form);

    if (!body.title) return setError('Title is required.');
    if (body.authors.length === 0) return setError('Add at least one author.');
    if (!Number.isInteger(body.pageCount) || body.pageCount < 1) {
      return setError('Pages must be a whole number.');
    }

    setSaving(true);
    setError('');
    try {
      if (bookId) await updateBook(bookId, body);
      else await createBook(body);
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save the book.');
      setSaving(false);
    }
  };

  return (
    <div className="stock-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="stock-dialog book-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="stock-dialog__header">
          <div>
            <p className="stock-page__eyebrow">{bookId ? 'Edit book' : 'New book'}</p>
            <h2 id="book-form-title">{bookId ? form.title || 'Edit book' : 'Add a book'}</h2>
          </div>
          <button
            type="button"
            className="stock-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <p className="stock-empty">Loading...</p>
        ) : (
          <form className="stock-form" onSubmit={handleSubmit}>
            <label>
              Title <span aria-hidden="true">*</span>
              <input value={form.title} onChange={change('title')} />
            </label>

            <label>
              Authors <span aria-hidden="true">*</span>
              <input
                placeholder="Separate with commas"
                value={form.authors}
                onChange={change('authors')}
              />
            </label>

            <div className="book-form__row">
              <label>
                Pages <span aria-hidden="true">*</span>
                <input
                  type="number"
                  min="1"
                  value={form.pageCount}
                  onChange={change('pageCount')}
                />
              </label>
              <label>
                Chapters
                <input
                  type="number"
                  min="1"
                  value={form.chapterCount}
                  onChange={change('chapterCount')}
                />
              </label>
              <label>
                ISBN
                <input value={form.isbn} onChange={change('isbn')} />
              </label>
            </div>

            <label>
              Themes
              <input
                placeholder="mystery, family"
                value={form.themes}
                onChange={change('themes')}
              />
            </label>

            <label>
              Moods
              <input placeholder="cosy, tense" value={form.moods} onChange={change('moods')} />
            </label>

            <label>
              Synopsis
              <textarea rows="4" value={form.synopsis} onChange={change('synopsis')} />
            </label>

            {error && <p className="stock-form-error">{error}</p>}

            <div className="stock-dialog__actions">
              <button
                type="button"
                className="stock-button stock-button--secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="stock-button stock-button--primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : bookId ? 'Save changes' : 'Add book'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default BookFormDialog;
