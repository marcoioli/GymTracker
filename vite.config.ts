import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/treino-app-icon.png', 'icons/treino-brand-mark.png'],
      manifest: {
        name: 'Treino',
        short_name: 'Treino',
        description: 'App personal para seguir rutinas, sesiones y progreso de entrenamiento.',
        theme_color: '#101826',
        background_color: '#101826',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/treino-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/treino-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
})
