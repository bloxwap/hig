import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
function check(paths,generator){const before=paths.map(p=>readFileSync(p));execFileSync(process.execPath,[fileURLToPath(new URL(generator,import.meta.url))]);paths.forEach((p,i)=>{if(!readFileSync(p).equals(before[i]))throw new Error(`Stale generated artifact: ${p}`);});}
check(['packages/tokens/src/index.ts','packages/tokens/generated/tokens.css','packages/tokens/generated/manifest.json','evidence/contrast.json'],'./generate.mjs');
check(['apps/docs/public/favicon.svg','fixtures/next/public/favicon.svg','apps/docs/public/og.svg','apps/docs/public/og.png','planning/brand-artifacts.json'],'./generate-brand.mjs');
console.log('Token and brand generation drift passed');
