
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