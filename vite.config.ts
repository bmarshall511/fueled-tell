import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { monoSvgPlugin, tokensPlugin } from './scripts/vite-plugins';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [tokensPlugin(root), monoSvgPlugin(), react()],
});
