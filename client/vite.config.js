import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    // Bundle analyzer only in analyze mode: run with `ANALYZE=true npm run build`
    ...(process.env.ANALYZE === 'true'
      ? [
          (await import('vite-bundle-analyzer')).analyzer({
            openAnalyzer: false,
            summary: true,
          }),
        ]
      : []),
  ],

  build: {
    // Warn when a chunk exceeds 500 kB (down from Vite's default 500)
    chunkSizeWarningLimit: 500,

    // Skip reporting compressed size — faster builds in CI
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        // Split each top-level vendor into its own chunk so browsers can
        // cache them independently and users only download what changed.
        manualChunks: {
          // React runtime — tiny, changes never
          'vendor-react': ['react', 'react-dom'],

          // Router — changes rarely
          'vendor-router': ['react-router-dom'],

          // GSAP — large; isolate so it's cached long-term
          'vendor-gsap': ['gsap'],

          // Zod validation — used only at form-submit time
          'vendor-zod': ['zod'],

          // Axios HTTP client
          'vendor-axios': ['axios'],

          // Lucide icon set
          'vendor-lucide': ['lucide-react'],

          // Toast notifications
          'vendor-toast': ['react-hot-toast'],
        },
      },
    },
  },

  // Resolve aliases for cleaner imports (optional but helpful)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}));
