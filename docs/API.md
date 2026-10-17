# API Reference

All endpoints are mounted under `/api`.

## Authentication and response format

Successful JSON responses use this format:

```json
{
  "ok": true,

  "data": {}
}
```

Errors generally use this format:

```json
{
  "ok": false,

  "error": {
    "code": "FORBIDDEN",

    "message": "Forbidden",

    "details": null
  }
}
```

Common status codes include `200` (success), `201` (created), `400` (invalid request), `401` (authentication required), `403` (permission denied), `404` (not found), `409` (conflict), and `500` (server error).

### Sessions and CSRF

- Authenticated endpoints use a session established by login.

- Call `GET /api/auth/csrf` to obtain a CSRF token.

- Send the token in the `X-CSRF-Token` header for requests protected by CSRF.

- The session cookie is named `sid`.

- Some endpoints require a verified email or a specific role.

- Public endpoints do not require login middleware, but global security middleware may still apply.

## Alerts

| Method | Path | Who | What it does |

|---|---|---|---|

| POST | `/api/books/:id/alerts` | Verified user | Creates a book alert. |

| GET | `/api/alerts/mine` | Authenticated user | Lists the current user's alerts. |

| DELETE | `/api/alerts/:id` | Authenticated user | Deletes the user's alert, subject to ownership checks. |

Example response:

```json
{ "ok": true, "data": {} }
```

## Audit

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/admin/audit` | Admin | Lists audit records with pagination. |

Example response:

```json
{ "ok": true, "data": { "items": [] } }
```

## Authentication

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/auth/csrf` | Public | Generates a CSRF token. |

| POST | `/api/auth/login` | Public | Authenticates a user and starts a session. |

| POST | `/api/auth/logout` | Session holder | Ends the current session. |

| GET | `/api/auth/me` | Authenticated user | Returns the current user's information. |

| POST | `/api/auth/signup` | Public | Registers a user. |

| GET | `/api/auth/verify` | Public | Verifies an email using a token. |

| POST | `/api/auth/forgot` | Public | Requests a password reset. |

| POST | `/api/auth/reset` | Public | Resets a password using a token. |

Example response (`GET /api/auth/csrf`):

```json
{ "ok": true, "data": { "token": "<csrf-token>" } }
```

## Books

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/books` | Public | Lists books using query filters. |

| GET | `/api/books/:id` | Public | Gets a book by ID. |

| POST | `/api/books` | Bookseller or admin | Creates a book. |

| PATCH | `/api/books/:id` | Bookseller or admin | Updates a book. |

Example response:

```json
{ "ok": true, "data": { "items": [] } }
```

## Calendar

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/clubs/:id/meetings/:meetingId/calendar.ics` | Authenticated user | Downloads a club meeting calendar file. |

The response is an ICS attachment with content type `text/calendar; charset=utf-8`, rather than a JSON response.

Example body:

```text

BEGIN:VCALENDAR

...

END:VCALENDAR

```

## Catalog sources

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/admin/sources` | Admin | Lists catalog sources. |

| PATCH | `/api/admin/sources/:id` | Admin | Updates a catalog source's settings. |

Example response:

```json
{ "ok": true, "data": { "items": [] } }
```

## Clubs

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/clubs` | Public | Lists published clubs. |

| GET | `/api/clubs/:id` | Public | Gets a published club. |

| GET | `/api/clubs/:id/progress` | Authenticated user | Gets club reading progress. |

| GET | `/api/clubs/:id/pace` | Authenticated user | Gets club reading pace. |

| POST | `/api/clubs/:id/join` | Verified user | Joins a club. |

| DELETE | `/api/clubs/:id/membership` | Authenticated user | Leaves a club. |

| POST | `/api/clubs/:id/meetings` | Club moderator or admin | Creates a meeting. |

| GET | `/api/clubs/:id/members` | Club moderator or admin | Lists club members. |

| PATCH | `/api/clubs/:id` | Club moderator or admin | Updates club details. |

| DELETE | `/api/clubs/:id/members/:userId` | Club moderator or admin | Removes a club member. |

| GET | `/api/clubs/:id/excerpts` | Club moderator or admin | Lists excerpts by status. |

| PATCH | `/api/clubs/:id/excerpts/:excerptId` | Club moderator or admin | Updates excerpt approval. |

Example response:

```json
{ "ok": true, "data": {} }
```

## Conversations

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/conversations/mine` | Authenticated user | Lists the user's conversations. |

| GET | `/api/conversations/:id` | Authenticated user | Gets a conversation, subject to access checks. |

Example response:

```json
{ "ok": true, "data": {} }
```

## Inventory

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/inventory` | Bookseller or admin | Lists inventory. |

| PATCH | `/api/inventory/:id` | Bookseller or admin | Updates an inventory record. |

| PATCH | `/api/books/:id/stock` | Bookseller or admin | Updates book stock. |

| POST | `/api/inventory/:id/pickup-windows` | Bookseller or admin | Creates a pickup window. |

| DELETE | `/api/inventory/:id/pickup-windows/:pickupWindowId` | Bookseller or admin | Deletes a pickup window. |

Example response:

```json
{ "ok": true, "data": {} }
```

## Preferences

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/users/me/preferences` | Authenticated user | Gets the user's preferences. |

| PATCH | `/api/users/me/preferences` | Authenticated user | Updates supplied preference fields. |

Preference fields include genres, moods, maximum pages, spoiler settings, and bookmark visibility where supported by the request schema.

Example response:

```json
{ "ok": true, "data": { "genres": [], "moods": [], "maxPages": null } }
```

## Reading progress

| Method | Path | Who | What it does |

|---|---|---|---|

| PATCH | `/api/reading-progress` | Authenticated user | Creates or updates reading progress. |

| GET | `/api/reading-progress/mine` | Authenticated user | Lists the user's reading progress. |

| GET | `/api/reading-progress/:bookId` | Authenticated user | Gets progress for a book. |

Example response:

```json
{ "ok": true, "data": { "items": [] } }
```

## Reading lists

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/reading-lists` | Authenticated user | Lists the user's reading lists. |

| POST | `/api/reading-lists` | Authenticated user | Creates a reading list. |

| GET | `/api/reading-lists/:id/public` | Public | Gets a public reading list. |

| GET | `/api/reading-lists/:id` | Authenticated user | Gets a list, subject to access checks. |

| PATCH | `/api/reading-lists/:id` | Authenticated user | Updates a list, subject to access checks. |

| DELETE | `/api/reading-lists/:id` | Authenticated user | Deletes a list, subject to access checks. |

| POST | `/api/reading-lists/:id/items` | Authenticated user | Adds a book to a list, subject to access checks. |

| DELETE | `/api/reading-lists/:id/items/:bookId` | Authenticated user | Removes a book from a list, subject to access checks. |

Example response:

```json
{ "ok": true, "data": { "items": [] } }
```

## Reservations

| Method | Path | Who | What it does |

|---|---|---|---|

| POST | `/api/books/:id/reservations` | Verified user | Creates a reservation. |

| GET | `/api/reservations/mine` | Authenticated user | Lists the user's reservations. |

| GET | `/api/reservations/held` | Bookseller or admin | Lists reservations held for collection. |

| DELETE | `/api/reservations/:id` | Authenticated user | Cancels a reservation, subject to access checks. |

| PATCH | `/api/reservations/:id/collect` | Bookseller or admin | Marks a reservation as collected. |

| POST | `/api/reservations/:id/collection` **(brief)** | Bookseller or admin | Marks a reservation as collected using the route name specified in the project brief. |

Example response:

```json
{ "ok": true, "data": {} }
```

## Shop floor

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/staff/shop-floor` | Bookseller or admin | Retrieves the shop-floor staff view. |

Example response:

```json
{ "ok": true, "data": {} }
```

## Users

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/admin/users` | Admin | Lists users for administration. |

| PATCH | `/api/users/:id/staff-role` | Admin | Changes a user's staff role, subject to role-change restrictions. |

Example response:

```json
{ "ok": true, "data": { "items": [] } }
```

## AI endpoints

| Method | Path | Who | What it does |

|---|---|---|---|

| GET | `/api/books/discover` | Public | Discovers books using query filters. |

| GET | `/api/books/:id/similar` | Public | Finds books similar to a specified book. |

| POST | `/api/reading-agent` | Authenticated user | Starts a reading-agent session and streams Server-Sent Events (SSE). |

| POST | `/api/book-chat` | Authenticated user | Processes a book-chat request. |

| POST | `/api/clubs/:id/talking-points` | Club moderator or admin | Generates talking points for a club. |

Example response (`GET /api/books/discover`):

```json
{
  "ok": true,

  "data": {
    "items": [
      {
        "id": "<book-id>",

        "title": "<book-title>",

        "authors": [],

        "themes": [],

        "moods": [],

        "pageCount": 0,

        "synopsis": "",

        "score": 0,

        "why": "",

        "availability": {}
      }
    ]
  }
}
```

### Reading-agent streaming events

The reading-agent endpoint returns an SSE stream rather than a single JSON response. The stream may contain `tool`, `final`, or `error` events and has a 45
