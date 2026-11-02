import os from 'node:os';
import {configDefaults,defineConfig} from 'vitest/config';

const cores=os.availableParallelism?.()??os.cpus().length;
// Two runners share each CI mini. Local runs can cap this with VITEST_MAX_WORKERS.
const maxWorkers=process.env.VITEST_MAX_WORKERS===undefined
 ?Math.max(2,Math.floor(cores/2))
 :Number(process.env.VITEST_MAX_WORKERS);
if(!Number.isSafeInteger(maxWorkers)||maxWorkers<1){
 throw new Error('VITEST_MAX_WORKERS must be a positive integer');
}

export default defineConfig({
 test:{
  maxWorkers,
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
