// #99: a clean OG-card consumer installs the packed @bloxwap/hig-og-fonts tarball next to next/og, verifies every TTF
// against the manifest (and the native manifest it was copied from), and renders 1200x630 PNG cards with the faces.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
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
const dir=mkdtempSync(join(tmpdir(),'hig-og-consumer-'));
writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{next:next.next,react:next.react,'react-dom':next['react-dom']}},null,2));
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
const card=(weight,family='Bloxwap Sans')=>h('div',{style:{display:'flex',flexDirection:'column',width:'100%',height:'100%',padding:80,background:'#0a0a0a',color:'#ffffff',fontFamily:family,fontWeight:weight}},h('div',{style:{fontSize:96}},'Bloxwap HIG'),h('div',{style:{fontSize:40,fontFamily:'Bloxwap Mono',fontWeight:500,color:'#00ff3f'}},'0.1.0 CANDIDATE 1,234.56'));
async function png(element,options){const bytes=Buffer.from(await new ImageResponse(element,{width:1200,height:630,...options}).arrayBuffer());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG signature');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);return bytes;}
const renders={};
for(const weight of [400,500,700,900])renders[weight]=await png(card(weight),{fonts});
const fallback=await png(card(700));
assert.equal(new Set(Object.values(renders).map(sha)).size,4,'Each Bloxwap Sans weight renders differently');
assert.notEqual(sha(renders[700]),sha(fallback),'Bloxwap faces replace the next/og default font');
writeFileSync('og-card.png',renders[700]);
// A tampered face is rejected before it reaches the renderer.
const bold=require.resolve('@bloxwap/hig-og-fonts/fonts/BloxwapSans-Bold.ttf'),original=readFileSync(bold);
writeFileSync(bold,Buffer.concat([original,Buffer.from([0])]));
await assert.rejects(readOgFont('BloxwapSans-Bold.ttf'),/does not match the manifest/);
writeFileSync(bold,original);
console.log(JSON.stringify({hashes,pngBytes:Object.fromEntries(Object.entries(renders).map(([w,b])=>[w,b.length])),fallbackPngBytes:fallback.length}));
`);
const result=JSON.parse(execFileSync(process.execPath,['og.mjs'],{cwd:dir,encoding:'utf8',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}}).trim().split('\n').at(-1));
mkdirSync('artifacts/og',{recursive:true});writeFileSync('artifacts/og/og-card.png',readFileSync(join(dir,'og-card.png')));
const evidence={version:'0.1.0',evidence:'automated (local tarball, clean temporary consumer)',package:'@bloxwap/hig-og-fonts',tarball:{file:pack.filename,bytes:tarballBytes.length,unpackedBytes:pack.unpackedSize,sha256:createHash('sha256').update(tarballBytes).digest('hex'),limit},fonts:ttfs,hashesMatchNativeManifest:true,consumer:{next:next.next,react:next.react,renderer:'next/og ImageResponse (Satori + resvg), Node runtime'},checks:['Manifest export and fonts/* exports resolve; every TTF SHA-256 equals fonts/manifest.json and the @bloxwap/hig-native-fonts entry','loadOgFonts() returns Satori-shaped fonts; four Bloxwap Sans weights render four different 1200x630 PNGs, all different from the next/og default font','readOgFont() rejects a tampered face'],pngBytes:result.pngBytes};
writeFileSync('evidence/packed-og-smoke.json',JSON.stringify(evidence,null,2)+'\n');
console.log(`Packed OG fonts: ${pack.filename} ${tarballBytes.length} B (< ${limit} B), ${ttfs.length} TTFs verified against the manifest and rendered through next/og ${next.next}`);
