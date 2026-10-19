import api from '../../api/client.js';

export async function setBookmark({ bookId, clubId, chapter, visibility }) {
  return api.patch('/reading-progress', { bookId, clubId, chapter, visibility });
}

// the API answers { items: [...] }
export async function getMyBookmarks() {
  const data = await api.get('/reading-progress/mine');
  return data?.items ?? [];
}

export async function askChat({ message, bookId, clubId, conversationId }) {
  return api.post('/book-chat', { message, bookId, clubId, conversationId });
}

export async function getEarlierChats() {
  return api.get('/conversations/mine');
}

export async function getConversation(id) {
  return api.get(`/conversations/${id}`);
}
