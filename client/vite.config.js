import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls are proxied to the Express server, so cookies work without CORS.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
