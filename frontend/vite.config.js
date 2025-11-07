import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/datasets': 'http://127.0.0.1:8000',
      '/ingest': 'http://127.0.0.1:8000',
      '/metrics': 'http://127.0.0.1:8000',
      '/anomalies': 'http://127.0.0.1:8000',
    },
  },
})
