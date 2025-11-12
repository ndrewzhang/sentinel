import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/datasets': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ingest':   { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/metrics':  { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/anomalies':{ target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ai':       { target: 'http://127.0.0.1:8000', changeOrigin: true }, 
    },
  },
})
