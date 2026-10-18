# Next Read Agent

## 1. Purpose

The Next Read agent helps a club moderator find a suitable book based on the club's request, available stock, and reading capacity.

It searches for candidates, checks copy availability, compares reading length with club constraints, and returns a shortlist with a written explanation.

## 2. The Three Tools

### `searchCatalog`

Searches the catalog for books that match the request.

It returns candidate books and matching information such as title, author, themes, page count, and relevance.

### `checkStockAndLength`

Checks candidate books' page counts, estimated reading time, and available copies.

It helps determine whether enough copies are available for the club.

### `compareClubConstraints`

Compares candidate books with the club's reading capacity.

It reports whether each book fits the reading plan, is a tight fit, or is too long, with an explanation.

## 3. Live Progress Events

The agent reports progress while processing a request.

- **`started`**: the tool has started running.
- **`succeeded`**: the tool completed successfully.
- **`failed`**: the tool encountered an error.

These events help the interface show the moderator what the agent is doing instead of displaying only a final result.

## 4. Shortlist and Choosing a Book

The agent returns a shortlist of candidate books with explanations of how they match the request and the club's constraints.

The moderator reviews the shortlist and clicks **Choose this book** on one shortlist item. The selected book becomes the club's current book.

Readers then hold their own copies of the selected book.

The agent suggests books; the moderator makes the final choice.

## 5. Safety and Limits

- The agent operates within the application's authentication and authorization rules.
- Catalog recommendations should follow the application's source and approval rules.
- The agent has a 45-second time limit.
- The agent recommends books but does not automatically reserve or hold copies.
- The moderator is responsible for choosing the final book.

## 6. Demo Scenario

Use the Tuesday Mystery Circle club for the demonstration.

### Club details

- **Club:** Tuesday Mystery Circle
- **Members:** 8
- **Meeting:** In 14 days
- **Reading pace:** 120 pages per week (about 240 pages before the meeting)
- **Request:** Find a short mystery for our next club meeting.

### Candidate comparison

| Book                        | Pages | Estimated reading time | Available copies | Assessment                                                   |
| --------------------------- | ----: | ---------------------: | ---------------: | ------------------------------------------------------------ |
| The Lantern Keeper's Secret |   380 |              9.5 hours |                3 | Longer than the target and insufficient copies for 8 members |
| Murder at Platform Nine     |   220 |              5.5 hours |               10 | Fits the page target and has enough copies for 8 members     |

### Demo steps

1. Open the application and sign in with a test moderator account.
2. Navigate to Tuesday Mystery Circle.
3. Open the Next Read agent.
4. Enter: "Find a short mystery for our next club meeting."
5. Submit the request.
6. Observe the live progress events as the agent searches and evaluates candidates.
7. Review the shortlist, explanations, and available-copy information.
8. Click **Choose this book** on _Murder at Platform Nine_.

After the moderator chooses the book, verify that it becomes the club's current book. Readers can then hold their own copies.
