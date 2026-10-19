import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
const require=createRequire(import.meta.url);
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const bundle=await build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Check from './fixtures/native/switch-check.tsx';createRoot(document.getElementById('root')).render(<Check/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{'react-native':'react-native-web',react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"',__DEV__:'false'}});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/switch.js'?'text/javascript':'text/html');res.end(req.url==='/switch.js'?bundle.outputFiles[0].text:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native switch content</title></head><body><main id="root"></main><script src="/switch.js"></script></body></html>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results=[];
try{for(const [engine,launcher] of Object.entries({chromium,webkit})){
 const browser=await launcher.launch({headless:true});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const control=page.getByRole('switch',{name:'Notifications',exact:true});
  await control.waitFor();assert.equal(await control.count(),1);assert.equal(await control.locator('input,button,[tabindex="0"]').count(),0);
  assert.equal(await control.getAttribute('aria-checked'),'false');assert.notEqual(await control.getAttribute('aria-busy'),'true');
  assert.ok((await control.boundingBox()).height>=48);
  await control.focus();await page.keyboard.press('Space');assert.equal(await control.getAttribute('aria-checked'),'true');await page.getByTestId('change-count').filter({hasText:'Changes: 1'}).waitFor();
  await page.keyboard.press('Enter');assert.equal(await control.getAttribute('aria-checked'),'false');await page.getByTestId('change-count').filter({hasText:'Changes: 2'}).waitFor();
  await control.click();assert.equal(await control.getAttribute('aria-checked'),'true');await page.getByTestId('change-count').filter({hasText:'Changes: 3'}).waitFor();
  await control.focus();await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');await page.getByTestId('change-count').filter({hasText:'Changes: 4'}).waitFor();
  await page.getByRole('button',{name:'Begin request',exact:true}).click();assert.equal(await control.getAttribute('aria-disabled'),'true');assert.equal(await control.getAttribute('aria-busy'),'true');
  await control.dispatchEvent('click');await control.dispatchEvent('keydown',{key:' ',code:'Space'});await page.getByTestId('change-count').filter({hasText:'Changes: 4'}).waitFor();
  await page.getByRole('button',{name:'Finish request',exact:true}).click();await control.focus();await page.keyboard.press('Tab');assert.equal(await page.getByRole('button',{name:'Begin request',exact:true}).evaluate(element=>element===document.activeElement),true);
  const standard=page.getByRole('switch',{name:'Default track',exact:true});await standard.check();assert.equal(await standard.isChecked(),true);await standard.uncheck();
  const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(({id,nodes})=>({id,targets:nodes.map(node=>node.target)}));assert.deepEqual(violations,[]);assert.deepEqual(errors,[]);
  results.push({engine,version:browser.version(),width,checks:['one named switch and no nested tab stops','Space/Enter/pointer each activate once','held Space ignores repeat','pending rejects direct click and Space','busy state preserved','Tab leaves custom row in one step','default native input still works','axe WCAG2/2.1/2.2 AA clear','no runtime errors'],violations,errors});await context.close();
 }}finally{await browser.close();}
}}finally{await new Promise(resolve=>server.close(resolve));}
mkdirSync('evidence/native-switch-content',{recursive:true});writeFileSync('evidence/native-switch-content/browsers.json',JSON.stringify({renderer:'react-native-web 0.21.4 through the public native package exports; not iOS/Android accessibility certification',results},null,2)+'\n');console.log('Custom native switch keyboard, pending and accessibility checks passed in Chromium/WebKit at both widths');
