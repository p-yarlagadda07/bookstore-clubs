# Testing Guide

## 1. Running Tests

Use Node.js 20 or later. From the repository root, install dependencies and run the server test suite:

```bash
npm ci
npm test
```

The server uses Vitest and Supertest. Tests use a temporary in-memory MongoDB database, so they do not require the production database.

Other checks:

```bash
npm run lint
npm run format:check
npm run build
```

GitHub Actions runs these checks on pull requests to `dev` or `main` and pushes to `dev`.

## 2. Latest Test Results

Command: `npm test`

- Test files passed: **35**
- Tests passed: **242**
- Failed tests: **0**
- Duration: **98.54 seconds**

Results are from the run on 19 October 2026. Run the tests again after making changes.

## 3. Requirement-to-Test Mapping

| Requirement                                     | Test file                                              | Test name                                                                    |
| ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Only one reader reserves the last copy          | `server/src/modules/reservations/reservations.test.js` | `only one of two people gets the last copy`                                  |
| Prevent spoilers beyond reader progress         | `server/src/ai/rag/bookChat.test.js`                   | `never sends excerpts beyond the reader boundary to the model`               |
| Unsupported questions return no-source response | `server/src/ai/rag/bookChat.test.js`                   | `returns not_in_sources when no approved excerpt matches`                    |
| Says so when only the synopsis is available     | `server/src/ai/rag/bookChat.test.js`                   | `says so when we only have the synopsis`                                     |
| Filter books by availability                    | `server/src/modules/books/books.test.js`               | `available=true only returns books with copies, available=false returns all` |
| Expired holds restore stock                     | `server/src/modules/reservations/reservations.test.js` | `expires an overdue hold and restores inventory`                             |
| Users cannot change their own roles             | `server/src/modules/users/users.test.js`               | `nobody can change their own roles`                                          |
| Revoked-source books are blocked                | `server/src/modules/reservations/reservations.test.js` | `gives 404 for a book from a revoked source`                                 |
| Revoked-source books are blocked in book chat   | `server/src/ai/rag/bookChat.test.js`                   | `refuses a book from a revoked source`                                       |

## 4. Manual Checks Before the Demo

Use a fresh seed and the project's test accounts. Do not use real user accounts.

- [ ] Open the catalogue and check book details and availability.
- [ ] Check that unavailable books cannot be reserved.
- [ ] Reserve an available copy and verify it appears under **My Holds**.
- [ ] Check the hold's book title, condition, status, and pickup window.
- [ ] Cancel a hold and verify that its status updates and the copy becomes available again.
- [ ] Check that an expired hold is released.
- [ ] Check that revoked-source books are hidden or rejected.
- [ ] Check that book chat does not reveal text beyond the reader's progress.
- [ ] Check that unsupported book questions receive a no-source response.
- [ ] Check that users cannot change their own roles.

Record any failures and report them before the demo. Never include `.env` contents, database connection strings, passwords, or terminal screenshots in submitted evidence.
