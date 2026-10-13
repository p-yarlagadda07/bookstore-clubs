
import api from '../../api/client.js';

export async function setBookmark({ bookId, clubId, chapter }) {
  const response = await api.patch('/reading-progress', {
    bookId,
    clubId,
    chapter,
  });
  return response?.data?.items ?? response?.items ?? response?.data ?? response;
}

export async function getMyBookmarks() {
  const response = await api.get('/reading-progress/mine');
  return response?.items ?? response?.data?.items ?? response?.data ?? response;
}

export async function askChat({ message, bookId, clubId, conversationId }) {
  const response = await api.post('/book-chat', {
    message,
    ...(bookId ? { bookId } : {}),
    ...(clubId ? { clubId } : {}),
    ...(conversationId ? { conversationId } : {}),
  });
  return response?.data ?? response;
}
