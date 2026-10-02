import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { buildTokens } from './scripts/build-tokens.ts';
import { monoSvgPlugin, sharePlugin, tokensPlugin } from './scripts/vite-plugins.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const { color } = buildTokens(root) as { color: { bg: string } };

/** One source for the app's name, pitch and public URL (manifest, link previews, canonical). */
const APP = {
  name: 'Tell',
  title: 'Tell: a party game for video calls',
  tagline: 'Everyone has a story. Can you tell whose?',
  description:
    'Everyone has a story. Can you tell whose? A guess-the-storyteller party game for video calls, played on any device. Built by DOM lab for Fueled.',
  // Vercel sets the production domain at build time; SITE_URL overrides it.
  url:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://fueled-tell.vercel.app'),
};

export default defineConfig({
  plugins: [
    tokensPlugin(root),
    monoSvgPlugin(),
    sharePlugin({
      url: APP.url,
      name: APP.name,
      title: APP.title,
      description: APP.description,
      image: '/og.png',
      imageAlt: `${APP.name}: ${APP.tagline}`,
    }),
    react(),
    // Installable app with an offline shell. Realtime play still needs a network.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: APP.name,
        short_name: APP.name,
        description: APP.description,
        lang: 'en',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        // Re-opening the installed app focuses the running window instead of a second copy (keeps one host tab).
        launch_handler: { client_mode: 'focus-existing' },
        background_color: color.bg,
        theme_color: color.bg,
        categories: ['games', 'entertainment'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Host a game',
            short_name: 'Host',
            description: 'Set up a game and share your screen',
            url: '/host',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Join a game',
            short_name: 'Join',
            description: 'Enter a room code from the shared screen',
            url: '/play',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        // Richer install dialogs (Chrome, Edge, Android).
        screenshots: [
          {
            src: '/screenshots/wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'The shared screen: room code, QR and who has joined',
          },
          {
            src: '/screenshots/narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Guessing whose story it is',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // Share card and install screenshots are only fetched by other apps: keep them out of the offline cache.
        globIgnores: ['og.png', 'screenshots/**'],
        navigateFallback: '/index.html',
        // The lazy Three.js chunk is ~900 KB raw: precache it so the host works offline too.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
