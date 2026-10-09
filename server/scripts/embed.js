// usage: npm run embed  (Ollama must be open)
import { connectDB, disconnectDB } from '../src/config/db.js';
import { embedAllBooks } from '../src/ai/embeddings/books.js';

async function main() {
  await connectDB();
  const n = await embedAllBooks();
  console.log(`Embedded ${n} books`);
  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDB();
  process.exit(1);
});