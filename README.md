# Booklore

Capstone project 19: Independent Bookstore Discovery and Clubs.

Booklore is a web app for a small independent bookstore. Readers can find a book by describing what they
remember about it (a theme, a mood, a bit of the plot), see what's actually on the shelf, hold a copy for
pickup and join reading clubs. An AI chat talks about a book without spoiling anything past the chapter
you're on, and an agent helps a club pick its next book based on real stock and the club's reading pace.

Built with React (Vite), Node + Express, MongoDB Atlas with Atlas Vector Search, Mongoose, Zod, Ollama
and LangChain.js.

## What it does

**Readers**

- Smart Search: describe a half-remembered book and get matches, with a short line on why each one matched
- Catalog with filters (theme, mood, length, in stock), starting from the reader's saved preferences
- Book page with live stock (new, used, unavailable), reading time and Read-Alikes
- Hold a copy for a pickup time, see and cancel holds in My Holds
- Back in Stock alerts for sold-out books
- Shelves (reading lists), which can be shared with a public link
- Reading Circles: join or leave a club, see meetings, add a meeting to your calendar, see Club Pace
- Chapter Chat: ask about a book, answers only use approved excerpts up to your bookmark, with citations.
  Strict mode keeps it to chapters you've finished
- Ask the Shop: questions about store policies, answered from the store's own documents
- Settings: favourite themes and moods, longest book, strict spoilers, who sees your bookmark

**Booksellers**

- Shop Floor: today's holds, pickups, low stock and how many readers are waiting for a book
- Stockroom: add and edit books, adjust stock (every change is logged), pickup times, collect holds

**Club moderators**

- Host Desk: members, meetings, club rules, approving excerpts, Talking Points for a meeting
- Next Read: the agent searches the catalog, checks stock and length, compares with the club's schedule
  and gives a shortlist with evidence. The moderator picks the book, readers hold their own copies

**Admin**

- Staff: give or take away the bookseller role and club moderator rights
- Sources: approve or revoke where book data comes from (revoked books disappear everywhere)
- Logbook: every staff action

## Running it locally

You need Git, Node 20 or newer and [Ollama](https://ollama.com) for the AI parts.

```bash
git clone https://github.com/p-yarlagadda07/bookstore-clubs.git
cd bookstore-clubs
git checkout dev
npm install
cp .env.example .env
```

Open `.env` (in the main folder, not inside `server/`) and fill in `MONGODB_URI`. Never commit `.env`,
it's already in `.gitignore`.

Start Ollama and pull the two models:

```bash
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

Then load the test data and start everything:

```bash
npm run seed -- --reset
npm run dev
```

The server runs on port 4000 and the website on http://localhost:5173.

Smart Search needs the Atlas vector index. The definition is in `docs/indexes/books_vec.json`: in Atlas,
go to Search, create a Vector Search index on the `books` collection named `books_vec` and paste it in.
The seed already includes the book embeddings. If you change book data, run `npm run embed`.

The first AI request after starting Ollama can take a while because the model is loading. Ask one
question before a demo to warm it up.

### Test accounts

The password for all of them is `Password@123`.

| Account                   | Role                                                        |
| ------------------------- | ----------------------------------------------------------- |
| admin@bookstore.test      | Admin                                                       |
| bookseller@bookstore.test | Bookseller                                                  |
| moderator@bookstore.test  | Moderator of Tuesday Mystery Circle and Fantasy Friday Club |
| reader1@bookstore.test    | Reader, member of Tuesday Mystery Circle                    |
| reader2@bookstore.test    | Reader, member of Tuesday Mystery Circle                    |
| unverified@bookstore.test | Email not verified, can't hold or join                      |

## Useful commands

```bash
npm run dev               # start server and client
npm run seed -- --reset   # reset the database with test data
npm test                  # run all tests (uses a temporary database, not Atlas)
npm run lint              # eslint
npm run format            # prettier
npm run build             # build the website
```

## Docs

- [Security](docs/SECURITY.md): logins, sessions, CSRF, roles, audit log
- [API](docs/API.md): every route, who can use it and what it returns
- [Data model](docs/DATA_MODEL.md): the MongoDB collections
- [Smart Search and Read-Alikes](docs/AI_SEARCH.md)
- [Chapter Chat and Ask the Shop](docs/AI_CHAT.md)
- [Next Read agent and the demo scenario](docs/AI_AGENT.md)
- [Testing](docs/TESTING.md): how to run the tests and what they prove
- [Reader guide](docs/USER_GUIDE_READER.md) and [staff guide](docs/USER_GUIDE_STAFF.md), with screenshots
- `docs/01_Project_Documentation.pdf` and `docs/02_Work_Division_and_Integration_Plan.pdf`: the original plan

## Project structure

```
shared/            zod schemas used by both server and client
server/
  src/
    app.js         express setup
    routes.js      all module routers
    middleware/    auth, validation, errors
    modules/       one folder per feature (books, clubs, reservations, ...)
    ai/            smart search, book chat, reading agent, talking points
    jobs/          releasing expired holds
  scripts/         seed and embed scripts, seed data
  test/            test helpers
client/            react app
docs/              docs, index definitions, screenshots
```

Each module usually has `model.js`, `service.js`, `controller.js` and `routes.js`, with its tests next
to them. Responses go out as `{ ok: true, data }` and errors as `{ ok: false, error: { code, message } }`.

## How we worked

- Everything went into `dev` through pull requests, one task per branch. `main` is for stable versions.
- CI runs lint, a format check, the tests and the build on every pull request.
- Every PR was reviewed before merging.

## Team

| #   | Worked on                                 | Name                 | GitHub          |
| --- | ----------------------------------------- | -------------------- | --------------- |
| 1   | Team lead, setup, seed data, integration  | Poojitha Yarlagadda  | p-yarlagadda07  |
| 2   | Auth, sessions, roles, audit log          | Yasaswi Davuluri     | DavuluriYasaswi |
| 3   | Books, inventory, Shop Floor, preferences | Sowmya Sri           | S-0311-hub      |
| 4   | Reservations, reading lists, alerts       | Chinni Sri           | Chinnisri1134   |
| 5   | Clubs, meetings, reading progress         | Pranathi Vidiyala    | pr-an-a         |
| 6   | AI setup, Smart Search, catalog sources   | Lahari               | lahari040113    |
| 7   | Chapter Chat and Ask the Shop             | Shravani             | ShravaniCodes25 |
| 8   | Next Read agent, Talking Points           | Srilekha             | srilekha1311    |
| 9   | Frontend: reader pages                    | Kusuma Thriveni      | KusumaThriveni  |
| 10  | Frontend: clubs, staff and agent pages    | Pagadavarapu Nandini | nandu23008      |

## If something breaks

- `MONGODB_URI is missing`: the `.env` file should be in the main folder, not inside `server/`
- `bad auth : Authentication failed`: check the username and password in `MONGODB_URI`, there shouldn't
  be any `< >` left in it
- `AI_UNAVAILABLE`: Ollama isn't running. Open the Ollama app or run `ollama serve`
- Smart Search returns nothing: check the `books_vec` index exists in Atlas
- Port already in use: another terminal is probably running `npm run dev`
