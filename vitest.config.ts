import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/**/*.test.{ts,tsx}'],environmentMatchGlobs:[['tests/**/*.dom.test.tsx','jsdom']],maxWorkers:2}});
