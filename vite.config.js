import { defineConfig } from 'vite';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: 'src', // tells Vite your project starts in /src
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, 'src/icons'),
          dest: '.' // dist/icons => ./icons since outDir = '.'
        }
      ]
    })
  ],
  build: {
    outDir: path.resolve(__dirname, '.'), // output to root of project
    emptyOutDir: false, // DO NOT wipe root directory!
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html'),
      output: {
        format: 'iife',
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
      },
    },
    minify: 'terser',
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
});
