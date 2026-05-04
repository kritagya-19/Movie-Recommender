import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/recommend': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/trending': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/autocomplete': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/details': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/discover': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
