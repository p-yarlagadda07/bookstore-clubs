# bookstore-clubs

Capstone project 19: Independent Bookstore Discovery and Clubs.

It's a web app for a small independent bookstore. Readers can search for books by describing what they
remember (a theme, a mood, a bit of the plot), check what's actually in stock, reserve a copy for pickup
and join reading clubs. There's an AI chat that can talk about a book without spoiling anything past the
chapter you're on, and an agent that helps a club pick its next book.

Built with React (Vite), Node + Express, MongoDB Atlas (with vector search), Mongoose, Zod, Ollama and LangChain.js.


## Team

| #   | Working on                              | Name                 | GitHub          |
| --- | --------------------------------------- | -------------------- | --------------- |
| 1   | Setup, shared code, integration         | Poojitha Yarlagadda  | p-yarlagadda07  |
| 2   | Auth, sessions, roles                   | Yasaswi Davuluri     | DavuluriYasaswi |
| 3   | Books and inventory                     | Sowmya Sri           | S-0311-hub      |
| 4   | Reservations and reading lists          | Chinni Sri           | Chinnisri1134   |
| 5   | Clubs, meetings, reading progress       | Pranathi Vidiyala    | pr-an-a         |
| 6   | AI setup and book search                | Lahari               | lahari040113    |
| 7   | Book chat (no spoilers)                 | Shravani             | ShravaniCodes25 |
| 8   | Reading agent                           | Srilekha             | srilekha1311    |
| 9   | Frontend - reader pages                 | Kusuma Thriveni      | KusumaThriveni  |
| 10  | Frontend - clubs, staff and agent pages | Pagadavarapu Nandini | nandu23008      |

## Running it locally
**Running the AI parts**
Install Ollama from ollama.com and open it. Then run `ollama pull nomic-embed-text` and `ollama pull llama3.2:3b` (the default chat model). Don't use `llama3.1:8b`, it's too heavy for most laptops. If an AI route returns `AI_UNAVAILABLE`, Ollama isn't running. Open the Ollama app or run `ollama serve`.

You need Git and Node 20 or newer. If you're working on the AI parts you'll also need
[Ollama](https://ollama.com).

```bash
git clone https://github.com/p-yarlagadda07/bookstore-clubs.git
cd bookstore-clubs
git checkout dev
npm install
cp .env.example .env
```

Open `.env` and paste in the `MONGODB_URI` I sent you on WhatsApp. Don't share it anywhere else and
don't commit the `.env` file (it's already in `.gitignore`).

```bash
npm run seed -- --reset
npm run dev
```

The server runs on port 4000 and the frontend on 5173. Open http://localhost:5173 - if it says
"API ok, database connected" you're good to go.

The seed creates a few test accounts. The password for all of them is `Password@123`:

- admin@bookstore.test
- bookseller@bookstore.test
- moderator@bookstore.test
- reader1@bookstore.test
- reader2@bookstore.test
- unverified@bookstore.test (email not verified, useful for testing)

## First thing to do

Add your name and GitHub username to the team table above and open a PR for it. It's just to make sure
everyone's git setup works before we start on real code.

```bash
git checkout dev
git pull origin dev
git checkout -b docs/add-yourname
# edit README.md and fill in your row
git add README.md
git commit -m "docs: add my name to team table"
git push -u origin docs/add-yourname
```

Then open a pull request into `dev` on GitHub and ask someone to review it.

If you get a merge conflict on the README (because someone else's PR got merged first), just pull dev
into your branch, keep both rows, commit and push again.

## How we're working

- `main` is for stable versions only. Everything goes into `dev` first.
- You can't push to `main` or `dev` directly, so always make a branch and open a PR.
- One task = one branch = one PR. Keep PRs small.
- Branch names: `feat/books-filters`, `fix/chat-citations`, `docs/...`, `test/...`
- Commit messages: `feat(books): add filters to GET /books`
- Before opening a PR, merge the latest dev into your branch and run `npm run lint` and `npm test`.
- Every PR needs one approval and the CI check has to pass.
- Try to only change files in your own folders. If you need to change something in `shared/`,
  `server/src/app.js`, `server/src/routes.js`, `package.json` or the seed script, make a separate
  small PR and tag me.

Normal flow for a task:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-task
# work on it, commit as you go
git fetch origin
git merge origin/dev
npm run lint
npm test
git push -u origin feat/your-task
```

## Project structure

```
shared/            zod schemas and constants used by both server and client
server/
  src/
    app.js         express setup
    routes.js      all the module routers are already added here
    middleware/    auth, validation, error handling
    modules/       one folder per feature (books, clubs, reservations, ...)
    ai/            discovery, book chat, reading agent
    jobs/          background jobs
  scripts/seed.js  test data
  test/            tests
client/            react app
docs/              project pdfs and notes
```

Each module has its own folder. The usual pattern is `model.js`, `service.js`, `controller.js` and
`routes.js`, with tests next to them. Your router is already connected in `routes.js`, so you don't
need to touch `app.js`. Just add your routes with the full path, for example:

```js
router.get('/books', asyncHandler(ctrl.list));
```

Send responses with `res.ok(data)`. For errors, throw an `AppError`, e.g.
`throw new AppError('OUT_OF_STOCK', 409, 'No copy available')`. The error handler takes care of the rest.

## Useful commands

```bash
npm run dev               # start server and client
npm run seed -- --reset   # reset the database with test data
npm test                  # run tests
npm run lint              # check code style
npm run format            # format code with prettier
```

## If something breaks

- `MONGODB_URI is missing` - the `.env` file should be in the main folder, not inside `server/`
- `bad auth : Authentication failed` - check the username and password in your `MONGODB_URI`, there
  shouldn't be any `< >` left in it
- Port already in use - you probably have another terminal running `npm run dev`


