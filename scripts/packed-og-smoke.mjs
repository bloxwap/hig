import {workspaceVersion} from './workspace-version.mjs';
// #99: a clean OG-card consumer installs the packed @bloxwap/hig-og-fonts tarball next to next/og, verifies every TTF
// against the manifest (and the native manifest it was copied from), and renders 1200x630 PNG cards with the faces.
// It then builds a Next route-handler app (app/og/route.tsx, runtime 'nodejs', the docs/installation.md code) with
// Turbopack (the Next 16 default) and with --webpack, serves it with next start and as moved standalone output, and
// fetches the cards over HTTP.
import {execFileSync,spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {join,resolve} from 'node:path';
import {scratchDir} from './scratch.mjs';
import assert from 'node:assert/strict';
import {requireGeneratedFonts} from './font-preflight.mjs';
requireGeneratedFonts('smoke:packed-og');
if(!existsSync('packages/og-fonts/dist/index.js')||!existsSync('packages/og-fonts/dist/node.js'))throw Error('smoke:packed-og needs packages/og-fonts/dist; run `npm run build` (or `npm run generate && node scripts/build.mjs`) first.');
const limit=1_000_000;
mkdirSync('artifacts',{recursive:true});
const [pack]=JSON.parse(execFileSync('npm',['pack','./packages/og-fonts','--json','--ignore-scripts','--pack-destination',resolve('artifacts')],{encoding:'utf8'}));
const tarball=resolve('artifacts',pack.filename),tarballBytes=readFileSync(tarball);
assert.ok(tarballBytes.length<limit,`@bloxwap/hig-og-fonts packed ${tarballBytes.length} B, over the ${limit} B budget`);
const ttfs=pack.files.map(f=>f.path).filter(p=>p.endsWith('.ttf')).sort();
const nativeManifest=JSON.parse(readFileSync('packages/native-fonts/fonts/manifest.json','utf8'));
const next=JSON.parse(readFileSync('fixtures/next/package.json','utf8')).dependencies;
const dir=scratchDir('hig-og-consumer-');
const root=JSON.parse(readFileSync('package.json','utf8')).devDependencies;
writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{next:next.next,react:next.react,'react-dom':next['react-dom']},devDependencies:{typescript:root.typescript,'@types/node':root['@types/node'],'@types/react':root['@types/react']}},null,2));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',tarball],{cwd:dir,stdio:'pipe'});
writeFileSync(join(dir,'native-manifest.json'),JSON.stringify(nativeManifest));
writeFileSync(join(dir,'og.mjs'),`import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
// next has no exports map, so plain Node ESM names the file; Next/Turbopack hosts write 'next/og'.
import {ImageResponse} from 'next/og.js';
import {fontManifest,ogFonts} from '@bloxwap/hig-og-fonts';
import {loadOgFonts,readOgFont} from '@bloxwap/hig-og-fonts/node';
const require=createRequire(import.meta.url),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// The copy-at-build-time path (edge/Workers hosts): resolve the manifest export and hash every exported file.
const manifest=JSON.parse(readFileSync(require.resolve('@bloxwap/hig-og-fonts/manifest'),'utf8')),nativeManifest=JSON.parse(readFileSync('native-manifest.json','utf8'));
assert.deepEqual(fontManifest,manifest,'Typed manifest equals fonts/manifest.json');
const hashes={};
for(const [asset,hash] of Object.entries(manifest.outputs)){
 const bytes=readFileSync(require.resolve('@bloxwap/hig-og-fonts/fonts/'+asset));
 assert.equal(sha(bytes),hash,asset+' matches the OG manifest');assert.equal(hash,nativeManifest.outputs[asset],asset+' matches the native manifest entry');
 assert.equal(bytes.subarray(0,4).toString('hex'),'00010000',asset+' is a TrueType (not WOFF2) font');hashes[asset]=hash;
}
// The Node path: verified fonts straight into next/og (Satori + resvg).
const fonts=await loadOgFonts();
assert.deepEqual(fonts.map(f=>f.name+' '+f.weight),ogFonts.map(f=>f.name+' '+f.weight));
const h=React.createElement;
const card=(weight,family='Bloxwap Sans')=>h('div',{style:{display:'flex',flexDirection:'column',width:'100%',height:'100%',padding:80,background:'#0a0a0a',color:'#ffffff',fontFamily:family,fontWeight:weight}},h('div',{style:{fontSize:96}},'Bloxwap HIG'),h('div',{style:{fontSize:40,fontFamily:'Bloxwap Mono',fontWeight:500,color:'#00ff3f'}},'${workspaceVersion} CANDIDATE 1,234.56'));
async function png(element,options){const bytes=Buffer.from(await new ImageResponse(element,{width:1200,height:630,...options}).arrayBuffer());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);return bytes;}
const renders={};
for(const weight of [400,500,700,900])renders[weight]=await png(card(weight),{fonts});
const fallback=await png(card(700));
assert.equal(new Set(Object.values(renders).map(sha)).size,4,'Each Bloxwap Sans weight renders differently');
assert.notEqual(sha(renders[700]),sha(fallback),'Bloxwap faces replace the next/og default font');
writeFileSync('og-card.png',renders[700]);
for(const [weight,bytes] of Object.entries(renders))writeFileSync('og-'+weight+'.png',bytes);
// A tampered face is rejected before it reaches the renderer.
const bold=require.resolve('@bloxwap/hig-og-fonts/fonts/BloxwapSans-Bold.ttf'),original=readFileSync(bold);
writeFileSync(bold,Buffer.concat([original,Buffer.from([0])]));
await assert.rejects(readOgFont('BloxwapSans-Bold.ttf'),/does not match the manifest/);
writeFileSync(bold,original);
console.log(JSON.stringify({hashes,pngBytes:Object.fromEntries(Object.entries(renders).map(([w,b])=>[w,b.length])),fallbackPngBytes:fallback.length}));
`);
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
const result=JSON.parse(execFileSync(process.execPath,['og.mjs'],{cwd:dir,encoding:'utf8',env}).trim().split('\n').at(-1));
mkdirSync('artifacts/og',{recursive:true});writeFileSync('artifacts/og/og-card.png',readFileSync(join(dir,'og-card.png')));
// The documented Next usage: a route handler bundled by Next. Under Turbopack and webpack every face must read its own file.
const card=`function Card({weight}: {weight: number}) {
  return <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: 80, background: '#0a0a0a', color: '#ffffff', fontFamily: 'Bloxwap Sans', fontWeight: weight}}><div style={{fontSize: 96}}>Bloxwap HIG</div><div style={{fontSize: 40, fontFamily: 'Bloxwap Mono', fontWeight: 500, color: '#00ff3f'}}>${workspaceVersion} CANDIDATE 1,234.56</div></div>;
}`;
const app={
 'tsconfig.json':JSON.stringify({compilerOptions:{target:'ES2022',lib:['dom','dom.iterable','esnext'],skipLibCheck:true,strict:true,noEmit:true,esModuleInterop:true,module:'esnext',moduleResolution:'bundler',resolveJsonModule:true,isolatedModules:true,jsx:'react-jsx',plugins:[{name:'next'}]},include:['next-env.d.ts','**/*.ts','**/*.tsx','.next/types/**/*.ts'],exclude:['node_modules']},null,2),
 'app/layout.tsx':`export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }\n`,
 'app/page.tsx':`export default function Page() { return <p>OG consumer</p>; }\n`,
 // docs/installation.md and packages/og-fonts/README.md: top-level loadOgFonts(), runtime 'nodejs'.
 'app/og/route.tsx':`import {ImageResponse} from 'next/og';
import type {NextRequest} from 'next/server';
import {loadOgFonts} from '@bloxwap/hig-og-fonts/node';

export const runtime = 'nodejs';
const fonts = await loadOgFonts();
${card}
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return new ImageResponse(<Card weight={Number(params.get('weight') ?? 700)} />, {width: 1200, height: 630, ...(params.has('fallback') ? {} : {fonts})});
}
`,
 // docs/migration/sdk-docs.md: chart, sfx and agent-cli pass a subset.
 'app/og-fonts/route.ts':`import {createHash} from 'node:crypto';
import {ogFonts} from '@bloxwap/hig-og-fonts';
import {loadOgFonts} from '@bloxwap/hig-og-fonts/node';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex');
export async function GET() {
  const all = await loadOgFonts(), bold = await loadOgFonts(ogFonts.filter(f => f.weight >= 700));
  const describe = (fonts: typeof all) => fonts.map(f => ({name: f.name, weight: f.weight, sha256: sha(f.data)}));
  return Response.json({all: describe(all), bold: describe(bold)});
}
`};
for(const [file,source] of Object.entries(app)){mkdirSync(join(dir,file,'..'),{recursive:true});writeFileSync(join(dir,file),source);}
const freePort=()=>new Promise((ok,fail)=>{const server=createServer().once('error',fail).listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>ok(port));});});
const nextBin=join(dir,'node_modules/next/dist/bin/next'),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const expectedFaces=manifest=>manifest.faces.map(f=>({name:f.family.replace('Bloxwap','Bloxwap '),weight:f.weight,sha256:manifest.outputs[f.asset]}));
const ogManifest=JSON.parse(readFileSync('packages/og-fonts/fonts/manifest.json','utf8'));
// next start for both bundlers, then output: 'standalone' copied to another directory with the consumer's node_modules
// hidden. Turbopack's standalone output carries the faces itself. webpack bakes the node_modules path in, so a webpack
// standalone build that moves needs serverExternalPackages (docs/installation.md).
const cases=[
 {name:'turbopack',flags:[],config:{},serve:'next start'},
 {name:'webpack',flags:['--webpack'],config:{},serve:'next start'},
 {name:'turbopack-standalone',flags:[],config:{output:'standalone'},serve:'standalone, moved'},
 {name:'webpack-standalone-external',flags:['--webpack'],config:{output:'standalone',serverExternalPackages:['@bloxwap/hig-og-fonts']},serve:'standalone, moved'},
];
const routeHandler={};
for(const {name,flags,config,serve} of cases){
 const bundler=flags.includes('--webpack')?'webpack':'turbopack';
 rmSync(join(dir,'.next'),{recursive:true,force:true});
 writeFileSync(join(dir,'next.config.mjs'),`export default ${JSON.stringify(config)};\n`);
 const build=execFileSync(process.execPath,[nextBin,'build',...flags],{cwd:dir,encoding:'utf8',env,stdio:['ignore','pipe','pipe']});
 assert.match(build,bundler==='turbopack'?/Turbopack/:/webpack/,`${name}: next build ${flags.join(' ')} used ${bundler}`);
 const port=Number(process.env.OG_SMOKE_PORT)||await freePort(),base=`http://127.0.0.1:${port}`;
 let server,moved,hidden=false;
 if(serve==='next start')server=spawn(process.execPath,[nextBin,'start','-p',String(port),'-H','127.0.0.1'],{cwd:dir,env,stdio:['ignore','pipe','pipe']});
 else{
  moved=scratchDir('hig-og-standalone-');execFileSync('cp',['-R',join(dir,'.next/standalone')+'/.',moved]);
  renameSync(join(dir,'node_modules'),join(dir,'node_modules.off'));hidden=true;
  server=spawn(process.execPath,['server.js'],{cwd:moved,env:{...env,PORT:String(port),HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
 }
 let log='';server.stdout.on('data',d=>{log+=d;});server.stderr.on('data',d=>{log+=d;});
 try{
  for(let i=0;;i++){try{if((await fetch(base+'/')).ok)break;}catch{/* not listening yet */}if(i>=120||server.exitCode!==null)throw Error(`${name}: ${serve} did not come up:\n${log}`);await new Promise(r=>setTimeout(r,500));}
  const get=async path=>{const res=await fetch(base+path),body=Buffer.from(await res.arrayBuffer());assert.equal(res.status,200,`${name} GET ${path}: ${res.status} ${body.toString('utf8').slice(0,400)}\n${log}`);return {res,body};};
  const faces=JSON.parse((await get('/og-fonts')).body.toString('utf8'));
  assert.deepEqual(faces.all,expectedFaces(ogManifest),`${name}: loadOgFonts() returns each face's own bytes`);
  assert.deepEqual(faces.bold,expectedFaces(ogManifest).filter(f=>f.weight>=700),`${name}: loadOgFonts(subset) returns the subset`);
  const cards={};
  for(const weight of [400,500,700,900]){
   const {res,body}=await get(`/og?weight=${weight}`);
   assert.equal(res.headers.get('content-type'),'image/png');assert.equal(body.readUInt32BE(16),1200);assert.equal(body.readUInt32BE(20),630);
   assert.equal(sha(body),sha(readFileSync(join(dir,`og-${weight}.png`))),`${name} /og?weight=${weight} equals the plain Node render`);
   cards[weight]=body.length;
  }
  const fallback=(await get('/og?fallback&weight=700')).body;
  assert.notEqual(sha(fallback),sha(readFileSync(join(dir,'og-700.png'))),`${name}: the route's Bloxwap faces replace the default font`);
  if(name==='turbopack')writeFileSync('artifacts/og/og-card-route-turbopack.png',(await get('/og?weight=700')).body);
  routeHandler[name]={build:['next build',...flags].join(' '),nextConfig:config,serve,status:200,contentType:'image/png',faces:faces.all.length,pngBytes:cards,fallbackPngBytes:fallback.length};
 }finally{
  server.kill('SIGTERM');await new Promise(r=>server.exitCode!==null?r():server.once('exit',r));
  if(hidden)renameSync(join(dir,'node_modules.off'),join(dir,'node_modules'));
  if(moved)rmSync(moved,{recursive:true,force:true});
 }
}
const evidence={version:workspaceVersion,evidence:'automated (local tarball, clean temporary consumer)',package:'@bloxwap/hig-og-fonts',tarball:{file:pack.filename,bytes:tarballBytes.length,unpackedBytes:pack.unpackedSize,sha256:createHash('sha256').update(tarballBytes).digest('hex'),limit},fonts:ttfs,hashesMatchNativeManifest:true,consumer:{next:next.next,react:next.react,renderer:'next/og ImageResponse (Satori + resvg), Node runtime'},checks:['Manifest export and fonts/* exports resolve; every TTF SHA-256 equals fonts/manifest.json and the @bloxwap/hig-native-fonts entry','loadOgFonts() returns Satori-shaped fonts; four Bloxwap Sans weights render four different 1200x630 PNGs, all different from the next/og default font','readOgFont() rejects a tampered face','A Next app/og/route.tsx handler (runtime nodejs, top-level loadOgFonts() as in docs/installation.md) built with Turbopack (default next build) and with next build --webpack and served by next start, plus Turbopack output: standalone and webpack output: standalone with serverExternalPackages, each copied to another directory with the consumer node_modules hidden: GET /og-fonts returns every face with its own manifest SHA-256 (all five, and the weight >= 700 subset); GET /og returns 200 image/png 1200x630 for each Sans weight, byte-identical to the plain Node render and different from the default font'],pngBytes:result.pngBytes,nextRouteHandler:routeHandler};
writeFileSync('evidence/packed-og-smoke.json',JSON.stringify(evidence,null,2)+'\n');
console.log(`Packed OG fonts: ${pack.filename} ${tarballBytes.length} B (< ${limit} B), ${ttfs.length} TTFs verified against the manifest and rendered through next/og ${next.next}; Next route handler served the cards in ${Object.keys(routeHandler).join(', ')}`);
