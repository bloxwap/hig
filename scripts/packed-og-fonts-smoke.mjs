import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {assertGeneratedFonts} from './generated-fonts.mjs';

assertGeneratedFonts();
const directory=mkdtempSync(join(tmpdir(),'hig-og-consumer-'));
const [packed]=JSON.parse(execFileSync('npm',['pack','./packages/og-fonts','--ignore-scripts','--json','--pack-destination',directory],{encoding:'utf8'}));
assert(packed.size<1000000,`OG fonts must stay below 1 MB packed (${packed.size})`);
writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,type:'module'}));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',join(directory,packed.filename),'next@16.4.0','react@19.2.0','react-dom@19.2.0'],{cwd:directory,stdio:'pipe'});
const fontRoot=join(directory,'node_modules/@bloxwap/hig-og-fonts/fonts');
const manifest=JSON.parse(readFileSync(join(fontRoot,'manifest.json'),'utf8'));
const canonical=JSON.parse(readFileSync('packages/native-fonts/fonts/manifest.json','utf8'));
assert.equal(manifest.faces.length,4);
for(const [file,hash] of Object.entries(manifest.outputs)){
 assert.equal(hash,canonical.outputs[file]);assert.equal(createHash('sha256').update(readFileSync(join(fontRoot,file))).digest('hex'),hash);
}
writeFileSync(join(directory,'render.mjs'),`import React from 'react';import {ImageResponse} from 'next/og.js';import {readFile,writeFile} from 'node:fs/promises';
const sans=await readFile(new URL(import.meta.resolve('@bloxwap/hig-og-fonts/fonts/BloxwapSans-SemiBold.ttf')));
const mono=await readFile(new URL(import.meta.resolve('@bloxwap/hig-og-fonts/fonts/BloxwapMono.ttf')));
const image=new ImageResponse(React.createElement('div',{style:{display:'flex',fontFamily:'Bloxwap Sans',fontWeight:600,fontSize:64}},'Bloxwap HIG ',React.createElement('span',{style:{fontFamily:'Bloxwap Mono',fontWeight:400}},'0.1.0')),{width:1200,height:630,fonts:[{name:'Bloxwap Sans',data:sans,weight:600,style:'normal'},{name:'Bloxwap Mono',data:mono,weight:400,style:'normal'}]});
await writeFile('og.png',Buffer.from(await image.arrayBuffer()));\n`);
execFileSync(process.execPath,[join(directory,'render.mjs')],{cwd:directory,stdio:'inherit'});
const png=readFileSync(join(directory,'og.png'));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/packed-og.png',png);
writeFileSync('evidence/packed-og-fonts.json',JSON.stringify({issue:99,package:'@bloxwap/hig-og-fonts',bytes:packed.size,budget:1000000,faces:manifest.faces.map(face=>face.asset),sha256:manifest.outputs,canonicalHashes:'matched',renderer:'next/og, 1200×630 PNG, Sans SemiBold and Mono Regular',published:false},null,2)+'\n');
console.log(`Packed OG consumer: ${packed.size} bytes, four canonical face hashes, next/og PNG rendered`);
