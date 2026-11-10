import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import semver from 'semver';
import {scratchDir} from './scratch.mjs';
import {packedTarball} from './workspace-version.mjs';
import {assertCSSDeclarations} from './css-exports.mjs';

const source=JSON.parse(readFileSync('packages/hig/package.json','utf8'));
assertCSSDeclarations(source,'packages/hig');
const directory=scratchDir('hig-packed-compat-');
const peers=Object.fromEntries(['@bloxwap/chart','@bloxwap/haptic','@bloxwap/sfx'].map(name=>{
 const minimum=semver.minVersion(source.peerDependencies[name]);
 assert.ok(minimum,`${name}: peer range must have a minimum`);
 return [name,minimum.version];
}));
writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{
 ...peers,react:'19.1.0','react-dom':'19.1.0',
 '@types/react':'19.1.16','@types/react-dom':'19.1.9','@types/node':'22.18.10',
 typescript:'6.0.3','typescript-7':'npm:typescript@7.0.2'
}}));
execFileSync('npm',['install','--strict-peer-deps','--ignore-scripts','--no-audit','--no-fund',packedTarball()],{cwd:directory,stdio:'inherit'});
for(const [name,version] of Object.entries(peers)){
 assert.equal(JSON.parse(readFileSync(join(directory,'node_modules',name,'package.json'),'utf8')).version,version);
 console.log(`Minimum peer: ${name}@${version}`);
}
const installed=join(directory,'node_modules/@bloxwap/hig');
const manifest=JSON.parse(readFileSync(join(installed,'package.json'),'utf8'));
const entries=assertCSSDeclarations(manifest,installed);
writeFileSync(join(directory,'css.ts'),entries.map(([key])=>`import '${manifest.name}${key.slice(1)}';`).join('\n'));
// Check implementation calls as well as published signatures: declaration emission can hide
// an incompatible hook or options object. Resolve these source copies ONLY against installed peers.
mkdirSync(join(directory,'source'));
for(const entry of ['feedback','chart'])cpSync(`packages/hig/${entry}/src`,join(directory,'source',entry),{recursive:true});
const consumer=`import React from 'react';
import {renderToString} from 'react-dom/server';
import {PriceChart} from '@bloxwap/hig/chart';
import {createWebSoundAdapter} from '@bloxwap/hig/feedback/web-sound';
import {HapticFeedbackTarget} from '@bloxwap/hig/feedback/web-haptic';
const sound=createWebSoundAdapter();
const html=renderToString(React.createElement(React.Fragment,null,
 React.createElement(HapticFeedbackTarget,{eligible:true,children:React.createElement('button',{type:'button',disabled:false},'Minimum haptic target')}),
 React.createElement(PriceChart,{summary:'Minimum peers chart',data:[]})));
if(!html.includes('Minimum haptic target'))throw Error('Missing haptic SSR target');
if(!html.includes('Minimum peers chart')||!html.includes('Loading chart'))throw Error('Missing chart SSR summary/fallback');
if(sound.capability.available)throw Error('Sound should be unavailable in SSR');
await sound.play({id:'ssr',source:'compat',intent:'activate',origin:'programmatic'},{version:1,sound:true,haptics:true,volume:.4,motion:false});
sound.dispose?.();
`;
writeFileSync(join(directory,'consumer.ts'),consumer);
writeFileSync(join(directory,'consumer.mjs'),consumer);
// web-haptics (a transitive peer dependency) has invalid ambient initializers. Skip its
// declaration internals; consumer calls and the copied adapter implementations remain checked.
for(const moduleResolution of ['Bundler','NodeNext']){
 writeFileSync(join(directory,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:moduleResolution==='Bundler'?'ESNext':'NodeNext',moduleResolution,jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true,noUncheckedSideEffectImports:true,types:['node'],esModuleInterop:true},files:['css.ts','consumer.ts','source/chart/index.tsx','source/feedback/web-sound.ts','source/feedback/web-haptic.tsx']}));
 for(const compiler of ['typescript','typescript-7']){
  execFileSync(process.execPath,[join(directory,`node_modules/${compiler}/bin/tsc`),'-p','tsconfig.json'],{cwd:directory,stdio:'inherit'});
  console.log(`Packed CSS and minimum peer types: ${compiler}, ${moduleResolution} passed`);
 }
}
execFileSync(process.execPath,[join(directory,'consumer.mjs')],{cwd:directory,stdio:'inherit'});
console.log('Packed minimum web peers: chart/haptic SSR and sound invocation passed');
