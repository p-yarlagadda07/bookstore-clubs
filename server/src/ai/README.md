# AI layer

| Folder                                              | Owner    | What                                                 |
| --------------------------------------------------- | -------- | ---------------------------------------------------- |
| `ollama.js`, `embeddings/`, `ingest/`, `discovery/` | Member 6 | Ollama client, embeddings, vector indexes, discovery |
| `rag/`                                              | Member 7 | Spoiler-aware book chat                              |
| `agent/`                                            | Member 8 | Reading agent and its three tools                    |

Rules: AI code calls **services**, never models directly, and always passes the current user so the
same permission checks apply. If Ollama is down, return `AI_UNAVAILABLE` (503), never crash.
