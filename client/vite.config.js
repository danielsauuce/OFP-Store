import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    react(),
    analyzer({
      openAnalyzer: true,
      summary: true,
    }),
  ],
});
