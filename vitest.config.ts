import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/app-icon.svg', 'icons/apple-touch-icon.svg'],
      manifest: {
        name: 'GymTracker',
        short_name: 'GymTracker',
        description: 'PWA personal para seguir rutinas y entrenamientos de gimnasio.',
        theme_color: '#101826',
        background_color: '#101826',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/app-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    fileParallelism: false,
    maxWorkers: 1,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: './src/test/setupTests.ts'
  }
})
