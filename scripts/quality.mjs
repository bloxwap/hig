import {verifyNativeReact,verifyExpoNativeModules} from './native-compatibility.mjs';
import {readFileSync,readdirSync,existsSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {gzipSync} from 'node:zlib';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertGeneratedFonts,requireGeneratedFonts} from './font-preflight.mjs';
export function checkExports(directory){const pkg=JSON.parse(readFileSync(`${directory}/package.json`,'utf8'));const targets=[];function collect(value){if(typeof value==='string')targets.push(value);else if(value&&typeof value==='object')Object.values(value).forEach(collect);}collect(pkg.exports);for(const target of targets){if(target.includes('*'))continue;if(!existsSync(resolve(directory,target)))throw Error(`Invalid export ${pkg.name}: ${target}`);}return targets.length;}
export function assertBudget(name,actual,limit){if(actual>limit)throw Error(`Budget regression ${name}: ${actual} > ${limit}`);}
export function checkPlatformImports(directory,platform){for(const file of readdirSync(`${directory}/dist`,{recursive:true}).filter(f=>f.endsWith('.js'))){const text=readFileSync(`${directory}/dist/${file}`,'utf8');const prohibited=platform==='web'?/from\s*['"](?:react-native|expo(?:-|\/|['"])|@bloxwap\/hig-native)/:/from\s*['"](?:react-dom|@bloxwap\/(?:chart|sfx|haptic)|@bloxwap\/hig-react)/;if(prohibited.test(text))throw Error(`Invalid ${platform} platform import: ${file}`);}}
export function checkCueHashes(directory='packages/feedback/assets'){const manifest=JSON.parse(readFileSync(`${directory}/manifest.json`,'utf8'));for(const cue of manifest.cues){const bytes=readFileSync(`${directory}/${cue.file}`);if(createHash('sha256').update(bytes).digest('hex')!==cue.sha256)throw Error(`Native cue artifact drift: ${cue.file}`);}return manifest.cues.reduce((sum,c)=>sum+c.bytes,0);}
export async function qualityReport(){
 assertGeneratedFonts('The quality report');
 const nativeRuntime=verifyNativeReact('fixtures/native');verifyExpoNativeModules('fixtures/native');
 const packages=readdirSync('packages');const exports=Object.fromEntries(packages.map(p=>[p,checkExports(`packages/${p}`)]));checkPlatformImports('packages/react','web');checkPlatformImports('packages/native','native');
 const budgets=JSON.parse(readFileSync('planning/budgets.json','utf8'));const sizes={};
 for(const [name,input] of Object.entries({button:"export {Button} from '@bloxwap/hig-react/button';",field:"export {AmountInput} from '@bloxwap/hig-react/field';",nativeSwitch:"export {Switch} from '@bloxwap/hig-native/switch';",feedbackContract:"export {FeedbackController} from '@bloxwap/hig-feedback';"})){
  const result=await build({stdin:{contents:input,resolveDir:resolve('.'),sourcefile:`${name}.js`},write:false,bundle:true,minify:true,format:'esm',platform:'neutral',metafile:true,external:['react','react-dom','react-native','react/jsx-runtime']});
  const gzip=gzipSync(result.outputFiles[0].contents).length;sizes[name]={raw:result.outputFiles[0].contents.length,gzip,inputs:Object.keys(result.metafile.inputs)};
  assertBudget(name,gzip,budgets[name].gzip);
  if(name==='nativeSwitch'&&sizes[name].inputs.some(p=>/slider|svg|overlay|feedback|sfx|haptic|chart|react-dom/.test(p)))throw Error('Single native Switch imports unrelated runtime');
 }
 const assetRoot='apps/docs/dist/_next/static';
 function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
 const assets=files(assetRoot).map(name=>({name,bytes:readFileSync(name)}));
 sizes.docsJS={raw:assets.filter(a=>a.name.endsWith('.js')).reduce((s,a)=>s+a.bytes.length,0),gzip:assets.filter(a=>a.name.endsWith('.js')).reduce((s,a)=>s+gzipSync(a.bytes).length,0)};
 sizes.docsCSS={raw:assets.filter(a=>a.name.endsWith('.css')).reduce((s,a)=>s+a.bytes.length,0)};
 sizes.fonts={raw:assets.filter(a=>a.name.endsWith('.woff2')).reduce((s,a)=>s+a.bytes.length,0)};
 const fontManifest=JSON.parse(readFileSync('packages/native-fonts/fonts/manifest.json','utf8'));
 for(const [asset,hash] of Object.entries(fontManifest.outputs)){if(createHash('sha256').update(readFileSync(`packages/native-fonts/fonts/${asset}`)).digest('hex')!==hash)throw Error(`Native font drift: ${asset}`);}
 sizes.nativeFonts={raw:['BloxwapSans.ttf','BloxwapSans-SemiBold.ttf','BloxwapMono.ttf'].reduce((sum,asset)=>sum+readFileSync(`packages/native-fonts/fonts/${asset}`).length,0),scope:'Only three explicitly registered fixture faces; optional CJK/other weight assets remain unloaded'};
 sizes.nativeCues={raw:checkCueHashes()};
 for(const name of ['docsJS','docsCSS','fonts','nativeFonts','nativeCues']){const rule=budgets[name];for(const metric of Object.keys(rule))assertBudget(`${name}.${metric}`,sizes[name][metric],rule[metric]);}
 const report={version:'0.1.0',nativeRuntime,exports,sizes,baseline:'HIG candidate measurements; representative authenticated source React/Metro baselines in evidence/issue-1-18; deployed production deltas not claimed',physicalDevices:'pending; API/browser/Metro checks are not tactile or VoiceOver/TalkBack proof'};
 writeFileSync('evidence/quality-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({exports,sizes:Object.fromEntries(Object.entries(sizes).map(([k,v])=>[k,{raw:v.raw,gzip:v.gzip}]))},null,2));return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){requireGeneratedFonts('npm run quality');await qualityReport();}
