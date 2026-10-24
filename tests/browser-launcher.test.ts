import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
// @ts-expect-error Executable JavaScript browser launcher.
import {launchBrowser} from '../scripts/browser-launcher.mjs';

it.skipIf(process.platform!=='darwin')('scopes full keyboard navigation to the WebKit child and preserves arguments',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'hig-webkit-'));
 try{
  const executable=join(directory,'browser with spaces');
  writeFileSync(executable,'#!/bin/sh\nprintf "%s\\n" "$@"\n',{mode:0o755});
  const type={name:()=> 'webkit',executablePath:()=>executable,launch:(options:{executablePath:string;env:NodeJS.ProcessEnv})=>execFileSync(options.executablePath,['--headless','argument with spaces'],{env:options.env,encoding:'utf8'})};
  expect(await launchBrowser(type,{headless:true})).toBe('-AppleKeyboardUIMode\n3\n--headless\nargument with spaces\n');
 }finally{rmSync(directory,{recursive:true,force:true});}
});

it('leaves other browser launch settings unchanged',async()=>{
 const options={headless:true,args:['--no-sandbox']};
 const type={name:()=> 'chromium',launch:(settings:unknown)=>settings};
 expect(await launchBrowser(type,options)).toBe(options);
});
