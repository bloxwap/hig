import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const paths=['packages/tokens/src/index.ts','packages/tokens/generated/tokens.css','packages/tokens/generated/manifest.json','evidence/contrast.json'];
const before=paths.map(p=>readFileSync(p,'utf8'));
execFileSync(process.execPath,[fileURLToPath(new URL('./generate.mjs',import.meta.url))]);
paths.forEach((p,i)=>{if(readFileSync(p,'utf8')!==before[i])throw new Error(`Stale generated artifact: ${p}`);});
console.log('Token generation drift passed');
