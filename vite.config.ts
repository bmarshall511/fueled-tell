import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { buildTokens } from './scripts/build-tokens.ts';
import { monoSvgPlugin, tokensPlugin } from './scripts/vite-plugins.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const { color } = buildTokens(root) as { color: { bg: string } };

export default defineConfig({
  plugins: [
    tokensPlugin(root),
    monoSvgPlugin(),
    react(),
    // Installable app with an offline shell. Realtime play still needs a network.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Tell',
        short_name: 'Tell',
        description: 'A party game for video calls. Guess whose story it is. Built by DOM lab for Fueled.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: color.bg,
        theme_color: color.bg,
        categories: ['games', 'entertainment'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Host a game', url: '/host' },
          { name: 'Join a game', url: '/play' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        // The lazy Three.js chunk is ~900 KB raw: precache it so the host works offline too.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
