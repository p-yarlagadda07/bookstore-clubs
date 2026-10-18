Chapter Chat and Ask the Shop

1. What is Chapter Chat?

Chapter Chat lets readers ask questions about a book they are reading. It uses approved book excerpts to answer questions and provides citations so readers can identify the supporting material.

It has two main uses:

Chapter Chat: Answers questions about a book while respecting the reader's progress.

Ask the Shop: Answers questions about bookstore policies using store documents.

2. The Spoiler Boundary

Chapter Chat uses the reader's saved progress to decide which chapters may be used to answer a question.

The getBoundary() function in the progress service determines the chapter limit. In normal mode, the limit is based on the reader's declared chapter. In strict mode, the allowed chapter is one chapter before the declared chapter, with a minimum boundary of chapter zero.

For example, if a reader has marked chapter 4 as their current progress:

Normal mode allows material through chapter 4.

Strict mode allows material only through chapter 3.

This helps prevent the answer from revealing information from a chapter the reader has not finished.

3. How Excerpts Are Retrieved

For a book question, Chapter Chat obtains the reader's boundary and searches for relevant excerpts from that book.

The chapter limit is applied during retrieval, before the excerpts are passed to the language model. This is important because the model should not receive text from chapters beyond the allowed boundary.

Only the retrieved material is used as the source for the answer. This reduces the risk of unsupported claims and spoilers.

4. The Answer and Citations

The chat prompt instructs the model to answer using the supplied context, avoid guessing, and cite supporting information.

Citations use numbers such as [1] and [2]. The response also includes citation metadata, such as the excerpt's chapter and page range when available.

If the model is unavailable or a request times out, the application can fall back to quoting retrieved excerpts rather than relying on an unavailable model.

5. Missing Progress or Material

Chapter Chat handles missing information explicitly.

No reading progress: It asks the reader to declare which chapter they are on before discussing the book.

No relevant approved excerpts: It says that approved material is not available.

Unsupported question: It should not invent plot details that are not supported by the available material.

These responses help keep the chat honest and spoiler-aware.

6. Strict Spoiler Mode

Strict spoiler mode provides an extra safety margin by moving the chapter boundary back by one chapter.

For example, when the declared chapter is 4, strict mode limits retrieval to chapter 3. If a configured maximum chapter limit is lower, the lower limit is respected.

The chat response includes a strict-mode indicator, and the Chapter Chat interface displays the badge Strict spoilers on when strict mode is enabled.

7. Ask the Shop

Ask the Shop answers questions about bookstore policies using store documents rather than book excerpts.

The application searches the store documents for relevant information. When material is available, it returns an answer with citations identifying the supporting documents.

If no relevant store document is found, the chat responds that approved material is not available. When the language model is running, the prompt instructs it to use only the supplied store documents and not invent store policies.

This keeps policy answers grounded in the information provided by the bookstore.

8. Saved Conversations

Chapter Chat can save conversations so readers can return to earlier chats through the interface.

The conversation service stores the conversation information and its responses. Access to saved conversations should follow the application's ownership and authorization rules so that one reader cannot access another reader's private chats.

9. Offline Handling and Timeouts

The AI service may be unavailable or take too long to respond. Chapter Chat and Ask the Shop use a timeout around model requests so that a slow model does not block a request indefinitely.

When a model call fails or times out, the application can use a fallback based on retrieved excerpts or store documents. If there is no relevant source material, it returns a message explaining that the information is unavailable instead of inventing an answer.

10. Summary

Chapter Chat combines reading progress, a chapter boundary, approved excerpt retrieval, and citations to reduce spoilers and unsupported answers. Strict mode moves the boundary back one chapter for additional protection.

Ask the Shop follows the same source-grounded approach but uses bookstore policy documents. Both features are designed to communicate clearly when the available information is insufficient.
