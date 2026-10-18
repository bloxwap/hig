import {execFileSync,spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {writeFileSync,readFileSync,cpSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {scratchDir} from './scratch.mjs';
const dir=scratchDir('hig-next-consumer-');
const manifest=JSON.parse(readFileSync('fixtures/next/package.json','utf8'));
for(const key of Object.keys(manifest.dependencies))if(key.startsWith('@bloxwap/hig-'))delete manifest.dependencies[key];
manifest.devDependencies={typescript:'5.9.3','@types/react':'19.1.16','@types/node':'22.18.10'};
cpSync('fixtures/next',dir,{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/.next')});
writeFileSync(join(dir,'package.json'),JSON.stringify(manifest,null,2));
const tarballs=readdirSync('artifacts').filter(n=>n.endsWith('.tgz')&&!n.includes('hig-native')&&!n.includes('hig-feedback')&&!n.includes('hig-chart')).map(n=>resolve('artifacts',n));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...tarballs],{cwd:dir,stdio:'pipe'});
execFileSync('npm',['run','build'],{cwd:dir,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const html=readFileSync(join(dir,'.next/server/app/index.html'),'utf8');assert.match(html,/Server display:/);assert.match(html,/Review order/);const font=html.match(/href="([^"]+\.woff2)"[^>]*as="font"/);assert.ok(font,'Next preloads a font');const emitted=readFileSync(join(dir,'.next',font[1].replace(/^\/_next\//,'')));const published=readFileSync(join(dir,'node_modules/@bloxwap/font/fonts/BloxwapSans/BloxwapSans-Variable.woff2'));assert.ok(emitted.equals(published),'Next emitted the pinned published Sans font bytes');
// #65: serve the packed consumer and require loaded Bloxwap faces on HIG controls in a real browser.
const port=process.env.HIG_PACKED_NEXT_PORT??'4180',url=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,[join(dir,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',port],{cwd:dir,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
try{
 let up=false;for(let i=0;i<120&&!up;i++){if(server.exitCode!==null)throw Error('Packed Next server exited');try{up=(await fetch(url)).ok;}catch{/* Server may still be starting. */}if(!up)await delay(500);}
 assert.ok(up,'Packed Next server started');
 execFileSync(process.execPath,['scripts/next-browser-smoke.mjs','packed'],{stdio:'inherit',env:{...process.env,HIG_NEXT_URL:url}});
}finally{server.kill('SIGTERM');}
console.log(`Packed Next ${manifest.dependencies.next}: production SSR/client/font build from ${tarballs.length} independent tarballs passed`);
