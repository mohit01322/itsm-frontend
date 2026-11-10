import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'I-ITSM Incident Manager',
        short_name: 'I-ITSM',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1f3a5f',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // Every request to /api goes to the Spring Boot backend. This also avoids CORS problems in development.
    proxy: { '/api': 'http://localhost:8080' },
  },
})
