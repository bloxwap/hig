import {configDefaults,defineConfig} from 'vitest/config';

export default defineConfig({
 test:{
  maxWorkers:2,
  projects:[
   {
    extends:true,
    test:{
     name:'node',
     environment:'node',
     include:['tests/**/*.test.{ts,tsx}'],
     exclude:[...configDefaults.exclude,'tests/**/*.dom.test.tsx'],
    },
   },
   {
    extends:true,
    test:{
     name:'dom',
     environment:'jsdom',
     include:['tests/**/*.dom.test.tsx'],
    },
   },
  ],
 },
});
