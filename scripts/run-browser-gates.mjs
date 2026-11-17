import {selectBrowserGates} from './browser-gates.mjs';
import {basePath} from '../apps/docs/site-config.mjs';
import {spawn,execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {availablePorts} from './preview-ports.mjs';
import {monitorPreviews,runPreviewGate} from './preview-process.mjs';
const gates=selectBrowserGates(process.env.HIG_BROWSER_GATE,process.env.HIG_VISUAL_ONLY==='1');
const needed=new Set(gates.map(gate=>gate.server).filter(Boolean));
const ports=process.env.HIG_BROWSER_PORT_BASE===undefined?await availablePorts(4):Array.from({length:4},(_,i)=>Number(process.env.HIG_BROWSER_PORT_BASE)+i);
const webPort=process.env.HIG_WEB_PORT??String(ports[0]),docsPort=process.env.HIG_DOCS_PORT??String(ports[1]),nextPort=process.env.HIG_NEXT_PORT??String(ports[2]);
process.env.HIG_DOCS_PORT=docsPort;process.env.HIG_EXPO_PORT??=String(ports[3]);
process.env.HIG_PREVIEW_URL=`http://localhost:${webPort}`;process.env.HIG_DOCS_PREVIEW_URL=`http://localhost:${docsPort}${basePath}/`;process.env.HIG_NEXT_URL=`http://localhost:${nextPort}`;
const servers=[];
function start(args){const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});servers.push(child);return child;}
async function ready(url,child){for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error(`Preview exited: ${url}`);try{if((await fetch(url)).ok)return;}catch{/* Preview may still be starting. */}await delay(500);}throw Error(`Preview timeout: ${url}`);}
try{
 const previews=[];
 const serve=(args,url)=>previews.push([url,start(args)]);
 if(needed.has('expo')){
  execFileSync('npm',['run','bundle:web','-w','hig-native-fixture'],{stdio:'inherit'});
  serve(['scripts/expo-web-server.mjs'],`http://127.0.0.1:${process.env.HIG_EXPO_PORT}/`);
 }
 if(needed.has('next')){
  execFileSync('npm',['run','build:next'],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
  serve(['node_modules/next/dist/bin/next','start','fixtures/next','--hostname','127.0.0.1','--port',nextPort],process.env.HIG_NEXT_URL);
 }
 if(needed.has('web'))serve(['node_modules/vite/bin/vite.js','preview','fixtures/web','--host','127.0.0.1','--port',webPort,'--strictPort'],process.env.HIG_PREVIEW_URL);
 if(needed.has('docs'))serve(['scripts/preview-docs.mjs'],process.env.HIG_DOCS_PREVIEW_URL);
 const failure=monitorPreviews(servers);
 await Promise.race([failure,Promise.all(previews.map(([url,child])=>ready(url,child)))]);
 for(const gate of gates)await runPreviewGate(gate.args,{env:{...process.env,...gate.env},failure});
}finally{for(const child of servers)child.kill('SIGTERM');}
