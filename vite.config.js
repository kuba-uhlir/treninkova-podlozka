import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  publicDir: 'assets', // assets/img, assets/audio se kopírují do kořene buildu
  build: { target: 'es2019', outDir: 'dist', assetsInlineLimit: 0 },
  server: { host: true, port: 5173 },
});
