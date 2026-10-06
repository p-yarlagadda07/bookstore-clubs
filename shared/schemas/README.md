# Shared Zod schemas

One file per module. Each owner adds the request/response schemas for their routes here
(contract first - before writing the route), in a small PR that Member 1 reviews.

| File                                 | Owner    |
| ------------------------------------ | -------- |
| `common.js`                          | Member 1 |
| `auth.js`, `users.js`                | Member 2 |
| `books.js`, `inventory.js`           | Member 3 |
| `reservations.js`, `readingLists.js` | Member 4 |
| `clubs.js`, `progress.js`            | Member 5 |
| `discovery.js`                       | Member 6 |
| `bookChat.js`                        | Member 7 |
| `readingAgent.js`                    | Member 8 |

Import on the server or client with:

```js
import { CreateReservationBody } from '@bookstore/shared/schemas/reservations';
```

Record every breaking change in `docs/CONTRACT.md`.
