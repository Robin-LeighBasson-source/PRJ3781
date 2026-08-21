import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Keeps the frontend on same-origin `/api/...` paths in dev, matching how it
      // is served in production behind a single host.
      '/api': {
        target: process.env.MORROW_API_URL || 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
