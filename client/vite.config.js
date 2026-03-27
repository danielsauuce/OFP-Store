import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-gsap': ['gsap'],
          'vendor-zod': ['zod'],
          'vendor-axios': ['axios'],
          'vendor-lucide': ['lucide-react'],
          'vendor-toast': ['react-hot-toast'],
        },
      },
    },
  },
});
