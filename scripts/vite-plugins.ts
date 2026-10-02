import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { buildTokens } from './build-tokens';

/** Regenerates src/tokens/* on start and whenever tokens/tokens.json is saved. */
export function tokensPlugin(root: string): Plugin {
  const source = resolve(root, 'tokens/tokens.json');
  return {
    name: 'whose-is-it:tokens',
    buildStart() {
      buildTokens(root);
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
    name: 'whose-is-it:mono-svg',
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
