
import { resolve } from 'path'
import { defineConfig } from 'vite'

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

var d = new Date();
var curr_date = d.getDate();
var curr_month = d.getMonth() + 1; //Months are zero based
var curr_year = d.getFullYear();
var hour = d.getHours();
var minute = d.getMinutes();
var buildDate = curr_date + "." + curr_month + "." + curr_year + ", " + hour + ":" + minute + " Uhr";

export default defineConfig({
  define: {
    'APP_VERSION': JSON.stringify(pkg.version),
    'BUILD_DATE': JSON.stringify(buildDate)
  },
  server: {
    proxy: {
      '/servlet': 'http://localhost:5500',
      '/sprites': 'http://localhost:5500',
      '/servlet/websocket': { target: 'ws://localhost:5500', ws: true },
      '/servlet/pushWebsocket': { target: 'ws://localhost:5500', ws: true },
      // '/servlet/subscriptionwebsocket': { target: 'ws://localhost:5500', ws: true },
      '/worker': {
        rewrite: (path) => path.replace('/worker', '/dist/worker'),
        target: "http://localhost:3000"
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'administration_mc.html'),
        api: resolve(__dirname, 'api_documentation.html'),
        spriteLibrary: resolve(__dirname, 'spriteLibrary.html'),
        statistics: resolve(__dirname, 'statistics.html'),
        shortcuts: resolve(__dirname, 'shortcuts.html'),
        'diagram-worker': './src/client/main/gui/diagrams/classdiagram/Router.ts',
        'sqljs-worker': './src/client/tools/database/sqljsWorker.ts'
      },
      output: {
        entryFileNames: assetInfo => {
          if (assetInfo.name.indexOf('worker') >= 0) {
            return 'worker/[name].js';
          }
          return '[name]-[hash].js';
        },
        assetFileNames: assetInfo => assetInfo.name.endsWith('css') ? '[name]-[hash][extname]' : 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: {}
      }
    },
    chunkSizeWarningLimit: 4912
  }
});