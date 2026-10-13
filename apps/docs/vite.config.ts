import {defineConfig} from 'vite';
export default defineConfig({base:process.env.HIG_BASE_PATH??'/hig/',resolve:{dedupe:['react','react-dom']},build:{chunkSizeWarningLimit:500}});
