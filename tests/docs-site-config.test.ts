import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {basePath,origin} from '../apps/docs/site-config.mjs';

function config(overrides:Record<string,string>={}){
 const env={...process.env};
 delete env.NEXT_PUBLIC_BASE_PATH;delete env.HIG_DOCS_ORIGIN;
 return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',"import {basePath,origin} from './apps/docs/site-config.mjs'; console.log(JSON.stringify({basePath,origin}))"],{env:{...env,NODE_ENV:'production',...overrides},encoding:'utf8',stdio:['ignore','pipe','pipe']}));
}
it('uses one default, with an empty development base and explicit overrides',()=>{
 expect(config()).toEqual(config({NODE_ENV:'test'}));
 expect(config({NODE_ENV:'development'}).basePath).toBe('');
 for(const base of ['', '/custom-123'])expect(config({NODE_ENV:'development',NEXT_PUBLIC_BASE_PATH:base,HIG_DOCS_ORIGIN:'https://docs.example:8443'})).toEqual({basePath:base,origin:'https://docs.example:8443'});
});
it('rejects malformed paths and origins before consumers run',()=>{
 for(const base of ['/custom/','custom','/','//custom','/a/b','/UPPER','/a?b','/a#b','/a b'])expect(()=>config({NEXT_PUBLIC_BASE_PATH:base})).toThrow('NEXT_PUBLIC_BASE_PATH');
 for(const url of ['','https://docs.example/','https://docs.example/path','https://docs.example?x','https://docs.example#x','https://user:pass@docs.example','ftp://docs.example','not a URL'])expect(()=>config({HIG_DOCS_ORIGIN:url})).toThrow('HIG_DOCS_ORIGIN');
});
it('keeps deployment defaults and environment reads in the shared module',()=>{
 const defaults=config();
 const files=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!['node_modules','.next','.source','dist','out','content'].includes(e.name)?files(`${dir}/${e.name}`):e.isFile()&&/\.(?:mjs|tsx?)$/.test(e.name)?[`${dir}/${e.name}`]:[]);
 for(const file of [...files('apps/docs'),...files('scripts')].filter(f=>f!=='apps/docs/site-config.mjs')){
  const source=readFileSync(file,'utf8');
  expect(source,file).not.toContain(defaults.origin);
  expect(source,file).not.toMatch(new RegExp(`["'\x60]${defaults.basePath}(?:[/'\x60"]|$)`));
  expect(source,file).not.toMatch(/process\.env\.(?:NEXT_PUBLIC_BASE_PATH|HIG_DOCS_ORIGIN)/);
 }
});
it('preview serves the configured base and rejects paths outside it',async()=>{
 const {spawn}=await import('node:child_process');
 const {createServer}=await import('node:net');
 const port=await new Promise<number>(resolve=>{const server=createServer();server.listen(0,'127.0.0.1',()=>{const address=server.address() as {port:number};server.close(()=>resolve(address.port));});});
 const child=spawn(process.execPath,['scripts/preview-docs.mjs'],{env:{...process.env,HIG_DOCS_PORT:String(port)},stdio:'pipe'});
 try{
  const url=`http://127.0.0.1:${port}`;
  let response:Response|undefined;
  for(let i=0;i<100;i++){try{response=await fetch(`${url}${basePath}/`);break;}catch{await new Promise(r=>setTimeout(r,50));}}
  expect(response?.status).toBe(200);
  if(basePath)expect((await fetch(`${url}/outside/`)).status).toBe(404);
  expect(origin).toMatch(/^https?:\/\//);
 }finally{child.kill();await new Promise<void>(resolve=>child.once('exit',()=>resolve()));}
});
