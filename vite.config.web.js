// Build webové verze, která jde otevřít dvojklikem (file://) – bez serveru: jeden klasický skript místo ES modulů.
import { defineConfig } from 'vite';

const classicScript = () => ({
  name: 'classic-script',
  enforce: 'post',
  transformIndexHtml(html) {
    // moduly na file:// nefungují → klasický skript s defer
    return html.replace(/<script type="module" crossorigin/g, '<script defer').replace(/ crossorigin/g, '');
  },
});

export default defineConfig({
  base: './',
  publicDir: 'assets',
  plugins: [classicScript()],
  build: {
    target: 'es2019',
    outDir: 'Fotbal-web',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    modulePreload: false,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
});
