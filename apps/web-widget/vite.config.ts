import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/web-widget/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@znkfxt/shared-ui': path.resolve(__dirname, '../../packages/shared-ui/src'),
    },
  },
});
