import {chromium,firefox,webkit} from '@playwright/test';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const launchers={chromium,firefox,webkit};
let clearedMacQuarantine=false;

function clearMacPlaywrightQuarantine(){
 if(clearedMacQuarantine||process.platform!=='darwin')return;
 clearedMacQuarantine=true;
 const cache=join(homedir(),'Library/Caches/ms-playwright');
 if(!existsSync(cache))return;
 spawnSync('xattr',['-cr',cache],{stdio:'ignore'});
}

export function playwrightLaunchOptions(engine){
 const options={headless:true};
 if(engine==='chromium'){
  options.args=['--no-sandbox','--disable-dev-shm-usage'];
  if(process.env.HIG_CHROME)options.executablePath=process.env.HIG_CHROME;
 }
 if(engine==='firefox'){
  // Self-hosted macOS: Playwright's Nightly plugin-container hits
  // sandbox_extension_issue_file_to_process (Operation not permitted) and SWGL
  // cannot map a framebuffer. Disable the content sandbox and force software
  // WebRender; still launch Firefox. Do not drop engines.
  options.firefoxUserPrefs={
   'security.sandbox.content.level':0,
   'security.sandbox.gpu.level':0,
   'gfx.webrender.software':true,
   'gfx.webrender.all':false,
   'layers.acceleration.disabled':true,
   'media.hardware-video-decoding.enabled':false
  };
 }
 return options;
}

export async function launchPlaywright(engine){
 const launcher=launchers[engine];
 if(!launcher)throw Error(`Unsupported browser ${engine}`);
 if(engine==='firefox'){
  process.env.MOZ_DISABLE_CONTENT_SANDBOX??='1';
  process.env.MOZ_DISABLE_GMP_SANDBOX??='1';
  process.env.MOZ_DISABLE_RDD_SANDBOX??='1';
  process.env.MOZ_WEBRENDER??='0';
  clearMacPlaywrightQuarantine();
 }
 return launcher.launch(playwrightLaunchOptions(engine));
}
