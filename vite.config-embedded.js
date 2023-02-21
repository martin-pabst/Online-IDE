
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          embedded: resolve(__dirname, 'embedded.html')
        },
        output: {
          entryFileNames: assetInfo => 'online-ide-embedded.js',
          assetFileNames: assetInfo => assetInfo.name.endsWith('css') ? 'online-ide-embedded.css' : 'assets/[name]-[hash][extname]',
          manualChunks: {}
        }
      },
      chunkSizeWarningLimit: 4912,
      emptyOutDir: false
    }
  });