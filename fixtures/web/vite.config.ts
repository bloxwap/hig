import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{dedupe:['react','react-dom']},build:{rollupOptions:{input:{main:fileURLToPath(new URL('./index.html',import.meta.url)),acceptance:fileURLToPath(new URL('./acceptance.html',import.meta.url))}}}});
