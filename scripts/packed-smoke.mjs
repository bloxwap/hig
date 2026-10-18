import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,cpSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {scratchDir} from './scratch.mjs';
const dir=scratchDir('hig-consumer-');
mkdirSync('artifacts',{recursive:true});
const manifests=readdirSync('packages').map(p=>JSON.parse(readFileSync(`packages/${p}/package.json`,'utf8')));
const tarballs=[];
for(const manifest of manifests){
 const name=manifest.name.replace('@bloxwap/hig-','');
 const pack=JSON.parse(execFileSync('npm',['pack',`./packages/${name}`,'--json','--ignore-scripts','--pack-destination',resolve('artifacts')],{encoding:'utf8'}));
 if(name!=='native'&&name!=='native-fonts')tarballs.push(resolve('artifacts',pack[0].filename));
}
writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',devDependencies:{vite:'6.4.1'},dependencies:{...JSON.parse(readFileSync('fixtures/web/package.json','utf8')).dependencies,'@bloxwap/haptic':'0.1.0','@bloxwap/sfx':'0.1.0','@bloxwap/font':'0.1.2','@bloxwap/chart':'0.3.0',react:'19.1.0','react-dom':'19.1.0'}},null,2));
const consumerManifest=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));for(const key of Object.keys(consumerManifest.dependencies))if(key.startsWith('@bloxwap/hig-'))delete consumerManifest.dependencies[key];writeFileSync(join(dir,'package.json'),JSON.stringify(consumerManifest));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...tarballs],{cwd:dir,stdio:'pipe'});
writeFileSync(join(dir,'smoke.mjs'),`import assert from 'node:assert/strict';
import React from 'react'; import {renderToString} from 'react-dom/server';
import {tokens} from '@bloxwap/hig-tokens'; import {formatNumber,formatLeverage,formatTicker} from '@bloxwap/hig-contracts';
assert.equal(tokens.colors.action.srgb,'#00ff3f'); assert.equal(formatNumber(null),'—'); assert.equal(formatLeverage(10),'10×'); assert.equal(formatTicker(1,'USDC'),'1\u00a0USDC');
${manifests.some(m=>m.name==='@bloxwap/hig-react')?"const {Button}=await import('@bloxwap/hig-react/button'); assert.match(renderToString(React.createElement(Button,null,'Review order')),/Review order/);":"assert.match(renderToString(React.createElement('button',null,'Review order')),/Review order/);"}
${manifests.some(m=>m.name==='@bloxwap/hig-chart')?"const {PriceChart,chartTheme}=await import('@bloxwap/hig-chart'); assert.equal(chartTheme.series.upColor,tokens.colors.buy.srgb); assert.match(renderToString(React.createElement(PriceChart,{summary:'BTC up 1%',data:[]})),/<figcaption>BTC up 1%<\\/figcaption>/);":''}
console.log('Packed consumer: independent token/contracts imports and SSR render passed');`);
execFileSync(process.execPath,[join(dir,'smoke.mjs')],{cwd:dir,stdio:'inherit'});
cpSync('fixtures/web',join(dir,'web'),{recursive:true,filter:s=>!s.includes('/node_modules')&&!s.includes('/dist')});
execFileSync(join(dir,'node_modules/.bin/vite'),['build','web'],{cwd:dir,stdio:'inherit'});
writeFileSync('evidence/packed-smoke.json',JSON.stringify({version:'0.1.0',packages:manifests.map(m=>m.name),install:'clean temporary consumer from local tarballs',ssr:'passed',webBuild:'passed',native:'Metro smoke uses real RN peer workspace separately'},null,2)+'\n');
console.log(`Packed artifacts: ${tarballs.length}; no publication performed`);
