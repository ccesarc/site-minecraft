import { defineConfig } from 'vite';

export default defineConfig({
  // Relativo porque o GitHub Pages serve em /site-minecraft/, nao na raiz;
  // assim o build funciona em qualquer subpasta e o dev segue em /.
  base: './',
  server: { port: 5173, open: false },
  build: { target: 'es2022' },
});
