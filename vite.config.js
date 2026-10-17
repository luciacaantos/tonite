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
        theme_color: '#0a0f1f',
        background_color: '#0a0f1f',
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
        // Las fotos de los locales no se precargan (pesan); se descargan al abrir la ficha.
        globPatterns: ['**/*.{js,css,html,svg}', 'icon-*.png', 'apple-touch-icon.png'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'CacheFirst', options: { cacheName: 'fuentes', expiration: { maxEntries: 20 } } },
        ],
      },
    }),
  ],
});
