# Independent Bookstore Discovery and Clubs

Project 19 — AI Powered Full Stack Capstone.
An online catalog and reading-club portal for an independent bookstore: semantic book discovery,
real stock and reservations, moderated clubs, spoiler-aware AI chat and a reading agent.

**Stack:** React (Vite) · Node.js + Express · MongoDB Atlas + Mongoose + Atlas Vector Search · Ollama · LangChain JS · Zod

📘 Read first: [`docs/01_Project_Documentation.pdf`](docs/01_Project_Documentation.pdf) and
[`docs/02_Work_Division_and_Integration_Plan.pdf`](docs/02_Work_Division_and_Integration_Plan.pdf)
(find **your own member section** in Document 02).

---

## Team

<!-- Practice PR: add your name and GitHub username to your row -->

| #   | Role                                        | Name | GitHub |
| --- | ------------------------------------------- | ---- | ------ |
| 1   | Architecture, contracts and integration     |      |        |
| 2   | Authentication, sessions, roles and audit   |      |        |
| 3   | Catalog and inventory API                   |      |        |
| 4   | Reservations and reading lists API          |      |        |
| 5   | Clubs, meetings and reading progress API    |      |        |
| 6   | AI foundations and semantic discovery       |      |        |
| 7   | Spoiler-aware RAG (book chat)               |      |        |
| 8   | Reading agent workflow                      |      |        |
| 9   | Frontend A — reader experience              |      |        |
| 10  | Frontend B — clubs, staff and agent screens |      |        |

---

## 1. Install (once per laptop)

- **Git** — https://git-scm.com
- **Node.js 20 LTS or newer** — https://nodejs.org (check with `node -v`)
- **VS Code** with the ESLint and Prettier extensions (VS Code will suggest them)
- **Ollama** — https://ollama.com (Members 6, 7, 8, and anyone running the AI features)

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"   # same email as your GitHub account
```

## 2. Get the project running

```bash
git clone https://github.com/<owner>/bookstore-clubs.git
cd bookstore-clubs
git checkout dev
npm install
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

Open `.env` and paste the `MONGODB_URI` the team lead sent you privately. Then:

```bash
npm run seed -- --reset       # creates demo users
npm run dev                   # server on :4000, client on :5173
```

Open http://localhost:5173 — you should see **"API ok, database connected"**. ✅

Demo logins (all use password `Password@123`):
`admin@bookstore.test`, `bookseller@bookstore.test`, `moderator@bookstore.test`,
`reader1@bookstore.test`, `reader2@bookstore.test`, `unverified@bookstore.test` (not verified).

## 3. Your first task: the practice PR

```bash
git checkout dev
git pull origin dev
git checkout -b docs/add-<your-name>
# edit README.md: put your name and GitHub username in your row of the Team table
git add README.md
git commit -m "docs: add <your name> to team table"
git push -u origin docs/add-<your-name>
```

On GitHub click **Compare & pull request** → base: `dev` → request a reviewer → wait for the green ✅ check.

## 4. Everyday Git (every step = one branch = one PR)

```bash
git checkout dev && git pull origin dev           # 1. start from latest dev
git checkout -b feat/<module>-<short-desc>        # 2. branch for this step
# ...code...
git add <your folder> && git commit -m "feat(<module>): what changed"   # 3. commit often
git fetch origin && git merge origin/dev          # 4. bring in teammates' work
npm run lint && npm test                           # 5. check
git push -u origin feat/<module>-<short-desc>     # 6. push, then open a PR into dev
```

Full guide, conflict fixing and common mistakes: Document 02, Section 14.

**Never:** push to `main`/`dev` directly · commit `.env`, passwords or `node_modules` · merge your own PR · edit another member's folder without asking.

---

## 5. Where things live

```
shared/                 Zod schemas + constants used by server and client (Member 1 reviews changes)
server/src/
  app.js, routes.js     app wiring — every module router is already mounted, you don't edit these
  middleware/           auth.js + security.js (Member 2), validate.js, error.js, response.js
  modules/<module>/     model.js · service.js · controller.js · routes.js · *.test.js
  ai/                   discovery (6) · rag (7) · agent (8)
  jobs/                 background jobs (Member 4)
server/scripts/seed.js  demo data — send your data files to Member 1
server/test/            tests (vitest + supertest); helpers/db.js gives an in-memory MongoDB
client/src/             React app — see client/src/README.md for folder owners
docs/                   project PDFs, CONTRACT.md (API changes), adr/ (decisions)
```

## 6. How to write a route (the standard pattern)

Your router is already mounted at `/api` — define full paths:

```js
// server/src/modules/books/routes.js
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { IdParams } from '@bookstore/shared';
import * as ctrl from './controller.js';

const router = Router();
router.get('/books', asyncHandler(ctrl.list)); // public
router.patch(
  '/books/:id/stock',
  requireAuth,
  requireRole('bookseller'),
  validate({ params: IdParams /*, body: UpdateStockBody */ }),
  asyncHandler(ctrl.updateStock),
);
export default router;

// controller.js — keep it thin, logic lives in service.js
export const list = async (req, res) => res.ok(await service.list(req.query));
// errors: throw new AppError('OUT_OF_STOCK', 409, 'No copy available');
```

Every response is `{ ok: true, data }` or `{ ok: false, error: { code, message, details } }`.

## Scripts

| Command                   | What it does                                     |
| ------------------------- | ------------------------------------------------ |
| `npm run dev`             | Start server (:4000) and client (:5173) together |
| `npm run seed -- --reset` | Reset the database and load demo data            |
| `npm test`                | Run server tests                                 |
| `npm run lint`            | Check code style                                 |
| `npm run format`          | Auto-format with Prettier                        |
| `npm run build`           | Build the client                                 |
