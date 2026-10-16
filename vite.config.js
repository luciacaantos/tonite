import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TONITE · ¿Dónde salimos esta noche?',
        short_name: 'TONITE',
        description: 'Mapa del ambiente nocturno en Granada centro.',
        lang: 'es',
        theme_color: '#0b0b14',
        background_color: '#0b0b14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'CacheFirst', options: { cacheName: 'fuentes', expiration: { maxEntries: 20 } } },
          { urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*/, handler: 'CacheFirst', options: { cacheName: 'mapa', expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 } } },
        ],
      },
    }),
  ],
});
