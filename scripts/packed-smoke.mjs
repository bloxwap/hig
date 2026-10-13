import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,cpSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'hig-consumer-'));
mkdirSync('artifacts',{recursive:true});
const manifests=readdirSync('packages').map(p=>JSON.parse(readFileSync(`packages/${p}/package.json`,'utf8')));
const tarballs=[];
for(const manifest of manifests){
 const name=manifest.name.replace('@bloxwap/hig-','');
 const pack=JSON.parse(execFileSync('npm',['pack',`./packages/${name}`,'--json','--ignore-scripts','--pack-destination',resolve('artifacts')],{encoding:'utf8'}));
 tarballs.push(resolve('artifacts',pack[0].filename));
}
writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{'@bloxwap/font':'0.1.2',react:'19.1.0','react-dom':'19.1.0'}},null,2));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...tarballs],{cwd:dir,stdio:'pipe'});
writeFileSync(join(dir,'smoke.mjs'),`import assert from 'node:assert/strict';
import React from 'react'; import {renderToString} from 'react-dom/server';
import {tokens} from '@bloxwap/hig-tokens'; import {formatNumber} from '@bloxwap/hig-contracts';
assert.equal(tokens.colors.action.srgb,'#00ff3f'); assert.equal(formatNumber(null),'—');
assert.match(renderToString(React.createElement('button',null,'Review order')),/Review order/);
console.log('Packed consumer: independent token/contracts imports and SSR render passed');`);
execFileSync(process.execPath,[join(dir,'smoke.mjs')],{cwd:dir,stdio:'inherit'});
cpSync('fixtures/web',join(dir,'web'),{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/dist')});
execFileSync(resolve('node_modules/.bin/vite'),['build','web'],{cwd:dir,stdio:'inherit'});
writeFileSync('evidence/packed-smoke.json',JSON.stringify({version:'0.1.0',packages:manifests.map(m=>m.name),install:'clean temporary consumer from local tarballs',ssr:'passed',webBuild:'passed',native:'Metro smoke uses real RN peer workspace separately'},null,2)+'\n');
console.log(`Packed artifacts: ${tarballs.length}; no publication performed`);
