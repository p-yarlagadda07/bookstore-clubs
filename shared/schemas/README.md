# schemas

Zod schemas for request and response bodies. Both the server and the client import from here, so
the frontend and backend always agree on what the data looks like.

Add a file for your module (`books.js`, `clubs.js`, etc.) and put your schemas in it before you
write the route. Changes to this folder need a review from me since everyone depends on it.

```js
import { CreateReservationBody } from '@bookstore/shared/schemas/reservations';
```

If you change an existing schema in a way that could break someone else's code, add a line to
`docs/CONTRACT.md` and mention it in the group.
