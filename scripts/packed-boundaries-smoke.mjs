import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const directory=mkdtempSync(join(tmpdir(),'hig-boundaries-'));
writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,type:'module'}));
const tarball=name=>resolve(`artifacts/bloxwap-hig-${name}-0.1.0.tgz`);
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...['tokens','contracts','feedback'].map(tarball)],{cwd:directory,stdio:'pipe'});
for(const peer of ['react','react-native','@bloxwap/sfx','@bloxwap/haptic','expo-audio','expo-haptics'])assert.equal(existsSync(join(directory,'node_modules',peer)),false,`root feedback unexpectedly installs ${peer}`);
writeFileSync(join(directory,'root.mjs'),"import {FeedbackController} from '@bloxwap/hig-feedback';import {tokens} from '@bloxwap/hig-tokens';new FeedbackController().dispose();if(!tokens.colors.action)throw Error('Missing tokens');");
execFileSync(process.execPath,[join(directory,'root.mjs')],{cwd:directory,stdio:'inherit'});
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',tarball('react'),'react@19.1.0','react-dom@19.1.0'],{cwd:directory,stdio:'pipe'});
for(const peer of ['@radix-ui/react-dialog','@radix-ui/react-dropdown-menu','react-native','@bloxwap/chart','@bloxwap/sfx','@bloxwap/haptic'])assert.equal(existsSync(join(directory,'node_modules',peer)),false,`button unexpectedly installs ${peer}`);
writeFileSync(join(directory,'button.mjs'),"import React from 'react';import {renderToString} from 'react-dom/server';import {Button} from '@bloxwap/hig-react/button';if(!renderToString(React.createElement(Button,null,'Review')).includes('Review'))throw Error('SSR failed');");
execFileSync(process.execPath,[join(directory,'button.mjs')],{cwd:directory,stdio:'inherit'});
// Recipes without overlays must resolve, render and bundle with no Radix peer installed (#63).
const overlayFree={'install-command':['InstallCommand',{command:'npm i @bloxwap/hig-react',onCopy:()=>{}}],'code-window':['CodeWindow',{language:'bash',children:'npm ci'}],'market-row':['MarketRow',{symbol:'BTC',name:'Bitcoin',price:1,change:1,onSelect:()=>{}}],'balance-card':['BalanceCard',{label:'Balance',balance:1}],'marketing-hero':['MarketingHero',{title:'Trade',description:'Markets',href:'/',cta:'Start'}],'activity-list':['ActivityList',{items:[]}]};
const bundle=contents=>build({stdin:{contents,resolveDir:directory,sourcefile:'entry.js'},absWorkingDir:directory,bundle:true,write:false,metafile:true,format:'esm',platform:'browser',logLevel:'silent'});
for(const [entry,[name,props]] of Object.entries(overlayFree)){
 writeFileSync(join(directory,`${entry}.mjs`),`import React from 'react';import {renderToString} from 'react-dom/server';import {${name}} from '@bloxwap/hig-react/recipes/${entry}';if(!renderToString(React.createElement(${name},${JSON.stringify(props)})))throw Error('${name} SSR failed');`);
 execFileSync(process.execPath,[join(directory,`${entry}.mjs`)],{cwd:directory,stdio:'inherit'});
 const result=await bundle(`export {${name}} from '@bloxwap/hig-react/recipes/${entry}';`);
 const inputs=Object.keys(result.metafile.inputs);
 assert.ok(result.outputFiles[0].contents.length>0);
 assert.equal(inputs.some(p=>/radix|overlay|dialog/.test(p)),false,`recipes/${entry} pulls overlay code: ${inputs.filter(p=>/radix|overlay|dialog/.test(p))}`);
}
// Guard the guard: the overlay recipe still needs its Dialog peer, so the bundle must fail here.
await assert.rejects(bundle("export {TradeEntry} from '@bloxwap/hig-react/recipes/trade-entry';"),/@radix-ui\/react-dialog/,'trade-entry bundled without its dialog peer');
console.log('Clean packed boundaries: tokens/feedback root without React or device engines; Button SSR and overlay-free recipe SSR/bundles without Radix, native, chart or feedback engines');
