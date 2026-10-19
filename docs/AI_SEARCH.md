# Smart Search and Read-Alikes

## 1. The problem

When people look for a book, they often don't remember the title. They remember a feeling or a bit of the story, like "a lighthouse keeper and a storm". A normal search needs the title or the author's name, so it finds nothing for that. Smart Search fixes this. It looks at what the reader means, not just the exact words they typed.

## 2. Embeddings

An embedding is a list of numbers that stands for the meaning of a text. Each book gets 768 numbers. Books with a similar meaning get numbers that are close to each other.

We use a model called `nomic-embed-text`, which runs in Ollama on our own computer. For each book, we join the title, themes, moods and synopsis into one piece of text. The model turns that text into the numbers, and we save them in the book's `embedding` field.

To do this for every book, run `npm run embed`. Ollama must be open when you run it. Run it again if you change a synopsis, because it re-embeds all the books each time.

## 3. The vector index

To search by meaning, the database needs a vector index. Ours is called `books_vec`, and its settings are saved in `docs/indexes/books_vec.json`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "approvedSource" }
  ]
}
```

The first field tells the index to search the `embedding` numbers. Each book has 768 of them, and "cosine" is how it measures how close two books are.

The second field is a filter on `approvedSource`. Every search asks for `approvedSource: true`, so a book from a revoked source never shows up, not in Smart Search and not in Read-Alikes.

## 4. How Smart Search works

Smart Search is the route `GET /api/books/discover?q=...`. When a reader types a query, this happens:

1. The server checks that Ollama is running. If it is not, the reader gets an `AI_UNAVAILABLE` error.
2. The query is turned into 768 numbers, using the same model we used for the books.
3. The database compares those numbers with every book's numbers using `$vectorSearch`. It looks at 100 candidates and keeps the closest ones. Only approved books are included.
4. For each book we add the stock details, so the reader can see if a copy is available.
5. For each book we also add a short "why it matched" line (explained in the next section).

The reader gets back each book's title, authors, themes, moods, page count, synopsis, score, why and availability.

## 5. Why it matched

Each result comes with a short line that says why the book was picked. It is made by a small function called `whyItMatched`, and it does not call the AI, so it is instant.

It tries three things in order and stops at the first one that works:

1. **Themes and moods.** If any of the book's themes or moods appear in the query, it says `Matches` and lists up to 3 of them.
2. **Title and synopsis words.** If not, it takes the words in the query, ignores short words and common ones like "about" or "story", and checks them against the book's title and synopsis. If some match, it says `Related to` and lists up to 3 of them.
3. **Fallback.** If nothing matches, it says `Close to how you described it`.

This line is only a simple word check. It is added after the AI search has already chosen the books.

## 6. Read-Alikes

Read-Alikes shows books similar to the one a reader is looking at. It is the route `GET /api/books/:id/similar`.

It works like Smart Search, with one difference. It does not turn a query into numbers, because the book already has its own numbers saved. The server takes those numbers and asks the database for the closest books. It asks for one extra result, because the closest book is always the book itself, and then removes it from the list.

Because it uses the saved numbers, it makes no AI call. So Read-Alikes still works when Ollama is off.

A few small rules:

- Only approved books are shown, so revoked books never appear.
- If the book does not exist or is revoked, the reader gets a `NOT_FOUND` error.
- If the book has no embedding yet, the list is empty.
- Each result has stock details, but no "why it matched" line.

## 7. When Ollama is off or slow

Smart Search needs Ollama to turn the query into numbers, so two things can go wrong.

- **Ollama is off.** The server checks Ollama first, and waits at most 2 seconds. If it does not answer, the reader gets the error `AI_UNAVAILABLE` (status 503) with the message "The AI assistant is offline right now".
- **Ollama is slow.** The query step has a 20 second limit. If it takes longer, the reader gets the error `AI_TIMEOUT` (status 503) and can try again.

Smart Search has no backup mode. If the AI is not available, it shows a clear error and does not guess.

Read-Alikes is different. It uses the numbers already saved in the book, so it does not need Ollama and keeps working when Ollama is off.

## Example

Query: `a lighthouse keeper and a storm`

Top 3 results:

| #   | Book                        | Author       | Why it matched                 | Stock     |
| --- | --------------------------- | ------------ | ------------------------------ | --------- |
| 1   | The Lantern Keeper's Secret | Meera Iyer   | Related to: lighthouse, keeper | Available |
| 2   | Moonlit Tides               | Clara Hughes | Related to: lighthouse         | Few left  |
| 3   | Snow on the Bay Bridge      | Hannah Cole  | Related to: storm              | Available |

The first two books are about a lighthouse, so they match the query well. The third is a detective story set during a snowstorm. The word "storm" is inside "snowstorm", so the word check found it.

Further down the list there are weaker matches, like _Every Summer After the Rain_. They show `Close to how you described it`, because no theme, mood or word matched.
