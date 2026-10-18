import {spawn,execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const portBase=Number(process.env.HIG_BROWSER_PORT_BASE??4173);
const webPort=process.env.HIG_WEB_PORT??String(portBase),docsPort=process.env.HIG_DOCS_PORT??String(portBase+1),nextPort=process.env.HIG_NEXT_PORT??String(portBase+2);
process.env.HIG_DOCS_PORT=docsPort;process.env.HIG_EXPO_PORT??=String(portBase+3);
process.env.HIG_PREVIEW_URL=`http://localhost:${webPort}`;process.env.HIG_DOCS_PREVIEW_URL=`http://localhost:${docsPort}/hig/`;process.env.HIG_NEXT_URL=`http://localhost:${nextPort}`;
const servers=[];
function start(args){const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});servers.push(child);return child;}
async function ready(url,child){for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error(`Preview exited: ${url}`);try{if((await fetch(url)).ok)return;}catch{/* Preview may still be starting. */}await delay(500);}throw Error(`Preview timeout: ${url}`);}
try{
 execFileSync('npm',['run','bundle:web','-w','hig-native-fixture'],{stdio:'inherit'});
 execFileSync('npm',['run','build:next'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
 const expo=start(['scripts/expo-web-server.mjs']);
 const web=start(['node_modules/vite/bin/vite.js','preview','fixtures/web','--host','127.0.0.1','--port',webPort,'--strictPort']);
 const docs=start(['scripts/preview-docs.mjs']);
 const next=start(['node_modules/next/dist/bin/next','start','fixtures/next','--hostname','127.0.0.1','--port',nextPort]);
 await Promise.all([ready(process.env.HIG_PREVIEW_URL,web),ready(process.env.HIG_DOCS_PREVIEW_URL,docs),ready(process.env.HIG_NEXT_URL,next),ready(`http://127.0.0.1:${process.env.HIG_EXPO_PORT??4176}/`,expo)]);
 for(const engine of ['chromium','firefox','webkit'])execFileSync(process.execPath,['scripts/browser-smoke.mjs','m5'],{stdio:'inherit',env:{...process.env,HIG_BROWSER:engine}});
 execFileSync(process.execPath,['scripts/expo-web-browser-smoke.mjs'],{stdio:'inherit'});
 execFileSync(process.execPath,['scripts/acceptance-browser-smoke.mjs'],{stdio:'inherit'});
 for(const script of ['css-isolation-browser-smoke','feedback-browser-smoke','docs-browser-smoke','catalog-browser-smoke','next-browser-smoke'])execFileSync(process.execPath,[`scripts/${script}.mjs`,'m5'],{stdio:'inherit'});
}finally{for(const child of servers)child.kill('SIGTERM');}
