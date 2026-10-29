import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build can be embedded in a native WebView later.
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
});
