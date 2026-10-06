# client

- `app/`, `api/`, `components/` and the reader pages (auth, discovery, books, reading lists,
  reservations, settings, chat) - Member 9
- clubs, meetings, moderator, stock, admin and agent pages - Member 10

Vite forwards anything starting with `/api` to the server on port 4000, so you can call
`fetch('/api/...')` directly.
