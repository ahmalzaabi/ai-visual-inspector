import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // DISABLE SERVICE WORKER COMPLETELY - Like MediaPipe (online-only, faster)
      disable: false, // Keep PWA features for installability
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AI Visual Inspector',
        short_name: 'AI Inspector',
        description: '🌐 Online AI Visual Inspector - Fast like MediaPipe (Internet Required)',
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
      // COMPLETELY REMOVE SERVICE WORKER - NO OFFLINE FUNCTIONALITY
      workbox: {
        // Empty service worker - no caching, no offline features
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: [], // Don't cache anything
        runtimeCaching: [], // No runtime caching
        navigationPreload: false,
        // Generate minimal service worker that does nothing
        mode: 'production'
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
