import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react', 'embla-carousel-react', 'embla-carousel-autoplay'],
          'vendor-state': ['zustand'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
