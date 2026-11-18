// NumberFlow in real engines: what jsdom cannot show. The figure is laid out as the plain reading is, digits roll through the
// values between on the compositor's clock, a new value joins the roll without a jump, a figure that changes width slides and
// clips, everything is cleaned up when it lands, and reduced motion moves nothing. Set HIG_NUMBER_FLOW_EVIDENCE to a directory
// to keep screenshots and the result; nothing is written otherwise.
import assert from 'node:assert/strict';
import {launchBrowser} from './browser-launcher.mjs';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const output=process.env.HIG_NUMBER_FLOW_EVIDENCE?resolve(process.env.HIG_NUMBER_FLOW_EVIDENCE):null;if(output)mkdirSync(output,{recursive:true});
const require=createRequire(`${root}/package.json`);
const {build}=require('esbuild');const {chromium,webkit}=require('@playwright/test');
// Long durations keep "in flight" true for as long as a slow runner needs; the test lands the motion itself.
const source=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {HIGProvider} from './packages/hig/react/src/provider';import {NumberReadout} from './packages/hig/react/src/data';import {NumberFlow,NumberFlowGroup} from './packages/hig/react/src/animated-number';
const usd={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2};
function Example(){const [value,setValue]=useState(999.99);const [seconds,setSeconds]=useState(600);const [reduced,setReduced]=useState(false);window.higFlow={setValue,setSeconds,setReduced};
 return <HIGProvider reducedMotion={reduced}><div style={{fontSize:32,lineHeight:1.5}}>
  <p id='plain'>x<NumberReadout value={value} options={usd}/>x</p>
  <p id='flow'>x<NumberFlow value={value} options={usd} label='Price' duration={3000}/>x</p>
  <p id='right' style={{textAlign:'right',width:420}}><NumberFlow value={value} options={usd} suffix=' USD' duration={3000}/></p>
  <p id='clock'><NumberFlowGroup><span id='minutes'><NumberFlow value={Math.floor(seconds/60)} trend={-1} duration={3000} options={{useGrouping:false}}/></span>:<span id='seconds'><NumberFlow value={seconds%60} trend={-1} duration={3000} digits={{1:{max:5}}} options={{minimumIntegerDigits:2}}/></span></NumberFlowGroup></p>
  <HIGProvider locale='ar-EG' direction='rtl'><p id='arabic'><NumberFlow value={value} options={{minimumFractionDigits:2,maximumFractionDigits:2}} prefix='≈ ' duration={3000}/></p><p id='arabic-currency'><NumberFlow value={value} options={usd}/></p></HIGProvider>
 </div></HIGProvider>;}
createRoot(document.getElementById('root')).render(<Example/>);`;
const bundle=await build({stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const css=readFileSync(`${root}/packages/hig/tokens/dist/tokens.css`,'utf8')+readFileSync(`${root}/packages/hig/react/src/styles.css`,'utf8')+'body{margin:24px;background:var(--hig-background);color:var(--hig-text);font-family:system-ui}p{margin:8px 0}';
const result={checkedAt:new Date().toISOString(),engines:{}};
const format=(value,locale='en-US',options={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2})=>new Intl.NumberFormat(locale,options).format(value);
for(const [name,type] of Object.entries({chromium,webkit})){
 const browser=await launchBrowser(type,{headless:true});
 try{
  const page=await browser.newPage({viewport:{width:900,height:720}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setContent(`<html><head><style>${css}</style></head><body><div id='root'></div></body></html>`);await page.addScriptTag({content:bundle.outputFiles[0].text});await page.locator('#flow .hig-number-flow').waitFor();
  const frame=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const set=async(setter,value)=>{await page.evaluate(([setter,value])=>window.higFlow[setter](value),[setter,value]);await frame();};
  // Lands everything now, as the compositor would at the end, and waits for the handlers that clean up.
  const land=async()=>{for(let pass=0;pass<4;pass++){await page.evaluate(()=>{for(const animation of document.getAnimations())animation.finish();});await frame();}};
  const state=id=>page.evaluate(id=>{const element=document.querySelector('#'+id),visual=element.querySelector('.hig-animated-number-visual')??element.querySelector('.hig-number'),box=node=>{const rect=node.getBoundingClientRect();return {left:rect.left,top:rect.top,width:rect.width,height:rect.height};};
   const copy=visual.cloneNode(true);copy.querySelectorAll('.hig-number-flow-window,.hig-number-flow-ghosts,.hig-animated-number-old').forEach(node=>node.remove());
   const strip=key=>{const node=element.querySelector('[data-hig-flow-key="'+key+'"] .hig-number-flow-strip');return node?{glyphs:[...node.children].sort((a,b)=>parseFloat(a.style.transform.slice(11))-parseFloat(b.style.transform.slice(11))).map(glyph=>glyph.textContent.replaceAll('\n','')).join(''),y:new DOMMatrixReadOnly(getComputedStyle(node).transform).m42,pitch:node.getBoundingClientRect().height}:null;};
   const digits=element.querySelector('.hig-number-flow-digits');
   return {text:copy.textContent,flowing:!!element.querySelector('.hig-number-flow'),animations:document.getAnimations().filter(animation=>element.contains(animation.effect?.target)).length,windows:element.querySelectorAll('.hig-number-flow-window').length,ghosts:element.querySelectorAll('.hig-number-flow-ghost').length,spinning:element.querySelectorAll('[data-spinning]').length,
    labels:[...element.querySelectorAll('[aria-label]')].map(node=>node.getAttribute('aria-label')),live:element.querySelectorAll('[aria-live]').length,hidden:visual.getAttribute('aria-hidden'),number:box(element.querySelector('.hig-number')),line:box(element),clip:digits?getComputedStyle(digits).clipPath:null,
    ones:strip('digit:number:0'),tens:strip('digit:number:1'),thousands:strip('digit:number:3'),parts:Object.fromEntries([...visual.querySelectorAll('[data-hig-flow-key]')].filter(node=>!node.classList.contains('hig-number-flow-ghost')).map(node=>[node.dataset.higFlowKey,{...box(node),opacity:Number(getComputedStyle(node).opacity),slides:node.getAnimations().some(animation=>String(animation.effect.getKeyframes()[0]?.transform).startsWith('translateX'))}]))};},id);
  const settled=async(id,text)=>{const now=await state(id);assert.equal(now.animations,0,`${name} ${id} is still animating`);assert.equal(now.windows,0,`${name} ${id} kept a window`);assert.equal(now.ghosts,0,`${name} ${id} kept a fading copy`);assert.equal(now.spinning,0,`${name} ${id} kept a place marked spinning`);assert.equal(now.clip,'none',`${name} ${id} kept its clip`);if(text!==undefined)assert.equal(now.text,text,`${name} ${id} final text`);return now;};
  const shot=async label=>{if(output)await page.screenshot({path:join(output,`${name}-${label}.png`)});};

  // 1. At rest the flowing figure is the same boxes the plain reading is, and nothing runs.
  const plain=await state('plain'),rest=await settled('flow',format(999.99));
  assert.ok(Math.abs(plain.number.width-rest.number.width)<1,`${name} flowing figure is ${rest.number.width}px wide, the plain reading ${plain.number.width}px`);
  assert.ok(Math.abs(plain.line.height-rest.line.height)<0.6,`${name} flowing figure changed its line's height`);assert.ok(Math.abs((plain.number.top-plain.line.top)-(rest.number.top-rest.line.top))<0.6,`${name} flowing figure moved off its line's baseline`);
  assert.deepEqual(rest.labels,[`Price: ${format(999.99)}`]);assert.equal(rest.live,0);assert.equal(rest.hidden,'true');await shot('rest');

  // 2. A carry: every place turns one step up through the digits between, the new place and its separator fade in, and the digits are clipped while their box opens.
  await set('setValue',1000.01);const carry=await state('flow');
  assert.equal(carry.text,format(1000.01));assert.deepEqual(carry.labels,[`Price: ${format(1000.01)}`]);assert.equal(carry.live,0);
  assert.equal(carry.windows,6,`${name} every changed place should have a window`);assert.equal(carry.ones.glyphs,'90');assert.equal(carry.thousands.glyphs,'01');
  assert.ok(carry.parts['digit:number:3'].opacity<1,`${name} the new place should be fading in`);assert.ok(carry.parts['digit:number:0'].slides,`${name} the old places should slide`);assert.notEqual(carry.clip,'none',`${name} the digits should be clipped while they change width`);
  // The strip rests one pitch above its glyph's row and travels there; before it lands it is somewhere between.
  assert.ok(carry.ones.y>-carry.ones.pitch-0.5&&carry.ones.y<=0.5,`${name} the ones strip is at ${carry.ones.y}px of a ${carry.ones.pitch}px pitch`);
  await page.waitForTimeout(120);const later=await state('flow');assert.ok(later.ones.y<carry.ones.y,`${name} the ones strip did not move (${carry.ones.y} then ${later.ones.y})`);await shot('carry');

  // 3. A new value in flight joins the roll: the strip is where it was, not back at its start, and the window is the same one.
  await set('setValue',1002.01);const joined=await state('flow');
  assert.equal(joined.windows,6);assert.equal(joined.ones.glyphs,'9012');assert.ok(Math.abs(joined.ones.y-later.ones.y)<joined.ones.pitch,`${name} the ones strip jumped from ${later.ones.y} to ${joined.ones.y} when a value arrived in flight`);
  await land();await settled('flow',format(1002.01));assert.ok(Math.abs((await state('plain')).number.width-(await state('flow')).number.width)<1);

  // 3b. A reel starts and lands exactly on the digit React drew: the glyph it shows first and the one it shows last are where the
  // digit is, so nothing jumps when the reel is taken away. (WebKit snaps the box a transform's percentages are taken from.)
  await set('setValue',1009.01);
  const landing=await page.evaluate(()=>{const place=document.querySelector('#flow [data-hig-flow-key="digit:number:0"]'),strip=place.querySelector('.hig-number-flow-strip'),top=node=>{const range=document.createRange();range.selectNodeContents(node);return range.getBoundingClientRect().top;};
   const glyphTop=text=>{
    for(const glyph of strip.children){
     const rows=glyph.textContent.split('\n'),index=rows.indexOf(text);if(index<0)continue;
     const start=rows.slice(0,index).reduce((offset,row)=>offset+row.length+1,0);
     const range=document.createRange();range.setStart(glyph.firstChild,start);range.setEnd(glyph.firstChild,start+text.length);
     return range.getBoundingClientRect().top;
    }
    throw new Error('Missing reel glyph '+text);
   };
   const turns=strip.getAnimations();for(const turn of turns){turn.pause();turn.currentTime=0;}const first=glyphTop('2');for(const turn of turns)turn.currentTime=turn.effect.getComputedTiming().duration-0.001;const last=glyphTop('9');for(const turn of turns)turn.play();
   return {digit:top(place.querySelector('.hig-number-flow-digit')),first,last,turns:turns.length};});
  assert.equal(landing.turns,1);assert.ok(Math.abs(landing.first-landing.digit)<0.5,`${name} a reel starts ${landing.first-landing.digit}px off its digit`);assert.ok(Math.abs(landing.last-landing.digit)<0.5,`${name} a reel lands ${landing.last-landing.digit}px off its digit`);
  await land();await settled('flow',format(1009.01));

  // 4. Losing places: copies of the parts that left fade while the rest closes up, and a right-aligned figure keeps its digits still.
  await set('setValue',88.88);const lost=await state('flow'),right=await state('right');
  assert.equal(lost.text,format(88.88));assert.equal(lost.ghosts,3,`${name} the thousands, its separator and the hundreds should each leave a fading copy`);assert.ok(lost.parts['digit:number:1'].slides);
  assert.equal(right.text,`${format(88.88)} USD`);assert.ok(!right.parts['digit:number:1'].slides,`${name} a right-aligned figure's remaining digits should not slide`);assert.ok(right.parts['pre:0'].slides,`${name} a right-aligned figure's currency sign should slide`);
  await shot('lost');await land();await settled('flow',format(88.88));await settled('right',`${format(88.88)} USD`);

  // 5. A countdown: the tens of the seconds wrap 0 to 5 directly, and the grouped seconds slide when the minutes lose a place.
  await set('setSeconds',599);const minutes=await state('minutes'),seconds=await state('seconds');
  assert.equal(minutes.text,'9');assert.equal(seconds.text,'59');assert.equal(seconds.tens.glyphs,'50',`${name} the tens of the seconds should go 0 to 5 in one step down`);assert.equal(seconds.ones.glyphs,'90');
  assert.ok(seconds.parts['digit:number:1'].slides&&seconds.parts['digit:number:0'].slides,`${name} the seconds should slide with the minutes in a group`);
  await shot('countdown');await land();await settled('minutes','9');await settled('seconds','59');

  // 6. Reduced motion: the new value is simply there.
  await set('setReduced',true);await set('setValue',4321.5);await settled('flow',format(4321.5));await settled('right',`${format(4321.5)} USD`);
  // The nested right-to-left provider keeps its own motion setting, so its figures did move; land them before the next step.
  await set('setReduced',false);await land();

  // 7. A right-to-left page: Arabic digits roll in their own glyphs with the number left to right, and a number that needs reordering slides instead.
  await set('setValue',4321.6);const arabic=await state('arabic'),currency=await state('arabic-currency');
  const arabicText=format(4321.6,'ar-EG',{minimumFractionDigits:2,maximumFractionDigits:2}),six=new Intl.NumberFormat('ar-EG').format(6),five=new Intl.NumberFormat('ar-EG').format(5);
  assert.equal(arabic.text,`≈ ${arabicText}`);assert.ok(arabic.flowing);assert.equal(arabic.windows,1);
  const tenths=await page.evaluate(()=>[...document.querySelectorAll('#arabic [data-hig-flow-key="digit:number:-1"] .hig-number-flow-glyph')].sort((a,b)=>parseFloat(a.style.transform.slice(11))-parseFloat(b.style.transform.slice(11))).map(glyph=>glyph.textContent.replaceAll('\n','')).join(''));
  assert.equal(tenths,five+six,`${name} Arabic digits should roll in their own glyphs`);
  assert.ok(!currency.flowing,`${name} a number with right-to-left marks should slide, not flow`);assert.equal(currency.text,format(4321.6,'ar-EG'));
  await shot('arabic');await land();await settled('arabic',`≈ ${arabicText}`);
  assert.deepEqual(errors,[],`${name} page errors`);
  result.engines[name]={restWidth:{plain:plain.number.width,flow:rest.number.width},carry:{windows:carry.windows,clip:carry.clip},joined:{before:later.ones.y,after:joined.ones.y,pitch:joined.ones.pitch},ghosts:lost.ghosts,countdownTens:seconds.tens.glyphs,arabicTenths:tenths};
 }finally{await browser.close();}
}
if(output)writeFileSync(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
console.log(`NumberFlow browser smoke passed in ${Object.keys(result.engines).join(' and ')}`);
