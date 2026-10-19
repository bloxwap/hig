import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
const require=createRequire(import.meta.url);
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const bundle=await build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Check from './fixtures/native/action-check.tsx';createRoot(document.getElementById('root')).render(<Check/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',alias:{'react-native':'react-native-web',react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},define:{'process.env.NODE_ENV':'"production"',__DEV__:'false'}});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/actions.js'?'text/javascript':'text/html');res.end(req.url==='/actions.js'?bundle.outputFiles[0].text:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native host actions</title></head><body><main id="root"></main><script src="/actions.js"></script></body></html>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results=[];
try{for(const [engine,launcher] of Object.entries({chromium,webkit})){
 const browser=await launcher.launch({headless:true});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const control=page.getByRole('button',{name:'Open account',exact:true});await control.waitFor();
  const rootBox=await control.boundingBox(),identity=await page.getByTestId('account-identity').boundingBox(),trailing=await page.getByTestId('account-trailing').boundingBox();
  assert.ok(rootBox.height>=48);assert.ok(Math.abs(identity.x-(rootBox.x+16))<=1);assert.ok(Math.abs(trailing.x+trailing.width-(rootBox.x+rootBox.width-16))<=1);
  await control.click();await page.getByTestId('action-count').filter({hasText:'Actions: 1'}).waitFor();
  await control.focus();await page.keyboard.press('Enter');await page.getByTestId('action-count').filter({hasText:'Actions: 2'}).waitFor();
  const link=page.getByRole('link',{name:'Terms',exact:true}),url=page.url();assert.equal(await link.count(),1);
  await link.click();await page.getByTestId('navigation-count').filter({hasText:'Navigations: 1'}).waitFor();assert.equal(page.url(),url);assert.equal(context.pages().length,1);
  await link.focus();await page.keyboard.press('Enter');await page.getByTestId('navigation-count').filter({hasText:'Navigations: 2'}).waitFor();assert.equal(page.url(),url);assert.equal(context.pages().length,1);
  await page.getByRole('button',{name:'Begin request',exact:true}).click();assert.equal(await control.getAttribute('aria-busy'),'true');assert.equal(await control.getAttribute('aria-disabled'),'true');assert.equal(await link.getAttribute('aria-disabled'),'true');
  await control.dispatchEvent('click');await link.dispatchEvent('click');await page.getByTestId('action-count').filter({hasText:'Actions: 2'}).waitFor();await page.getByTestId('navigation-count').filter({hasText:'Navigations: 2'}).waitFor();
  await page.getByRole('button',{name:'Finish request',exact:true}).click();await control.focus();await page.keyboard.press('Tab');assert.equal(await page.getByRole('button',{name:'Begin request',exact:true}).evaluate(element=>element===document.activeElement),true);
  const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(({id,nodes})=>({id,targets:nodes.map(node=>node.target)}));assert.deepEqual(violations,[]);assert.deepEqual(errors,[]);
  results.push({engine,version:browser.version(),width,checks:['direct identity/trailing child layout at opposite host edges','pointer/Enter activate once','custom link keeps link semantics and replaces URL navigation once','no extra page or URL change','busy/disabled queued clicks rejected','Tab leaves one button owner','axe WCAG2/2.1/2.2 AA clear','no runtime errors'],violations,errors});await context.close();
 }}finally{await browser.close();}
}}finally{await new Promise(resolve=>server.close(resolve));}
mkdirSync('evidence/native-action-content',{recursive:true});writeFileSync('evidence/native-action-content/browsers.json',JSON.stringify({renderer:'react-native-web 0.21.4 through the public native package exports; not iOS/Android accessibility certification',results},null,2)+'\n');console.log('Native custom action layout, link navigation, busy and accessibility checks passed in Chromium/WebKit at both widths');
