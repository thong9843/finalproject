import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    host: true,
    allowedHosts: [
      "pete-mariah-retreat-compliant.trycloudflare.com"
    ],
        proxy: {
      "/api": {
        target: "http://localhost:3000", // backend của bạn
        changeOrigin: true,
        secure: false
      }
    }
  }
})
