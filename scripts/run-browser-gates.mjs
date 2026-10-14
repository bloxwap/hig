import {spawn,execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const servers=[];
function start(args){const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});servers.push(child);return child;}
async function ready(url,child){for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error(`Preview exited: ${url}`);try{if((await fetch(url)).ok)return;}catch{/* Preview may still be starting. */}await delay(500);}throw Error(`Preview timeout: ${url}`);}
try{
 execFileSync('npm',['run','build:next'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
 const web=start(['node_modules/vite/bin/vite.js','preview','fixtures/web','--host','127.0.0.1','--port','4173','--strictPort']);
 const docs=start(['scripts/preview-docs.mjs']);
 const next=start(['node_modules/next/dist/bin/next','start','fixtures/next','--hostname','127.0.0.1','--port','4175']);
 await Promise.all([ready('http://localhost:4173',web),ready('http://localhost:4174/hig/',docs),ready('http://localhost:4175',next)]);
 for(const engine of ['chromium','firefox','webkit'])execFileSync(process.execPath,['scripts/browser-smoke.mjs','m5'],{stdio:'inherit',env:{...process.env,HIG_BROWSER:engine}});
 for(const script of ['docs-browser-smoke','catalog-browser-smoke','next-browser-smoke'])execFileSync(process.execPath,[`scripts/${script}.mjs`,'m5'],{stdio:'inherit'});
}finally{for(const child of servers)child.kill('SIGTERM');}
