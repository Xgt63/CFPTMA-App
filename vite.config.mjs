import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './', // Utiliser des chemins relatifs pour Electron
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          utils: ['date-fns']
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'date-fns']
  },
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(mode === 'development'),
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  }
}));
