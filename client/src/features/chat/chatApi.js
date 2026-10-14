import api from '../../api/client.js';

export async function setBookmark({ bookId, clubId, chapter }) {
  return api.patch('/reading-progress', { bookId, clubId, chapter });
}

export async function getMyBookmarks() {
  return api.get('/reading-progress/mine');
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
