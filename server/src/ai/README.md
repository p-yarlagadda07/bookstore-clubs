# ai

- `discovery/`, embeddings and the Ollama client - Member 6
- `rag/` (book chat) - Member 7
- `agent/` (reading agent) - Member 8

Call the services from the other modules instead of querying the models directly, and pass the
logged in user along so the same permission checks run. If Ollama isn't running, return an
`AI_UNAVAILABLE` error instead of letting the server crash.
