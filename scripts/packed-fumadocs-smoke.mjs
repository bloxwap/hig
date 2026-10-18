import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import assert from 'node:assert/strict';
import {scratchDir} from './scratch.mjs';
// #63: a packed hig-react consumer next to Fumadocs installs with strict peers and shares one Radix tree.
const fumadocs='16.17.3';
const directory=scratchDir('hig-fumadocs-');
const tarball=name=>resolve(`artifacts/bloxwap-hig-${name}-0.1.0.tgz`);
for(const name of ['react','tokens','contracts'])assert.ok(existsSync(tarball(name)),`Run smoke:packed first: missing ${tarball(name)}`);
writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{
 '@bloxwap/hig-react':`file:${tarball('react')}`,'@bloxwap/hig-tokens':`file:${tarball('tokens')}`,'@bloxwap/hig-contracts':`file:${tarball('contracts')}`,
 'fumadocs-ui':fumadocs,'fumadocs-core':fumadocs,next:'16.4.0',react:'19.2.0','react-dom':'19.2.0',
 // Fumadocs supplies dialog and popover; the consumer adds the remaining optional HIG overlay peers at their current releases.
 '@radix-ui/react-dropdown-menu':'^2.1.16','@radix-ui/react-tooltip':'^1.2.8'}},null,2));
const env={...process.env,npm_config_legacy_peer_deps:'false',npm_config_strict_peer_deps:'true'};
const npm=args=>execFileSync('npm',[...args,'--ignore-scripts','--no-audit','--no-fund'],{cwd:directory,stdio:'pipe',env});
npm(['install']);
rmSync(join(directory,'node_modules'),{recursive:true,force:true});
npm(['ci']);
function manifests(dir,found=[]){
 for(const entry of readdirSync(dir,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const path=join(dir,entry.name);
  if(entry.name.startsWith('@')){manifests(path,found);continue;}
  if(existsSync(join(path,'package.json')))found.push(path);
  if(existsSync(join(path,'node_modules')))manifests(join(path,'node_modules'),found);
 }
 return found;
}
const radix=manifests(join(directory,'node_modules')).filter(p=>relative(directory,p).split('node_modules/').pop().startsWith('@radix-ui/'));
const copies=new Map();
for(const path of radix){const name=JSON.parse(readFileSync(join(path,'package.json'),'utf8')).name;copies.set(name,[...(copies.get(name)??[]),relative(directory,path)]);}
const duplicated=[...copies].filter(([,paths])=>paths.length>1);
assert.deepEqual(duplicated,[],`Duplicated Radix packages: ${JSON.stringify(duplicated)}`);
const versions={};
for(const name of ['@radix-ui/react-dialog','@radix-ui/react-popover','@radix-ui/react-dropdown-menu','@radix-ui/react-tooltip']){
 assert.deepEqual(copies.get(name),[`node_modules/${name}`],`${name} must be a single hoisted copy`);
 versions[name]=JSON.parse(readFileSync(join(directory,'node_modules',name,'package.json'),'utf8')).version;
}
assert.equal(existsSync(join(directory,'node_modules/@bloxwap/hig-react/node_modules')),false,'hig-react nests its own dependency tree');
writeFileSync(join(directory,'overlay.mjs'),`import React from 'react';import {renderToString} from 'react-dom/server';
import {Menu,Popover,Tooltip,Dialog} from '@bloxwap/hig-react/overlay';import {TradeEntry} from '@bloxwap/hig-react/recipes';
const h=React.createElement;
const html=renderToString(h('main',null,h(Menu,{label:'Actions',items:[{label:'Copy',onSelect(){}}]}),h(Popover,{label:'Details'},'Body'),h(Tooltip,{content:'Hint'},h('button',null,'Hover')),h(Dialog,{open:false,onOpenChange(){},title:'T',description:'D',trigger:h('button',null,'Open')},'Body'),h(TradeEntry,{asset:'BTC',amount:'1',onAmountChange(){},onConfirm(){},available:'2'})));
for(const text of ['Actions','Details','Hover','Open','Review order'])if(!html.includes(text))throw Error('Missing '+text);`);
execFileSync(process.execPath,[join(directory,'overlay.mjs')],{cwd:directory,stdio:'inherit'});
console.log(`Packed hig-react beside fumadocs-ui ${fumadocs}: strict-peer npm ci, ${radix.length} Radix packages with no duplicates; overlay SSR on ${Object.entries(versions).map(([n,v])=>`${n.replace('@radix-ui/react-','')}@${v}`).join(', ')}`);
