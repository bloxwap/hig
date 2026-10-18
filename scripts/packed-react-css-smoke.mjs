// #95: @bloxwap/hig-react/css must not restyle elements outside HIG components. A host that loads it on
// some routes only (taptradetv's /sponsors) keeps the stylesheet after a client navigation, so any
// page-wide rule leaks into the rest of the site. This smoke installs the packed tokens, contracts and
// React tarballs into an empty consumer, renders real HIG components to static markup, and serves three
// script-free pages that differ only in their stylesheets:
//   control: tokens CSS only
//   hig:     tokens + @bloxwap/hig-react/css
//   base:    tokens + @bloxwap/hig-react/css/base + @bloxwap/hig-react/css (the opt-in page-wide defaults)
// Plain table/th/td, input[type=range], a plain button's focus ring, box-sizing and a stray
// [data-severity] must compute the same on `hig` as on `control`. The `base` page must differ, which
// proves the probe can see a leak. HIG components must look the same on `hig` and `base`, so nothing a
// component needs lives only in the opt-in base.
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve,normalize,extname} from 'node:path';
import {scratchDir} from './scratch.mjs';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from '@playwright/test';

const engines=(process.env.HIG_PACKED_REACT_CSS_BROWSERS??'chromium,firefox,webkit').split(',').map(s=>s.trim()).filter(Boolean);
const port=Number(process.env.HIG_PACKED_REACT_CSS_PORT??4187);

mkdirSync('artifacts',{recursive:true});
const pack=name=>resolve('artifacts',JSON.parse(execFileSync('npm',['pack',`./packages/${name}`,'--json','--ignore-scripts','--pack-destination',resolve('artifacts')],{encoding:'utf8'}))[0].filename);
const tarballs=['tokens','contracts','react'].map(pack);
const dir=scratchDir('hig-react-css-scope-');
writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',name:'hig-react-css-scope-consumer'},null,2));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...tarballs,'react@19.2.0','react-dom@19.2.0'],{cwd:dir,stdio:'pipe'});
const exported=(pkg,key)=>{const manifest=JSON.parse(readFileSync(join(dir,'node_modules',pkg,'package.json'),'utf8'));const target=manifest.exports[key];assert.equal(typeof target,'string',`${pkg} exports ${key}`);const path=`node_modules/${pkg}/${target.replace(/^\.\//,'')}`;assert.ok(existsSync(join(dir,path)),`${path} is packed`);return path;};
const css={tokens:exported('@bloxwap/hig-tokens','./css'),hig:exported('@bloxwap/hig-react','./css'),base:exported('@bloxwap/hig-react','./css/base')};

// Real component markup from the packed package, so the classes checked here are the ones components emit.
writeFileSync(join(dir,'render.mjs'),`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {Table} from '@bloxwap/hig-react/data';import {Slider} from '@bloxwap/hig-react/selection';import {Button} from '@bloxwap/hig-react/button';import {Alert} from '@bloxwap/hig-react/status';
const h=React.createElement;
process.stdout.write(renderToStaticMarkup(h('div',{id:'hig'},
 h(Button,{id:'hig-button'},'HIG button'),
 h(Table,{caption:'Prices',rows:[{id:'btc',price:1}],keyFor:r=>r.id,columns:[{key:'name',label:'Market',render:r=>r.id},{key:'price',label:'Price',render:r=>String(r.price)}]}),
 h(Slider,{label:'Amount',defaultValue:25}),
 h(Alert,{title:'Heads up',severity:'error',announce:false},'Body'))));`);
const higMarkup=execFileSync(process.execPath,['render.mjs'],{cwd:dir,encoding:'utf8'});
for(const needle of ["class=\"hig-table\"",'class="hig-range"','class="hig-button','data-severity="error"'])assert.ok(higMarkup.includes(needle),`component markup carries ${needle}`);
const plainMarkup=`<div id="plain">
<button id="plain-button" type="button">Plain button</button>
<table id="plain-table"><thead><tr><th id="plain-th">Day</th></tr></thead><tbody><tr><td id="plain-td">Monday</td></tr></tbody></table>
<input id="plain-range" type="range" aria-label="Plain range">
<div id="plain-box" style="width:100px;padding:10px;border:2px solid">Box</div>
<section id="plain-severity" data-severity="error">Host log line</section>
</div>`;
const pages={control:[css.tokens],hig:[css.tokens,css.hig],base:[css.tokens,css.base,css.hig]};
for(const [name,sheets] of Object.entries(pages))writeFileSync(join(dir,`${name}.html`),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HIG CSS scope: ${name}</title><link rel="icon" href="data:,">${sheets.map(s=>`<link rel="stylesheet" href="/${s}">`).join('')}</head><body>\n${plainMarkup}\n${higMarkup}\n</body></html>\n`);

const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=createServer((req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=normalize(join(dir,path));if(!file.startsWith(dir)||!existsSync(file)||!types[extname(file)]){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':types[extname(file)]}).end(readFileSync(file));});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});

const box=['boxSizing'];
const cell=['paddingTop','paddingInlineStart','textAlign','borderBottomWidth','borderBottomStyle','borderBottomColor'];
const focus=['outlineStyle','outlineWidth','outlineColor','outlineOffset'];
const probes={
 plain:{'plain-table':['borderCollapse','width',...box],'plain-th':[...cell,...box],'plain-td':[...cell,...box],'plain-range':['accentColor','minHeight','width','height',...box],'plain-button':[...box],'plain-box':[...box,'offsetWidth'],'plain-severity':['borderInlineStartWidth','borderInlineStartStyle']},
 hig:{'hig-button':['minHeight','borderRadius',...box],'hig .hig-table':['borderCollapse','width',...box],'hig .hig-table th':[...cell,...box],'hig .hig-table td':[...cell,...box],'hig .hig-range':['accentColor','minHeight','width',...box],'hig [data-severity]':['borderInlineStartWidth','borderInlineStartStyle','borderInlineStartColor']},
};
async function read(page,map){return page.evaluate(map=>Object.fromEntries(Object.entries(map).map(([key,props])=>{const el=key.includes(' ')?document.querySelector(`#${key.split(' ')[0]} ${key.split(' ').slice(1).join(' ')}`):document.getElementById(key);if(!el)return [key,null];const s=getComputedStyle(el);return [key,Object.fromEntries(props.map(p=>[p,p==='offsetWidth'?el.offsetWidth:s[p]]))];})),map);}
async function focusRing(page,id){
 // Keyboard modality first, so the programmatic focus that follows matches :focus-visible in every engine.
 await page.keyboard.press('Shift');await page.locator(`#${id}`).focus();
 const result=await page.evaluate(([id,props])=>{const el=document.getElementById(id);const s=getComputedStyle(el);return {focusVisible:el.matches(':focus-visible'),active:document.activeElement===el,...Object.fromEntries(props.map(p=>[p,s[p]]))};},[id,focus]);
 await page.evaluate(()=>document.activeElement?.blur());
 return result;
}

const results=[];
try{
 for(const engine of engines){
  const launcher={chromium,firefox,webkit}[engine];if(!launcher)throw Error(`Unsupported browser ${engine}`);
  const browser=await launcher.launch({headless:true,args:engine==='chromium'?['--no-sandbox','--disable-dev-shm-usage']:[]});
  try{
   const seen={};
   for(const name of Object.keys(pages)){
    const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(`http://127.0.0.1:${port}/${name}.html`,{waitUntil:'load'});
    assert.equal(await page.evaluate(()=>document.scripts.length),0,`${engine} ${name}: page runs no script`);
    assert.equal(await page.evaluate(()=>document.styleSheets.length),pages[name].length,`${engine} ${name}: every stylesheet loaded`);
    const plainFocus=await focusRing(page,'plain-button'),higFocus=await focusRing(page,'hig-button');
    for(const [label,f] of [['plain button',plainFocus],['HIG button',higFocus]])assert.ok(f.active&&f.focusVisible,`${engine} ${name}: ${label} is focused and matches :focus-visible`);
    seen[name]={plain:await read(page,probes.plain),hig:await read(page,probes.hig),plainFocus,higFocus};
    assert.deepEqual(errors,[],`${engine} ${name}: no page errors`);
    await context.close();
   }
   const {control,hig,base}=seen;
   // 1. Importing @bloxwap/hig-react/css alone leaves non-HIG elements exactly as the host styled them.
   assert.deepEqual(hig.plain,control.plain,`${engine}: @bloxwap/hig-react/css changes plain table/th/td, range, box-sizing or [data-severity]`);
   assert.deepEqual(hig.plainFocus,control.plainFocus,`${engine}: @bloxwap/hig-react/css changes a plain button's focus ring`);
   // 2. The probe sees a leak: the opt-in base restyles the same plain elements.
   assert.equal(base.plain['plain-box'].boxSizing,'border-box',`${engine}: base sets box-sizing on plain elements`);
   assert.notEqual(control.plain['plain-box'].boxSizing,'border-box',`${engine}: control page keeps the UA box-sizing`);
   assert.equal(base.plain['plain-th'].paddingTop,'12px',`${engine}: base styles plain th`);
   assert.equal(base.plain['plain-table'].borderCollapse,'collapse',`${engine}: base styles plain table`);
   assert.equal(base.plain['plain-range'].minHeight,'48px',`${engine}: base styles plain range`);
   assert.equal(base.plainFocus.outlineWidth,'2px',`${engine}: base draws the HIG ring on a plain button`);
   assert.equal(base.plainFocus.outlineOffset,'3px',`${engine}: base offsets the HIG ring on a plain button`);
   assert.notDeepEqual(base.plainFocus,control.plainFocus,`${engine}: base changes the plain focus ring`);
   // 3. Components keep their styling without the base.
   assert.equal(hig.hig['hig .hig-table th'].paddingTop,'12px',`${engine}: Table header cells keep 12px padding`);
   assert.equal(hig.hig['hig .hig-table'].borderCollapse,'collapse',`${engine}: Table keeps collapsed borders`);
   assert.equal(hig.hig['hig .hig-range'].minHeight,'48px',`${engine}: Slider keeps its 48px target`);
   assert.equal(hig.hig['hig-button'].boxSizing,'border-box',`${engine}: HIG elements keep border-box`);
   assert.equal(hig.hig['hig [data-severity]'].borderInlineStartWidth,'3px',`${engine}: Alert keeps its severity rule`);
   assert.equal(hig.higFocus.outlineWidth,'2px',`${engine}: HIG button keeps the focus ring`);
   assert.equal(hig.higFocus.outlineOffset,'3px',`${engine}: HIG button keeps the ring offset`);
   assert.deepEqual(hig.hig,base.hig,`${engine}: HIG components compute differently with and without the base`);
   assert.deepEqual(hig.higFocus,base.higFocus,`${engine}: HIG focus ring differs with and without the base`);
   results.push({engine,browser:browser.version(),control:{plain:control.plain,plainFocus:control.plainFocus},hig:{plain:hig.plain,plainFocus:hig.plainFocus,components:hig.hig,componentFocus:hig.higFocus},base:{plain:base.plain,plainFocus:base.plainFocus}});
  }finally{await browser.close();}
 }
}finally{server.close();}

mkdirSync('evidence',{recursive:true});
writeFileSync('evidence/packed-react-css-scope.json',JSON.stringify({version:'0.1.0',issue:'bloxwap/hig#95',kind:'automated browser (headless Playwright); no physical-device claim',platform:`${process.platform} ${process.arch}`,consumer:'script-free HTML; packed tokens, contracts and React tarballs; component markup from renderToStaticMarkup of the packed package',pages:Object.fromEntries(Object.entries(pages).map(([k,v])=>[k,v.map(p=>p.replace(/^node_modules\//,''))])),checks:['@bloxwap/hig-react/css leaves plain table/th/td, input[type=range], box-sizing and [data-severity] equal to the tokens-only page','@bloxwap/hig-react/css leaves a plain button focus ring equal to the tokens-only page','@bloxwap/hig-react/css/base restyles the same plain elements (the probe detects leaks)','Table, Slider, Button focus ring and Alert severity compute the same with and without the base'],results},null,2)+'\n');
console.log(`Packed React CSS scope: plain elements unchanged by @bloxwap/hig-react/css, base opt-in effective, components unchanged without base in ${engines.join(', ')}`);
