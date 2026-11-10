import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // The public site, plus the admin dashboard at /admin/.
      input: { main: 'index.html', admin: 'admin/index.html' },
    },
  },
  server: {
    // During `npm run dev`, send API and media calls to `npm run worker`.
    proxy: { '/api': 'http://localhost:8787', '/media': 'http://localhost:8787' },
  },
});
