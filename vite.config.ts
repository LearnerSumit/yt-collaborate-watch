// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path"
import { URL } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(new URL('./src', import.meta.url).pathname),
    },
  },
});