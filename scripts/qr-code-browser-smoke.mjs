// QRCode in real engines: the web renderer, and the native renderer through react-native-web and react-native-svg's web
// build, are drawn in Chromium and WebKit, screenshotted and decoded. The arena cases use content WebKit misplaces inside
// an SVG `foreignObject` (positioned, translucent, transformed), which is why the web arena is an HTML box over the SVG.
// Not a phone camera and not iOS or Android: it proves the drawing each engine paints is a readable code.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import sharp from 'sharp';
import {chromium,webkit} from '@playwright/test';
import {launchBrowser} from './browser-launcher.mjs';

const require=createRequire(import.meta.url);
// `qr` is the reference decoder, a development dependency of this workspace only.
const {default:decodeQR}=await import(pathToFileURL(require.resolve('qr/decode.js')).href);
const css=readFileSync('packages/hig/tokens/generated/tokens.css','utf8')+readFileSync('packages/hig/react/src/styles.css','utf8');
const output='.validation-tmp/qr-code';mkdirSync(output,{recursive:true});
const ethereum='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',solana='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
const image=`data:image/png;base64,${(await sharp({create:{width:64,height:64,channels:3,background:{r:230,g:0,b:122}}}).png().toBuffer()).toString('base64')}`;
/** What each case must decode to, and whether the arena's mark must show in the centre. */
const cases={
 default:{value:ethereum},
 'dark-on-light':{value:solana},
 'arena-node':{value:`ethereum:${ethereum}@8453`,mark:true},
 'arena-image':{value:`solana:${solana}?amount=1`,mark:true},
 resized:{value:ethereum,mark:true,edge:300},
 wallet:{value:solana,mark:true},
};
const sources={
 react:`import React from 'react';import {createRoot} from 'react-dom/client';
 import {HIGProvider} from './packages/hig/react/src/provider';
 import {QRCode} from './packages/hig/react/src/qr-code';
 import {WalletAddress} from './packages/hig/react/src/wallet-address';
 // Positioned, translucent and transformed: each makes WebKit paint foreignObject content at the SVG's corner.
 const mark=<span style={{display:'block',position:'relative',width:28,height:28,borderRadius:6,opacity:.95,transform:'rotate(8deg)',background:'rgb(230,0,122)'}}/>;
 createRoot(document.getElementById('root')).render(<HIGProvider direction={window.direction}>
  <QRCode data-testid='default' value='${ethereum}'/>
  <QRCode data-testid='dark-on-light' value='${solana}' size={120} color='black' background='white'/>
  <QRCode data-testid='arena-node' value='ethereum:${ethereum}@8453' arena={mark}/>
  <QRCode data-testid='arena-image' value='solana:${solana}?amount=1' arena='${image}' size={220}/>
  <QRCode data-testid='resized' value='${ethereum}' arena={mark} style={{width:300}}/>
  <WalletAddress address='${solana}' arena='${image}'/>
 </HIGProvider>);`,
 native:`import React from 'react';import {createRoot} from 'react-dom/client';import {View} from 'react-native';
 import {HIGProvider} from './packages/hig/native/src/provider';
 import {QRCode} from './packages/hig/native/src/qr-code';
 import {WalletAddress} from './packages/hig/native/src/wallet-address-core';
 const mark=<View style={{width:28,height:28,borderRadius:6,opacity:.95,transform:[{rotate:'8deg'}],backgroundColor:'rgb(230,0,122)'}}/>;
 createRoot(document.getElementById('root')).render(<HIGProvider direction={window.direction} reducedMotion>
  <QRCode testID='default' value='${ethereum}'/>
  <QRCode testID='dark-on-light' value='${solana}' size={120} color='black' background='white'/>
  <QRCode testID='arena-node' value='ethereum:${ethereum}@8453' arena={mark}/>
  <QRCode testID='arena-image' value='solana:${solana}?amount=1' arena='${image}' size={220}/>
  <QRCode testID='resized' value='${ethereum}' arena={mark} size={300}/>
  <WalletAddress address='${solana}' qr={<QRCode testID='wallet' value='${solana}' arena='${image}' quietZone={0} background='none' decorative/>}/>
 </HIGProvider>);`,
};
const scale=2;
for(const [renderer,source] of Object.entries(sources).filter(([renderer])=>!process.env.HIG_QR_RENDERER||process.env.HIG_QR_RENDERER===renderer)){
 const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.jsx','.js','.json'],alias:{'react-native':'react-native-web',react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"','process.env.EXPO_OS':'"web"',__DEV__:'false',global:'globalThis'}});
 for(const [engine,type] of Object.entries({chromium,webkit})){
  const browser=await launchBrowser(type,{headless:true});
  try{for(const direction of ['ltr','rtl']){
   const context=await browser.newContext({viewport:{width:900,height:1400},deviceScaleFactor:scale});
   try{
    const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
    await page.setContent(`<!doctype html><html lang="en" dir="${direction}"><head><style>${css}body{margin:24px;background:var(--hig-background);color:var(--hig-text)}#root,#root>div{display:flex;flex-direction:column;align-items:flex-start;gap:24px}</style></head><body><main id="root"></main></body></html>`);
    await page.evaluate(direction=>{window.direction=direction;},direction);await page.addScriptTag({content:bundle.outputFiles[0].text});
    for(const [name,expected] of Object.entries(cases)){
     // The web WalletAddress draws its own code; every other case carries the test id on the code itself.
     const code=renderer==='react'&&name==='wallet'?page.locator('.hig-wallet-address-qr > .hig-qr-code'):page.locator(`[data-testid="${name}"]`);
     await code.waitFor();
     // The arena image is a data URI; wait until every image in the code has decoded.
     await code.evaluate(async element=>{await Promise.all([...element.querySelectorAll('img')].map(node=>node.decode?.().catch(()=>{})));});
     const box=await code.boundingBox();assert.ok(box);
     assert.ok(Math.abs(box.width-box.height)<0.5,`${renderer}/${engine}/${direction}/${name}: the code is square (${box.width}×${box.height})`);
     if(expected.edge)assert.ok(Math.abs(box.width-expected.edge)<0.5,`${renderer}/${engine}/${direction}/${name}: resized to ${expected.edge}px, was ${box.width}`);
     const shot=await code.screenshot({path:`${output}/${renderer}-${engine}-${direction}-${name}.png`});
     const {data,info}=await sharp(shot).ensureAlpha().raw().toBuffer({resolveWithObject:true});
     let decoded;try{decoded=decodeQR({width:info.width,height:info.height,data:new Uint8Array(data)});}catch(error){decoded=`unreadable: ${error.message}`;}
     assert.equal(decoded,expected.value,`${renderer}/${engine}/${direction}/${name}: the painted code decodes`);
     if(expected.mark){
      // The mark is painted in the centre of the code, not at a corner.
      const at=(Math.floor(info.height/2)*info.width+Math.floor(info.width/2))*4,[red,green,blue]=[data[at],data[at+1],data[at+2]];
      assert.ok(red>170&&green<70&&blue>70&&blue<170,`${renderer}/${engine}/${direction}/${name}: the arena is painted in the centre (rgb ${red},${green},${blue})`);
     }
    }
    assert.deepEqual(errors,[]);
    console.log(`${renderer}/${engine}/${direction}: ${Object.keys(cases).join(', ')} decoded from the painted pixels`);
   }finally{await context.close();}
  }}finally{await browser.close();}
 }
}
