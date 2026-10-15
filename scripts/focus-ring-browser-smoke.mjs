import {chromium,firefox,webkit} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PNG} from 'pngjs';
import {HIGProvider} from '../packages/react/dist/provider.js';
import {Slider} from '../packages/react/dist/selection.js';
import {compareVisual} from './visual-diff.mjs';
// #69: a keyboard-focused Slider's ring must stay clear of its label at both densities, in every engine.
const font=readFileSync('node_modules/@bloxwap/font/fonts/BloxwapSans/BloxwapSans-Variable.woff2').toString('base64');
const css=`@font-face{font-family:'Bloxwap Sans';font-weight:100 900;src:url(data:font/woff2;base64,${font}) format('woff2')}`+readFileSync('packages/tokens/dist/tokens.css','utf8')+readFileSync('packages/react/dist/styles.css','utf8');
const markup=density=>renderToStaticMarkup(React.createElement(HIGProvider,{density},React.createElement(Slider,{label:'Volume preview',defaultValue:25})));
const engines={chromium,firefox,webkit};const selected=process.env.HIG_BROWSER?[process.env.HIG_BROWSER]:Object.keys(engines);
mkdirSync('artifacts/visual',{recursive:true});const results=[];const failures=[];
for(const name of selected){

 const browser=await engines[name].launch({headless:true,...(name==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:240},deviceScaleFactor:1,reducedMotion:'reduce'});
  // `tight` mimics a host stylesheet (Fumadocs prose, Tailwind resets) that collapses the label gap.
  for(const [density,host] of [['comfortable',''],['compact',''],['compact','tight']]){
   await page.setContent(`<!doctype html><html><head><style>${css}${host?'.hig-field{gap:0}':''}body{margin:0;padding:24px;background:var(--hig-background);color:var(--hig-text);font:16px/1.5 'Bloxwap Sans',sans-serif}</style></head><body><div id="field">${markup(density)}</div><button type="button" style="margin-top:48px">After</button></body></html>`);
   await page.evaluate(()=>document.fonts.ready);
   const box=await page.evaluate(()=>{const r=e=>{const b=document.querySelector(e).getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right};};return {field:r('.hig-slider'),label:r('.hig-slider label'),input:r('.hig-range')};});
   const clip={x:0,y:Math.max(0,box.field.top-12),width:390,height:box.field.bottom-box.field.top+24};
   await page.locator('button').focus();const rest=PNG.sync.read(await page.screenshot({clip,animations:'disabled',caret:'hide'}));
   await page.keyboard.press('Shift+Tab');
   assert.equal(await page.evaluate(()=>document.activeElement?.className),'hig-range',`${name}/${density}${host&&'/'+host}: Tab reaches the range input`);
   const focus=await page.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--hig-focus').trim();c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data.slice(0,3)];});
   const bytes=await page.screenshot({clip,animations:'disabled',caret:'hide'});
   const png=PNG.sync.read(bytes);let ringPixels=0,overlap=0;
   for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){const i=(y*png.width+x)*4;if([0,1,2].every(c=>Math.abs(png.data[i+c]-rest.data[i+c])<=8))continue;if(Math.abs(png.data[i]-focus[0])+Math.abs(png.data[i+1]-focus[1])+Math.abs(png.data[i+2]-focus[2])>48)continue;ringPixels++;const py=y+clip.y;if(py<box.label.bottom+1&&x>=box.label.left-1&&x<=box.label.right+1)overlap++;}
   assert.ok(ringPixels>0,`${name}/${density}${host&&'/'+host}: focused range shows a focus indicator`);
   assert.equal(overlap,0,`${name}/${density}${host&&'/'+host}: focus ring paints ${overlap} px inside the label box`);
   const file=`artifacts/visual/slider-focus-${density}${host&&'-'+host}-${name}.png`;writeFileSync(file,bytes);
   let regression=null;
   if(name==='chromium'&&!host){const baseline=`tests/visual-baselines/slider-focus-${density}.png`;if(process.env.HIG_UPDATE_VISUALS==='1'){writeFileSync(baseline,bytes);regression={updated:true};}else{assert.equal(existsSync(baseline),true,`Missing visual baseline: ${baseline}`);try{regression=compareVisual(bytes,readFileSync(baseline));}catch(error){mkdirSync('evidence/visual-actuals',{recursive:true});writeFileSync(`evidence/visual-actuals/slider-focus-${density}.png`,bytes);failures.push(`${density}: ${error.message}`);}}}
   results.push({engine:name,density,host:host||'default',ringPixels,labelOverlap:overlap,labelBottom:box.label.bottom,inputTop:box.input.top,regression,capture:file});
  }
 }finally{await browser.close();}
}
if(failures.length)throw Error(`Slider focus visual regression:\n${failures.join('\n')}`);
writeFileSync('evidence/slider-focus-ring.json',JSON.stringify({version:'0.1.0',issue:69,check:'keyboard-focused Slider ring paints no focus-colour pixel inside the label box',results},null,2)+'\n');
console.log(`Slider focus ring clear of label: ${results.map(r=>`${r.engine}/${r.density}/${r.host}`).join(', ')}`);
