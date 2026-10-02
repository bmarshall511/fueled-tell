import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { buildTokens } from './build-tokens.ts';

/** Regenerates src/tokens/* on start and whenever tokens/tokens.json is saved. */
export function tokensPlugin(root: string): Plugin {
  const source = resolve(root, 'tokens/tokens.json');
  return {
    name: 'tell:tokens',
    buildStart() {
      buildTokens(root);
    },
    /**
     * Paint the brand background before any JS or CSS arrives (no white flash),
     * and color the mobile browser chrome to match, straight from the tokens.
     */
    transformIndexHtml() {
      const tree = buildTokens(root) as { color?: { bg?: string } };
      const bg = tree.color?.bg ?? 'black';
      return [
        { tag: 'meta', attrs: { name: 'theme-color', content: bg }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'color-scheme', content: 'dark' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }, injectTo: 'head' },
        // html only: a body background would paint over the glow backdrop (z-index -1).
        { tag: 'style', children: `html{background:${bg}}`, injectTo: 'head' },
      ];
    },
    configureServer(server) {
      server.watcher.add(source);
      server.watcher.on('change', (file) => {
        if (resolve(file) !== source) return;
        try {
          buildTokens(root);
          server.config.logger.info('tokens rebuilt', { timestamp: true });
        } catch (err) {
          server.config.logger.error(`tokens build failed: ${String(err)}`);
        }
      });
    },
  };
}

/**
 * `import svg from './logo.svg?mono'` returns the SVG markup as a string with
 * metadata stripped and every fill set to currentColor, for single-color logos.
 */
export function monoSvgPlugin(): Plugin {
  const SUFFIX = '?mono';
  return {
    name: 'tell:mono-svg',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!id.endsWith(SUFFIX)) return null;
      const resolved = await this.resolve(id.slice(0, -SUFFIX.length), importer, { skipSelf: true });
      return resolved ? `${resolved.id}${SUFFIX}` : null;
    },
    load(id) {
      if (!id.endsWith(SUFFIX)) return null;
      const file = id.slice(0, -SUFFIX.length);
      this.addWatchFile(file);
      const svg = readFileSync(file, 'utf8')
        .replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
        .replace(/\sxmlns:c2pa="[^"]*"/g, '')
        .replace(/\s(width|height)="[^"]*"/, '')
        .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
        .replace(/\s+/g, ' ')
        .trim();
      return `export default ${JSON.stringify(svg)};`;
    },
  };
}

export interface ShareMeta {
  /** Absolute site origin, e.g. https://fueled-tell.vercel.app */
  url: string;
  name: string;
  title: string;
  description: string;
  /** Path to the 1200x630 social card under public/. */
  image: string;
  imageAlt: string;
}

/** Link previews (Open Graph, Twitter/X, Slack, iMessage) and home-screen titles, from one set of values. */
export function sharePlugin(meta: ShareMeta): Plugin {
  const image = new URL(meta.image, meta.url).toString();
  const tag = (attrs: Record<string, string>) => ({ tag: 'meta', attrs, injectTo: 'head' as const });
  return {
    name: 'tell:share',
    transformIndexHtml() {
      return [
        tag({ name: 'description', content: meta.description }),
        { tag: 'link', attrs: { rel: 'canonical', href: meta.url }, injectTo: 'head' },
        tag({ name: 'application-name', content: meta.name }),
        tag({ name: 'apple-mobile-web-app-title', content: meta.name }),
        tag({ property: 'og:type', content: 'website' }),
        tag({ property: 'og:site_name', content: meta.name }),
        tag({ property: 'og:url', content: meta.url }),
        tag({ property: 'og:title', content: meta.title }),
        tag({ property: 'og:description', content: meta.description }),
        tag({ property: 'og:image', content: image }),
        tag({ property: 'og:image:width', content: '1200' }),
        tag({ property: 'og:image:height', content: '630' }),
        tag({ property: 'og:image:alt', content: meta.imageAlt }),
        tag({ property: 'og:locale', content: 'en_US' }),
        tag({ name: 'twitter:card', content: 'summary_large_image' }),
        tag({ name: 'twitter:title', content: meta.title }),
        tag({ name: 'twitter:description', content: meta.description }),
        tag({ name: 'twitter:image', content: image }),
        tag({ name: 'twitter:image:alt', content: meta.imageAlt }),
      ];
    },
  };
}
