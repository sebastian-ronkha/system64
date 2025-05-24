import { defineConfig } from 'vite';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: '.',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'icons',  // your source folder at project root
          dest: '.'      // copy into dist root, so ends up as dist/icons
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'manifest.json') {
              return 'manifest.json';
            }
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        format: 'iife',
      },
    },
    minify: 'terser', // or 'esbuild' if you want to drop terser dep
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
