import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // COMPLETE PWA DISABLE - NO SERVICE WORKER AT ALL (MediaPipe style)
      disable: true, // Completely disable PWA service worker
      selfDestroying: true, // Remove any existing service workers
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AI Visual Inspector',
        short_name: 'AI Inspector',
        description: '🌐 Online AI Visual Inspector - No Offline Mode (Fast like MediaPipe)',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        prefer_related_applications: false,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    // Optimize for production builds
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          i18n: ['i18next', 'react-i18next'],
          // Reserve space for future ML chunks
          // ml: ['@tensorflow/tfjs', 'opencv.js'] // Will add when implementing ML
        }
      }
    },
    // Optimize chunk size - AI/ML apps need larger chunks
    chunkSizeWarningLimit: 2000
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'i18next', 'react-i18next']
  }
})
