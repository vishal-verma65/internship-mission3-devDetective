// vite.config.js  (in project root, next to package.json)
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    }
  }
});