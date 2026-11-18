import {workspaceVersion} from './workspace-version.mjs';
import {execFileSync} from 'node:child_process';
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
// Metro and most development bundlers do not remove unused exports, so an entry ships every byte of every HIG file it reaches. The
// minified sizes above pass while that sum grows, for example when a control imports an index module for one helper.
const shippedExternals=manifest=>[...Object.keys(manifest.peerDependencies??{}),'react/jsx-runtime','react-dom/*','react-native/*','expo-*','@bloxwap/chart/*','@bloxwap/icons/*','@bloxwap/sfx/*','@bloxwap/haptic/*','node:*'];
export async function shippedBytes(specifier,root='.'){const manifest=JSON.parse(readFileSync(resolve(root,'packages/hig/package.json'),'utf8'));const result=await build({stdin:{contents:`export * from '${specifier}';`,resolveDir:resolve(root),sourcefile:'entry.js'},write:false,bundle:true,format:'esm',platform:'neutral',conditions:['import','default'],metafile:true,external:shippedExternals(manifest),loader:{'.css':'empty','.svg':'empty','.ttf':'empty','.wav':'empty','.mp3':'empty'},logLevel:'silent'});const files=Object.entries(result.metafile.inputs).filter(([name])=>name!=='entry.js');return {raw:files.reduce((sum,[,file])=>sum+file.bytes,0),files:files.map(([name])=>name).sort()};}
// Inside HIG a renderer imports the contract module it needs. The `@bloxwap/hig/contracts` index re-exports every contract, so one
// import of it adds the formatters, decimal maths and picker search to every control on a bundler that keeps whole files.
export function checkContractImports(root='packages/hig'){for(const entry of ['react','native','chart','feedback']){if(!existsSync(`${root}/${entry}/dist`))continue;for(const file of readdirSync(`${root}/${entry}/dist`,{recursive:true}).map(String).filter(f=>f.endsWith('.js'))){if(/from\s*['"]@bloxwap\/hig\/contracts['"]/.test(readFileSync(`${root}/${entry}/dist/${file}`,'utf8')))throw Error(`${entry} dist/${file} imports the @bloxwap/hig/contracts index; import the specific contract module`);}}}
export function checkPlatformImports(directory,platform){for(const file of readdirSync(`${directory}/dist`,{recursive:true}).filter(f=>f.endsWith('.js'))){const text=readFileSync(`${directory}/dist/${file}`,'utf8');const prohibited=platform==='web'?/from\s*['"](?:react-native|expo(?:-|\/|['"])|@bloxwap\/hig\/native)/:/from\s*['"](?:react-dom|@bloxwap\/(?:chart|sfx|haptic)|@bloxwap\/hig\/react)/;if(prohibited.test(text))throw Error(`Invalid ${platform} platform import: ${file}`);}}
// #96: @bloxwap/hig names @bloxwap/chart only as a required peer, and only the chart entry imports it. An optional
// @bloxwap/chart peer makes npm 11 drop a workspace @bloxwap/chart when a host regenerates its lockfile from scratch.
export function checkChartBoundary(root='packages/hig'){const pkg=JSON.parse(readFileSync(`${root}/package.json`,'utf8'));const fields=['dependencies','peerDependencies','optionalDependencies','peerDependenciesMeta'].filter(f=>pkg[f]?.['@bloxwap/chart']);if(!pkg.peerDependencies?.['@bloxwap/chart']||fields.some(f=>f!=='peerDependencies'))throw Error(`${pkg.name} must declare @bloxwap/chart as a required peer only (#96)`);for(const entry of readdirSync(root)){if(entry==='chart'||!existsSync(`${root}/${entry}/dist`))continue;for(const file of readdirSync(`${root}/${entry}/dist`,{recursive:true}).map(String).filter(f=>f.endsWith('.js'))){if(/['"]@bloxwap\/chart(?:\/|['"])/.test(readFileSync(`${root}/${entry}/dist/${file}`,'utf8')))throw Error(`${pkg.name}/${entry} dist/${file} imports @bloxwap/chart; only @bloxwap/hig/chart may (#96)`);}}}
export function checkCueHashes(directory='packages/hig/feedback/assets'){const manifest=JSON.parse(readFileSync(`${directory}/manifest.json`,'utf8'));for(const cue of manifest.cues){const bytes=readFileSync(`${directory}/${cue.file}`);if(createHash('sha256').update(bytes).digest('hex')!==cue.sha256)throw Error(`Native cue artifact drift: ${cue.file}`);}return manifest.cues.reduce((sum,c)=>sum+c.bytes,0);}
export async function qualityReport(){
 assertGeneratedFonts('The quality report');
 const nativeRuntime=verifyNativeReact('fixtures/native');verifyExpoNativeModules('fixtures/native');
 const packages=readdirSync('packages');const exports=Object.fromEntries(packages.map(p=>[p,checkExports(`packages/${p}`)]));checkPlatformImports('packages/hig/react','web');checkPlatformImports('packages/hig/chart','web');checkPlatformImports('packages/hig/native','native');checkChartBoundary();checkContractImports();
 const budgets=JSON.parse(readFileSync('planning/budgets.json','utf8'));const sizes={};
 for(const [name,input] of Object.entries({button:"export {Button} from '@bloxwap/hig/react/button';",field:"export {Input} from '@bloxwap/hig/react/field';",nativeSwitch:"export {Switch} from '@bloxwap/hig/native/switch';",nativeSwitchRow:"export {SwitchRow} from '@bloxwap/hig/native/switch';",nativeLink:"export {Link} from '@bloxwap/hig/native/button';",feedbackContract:"export {FeedbackController} from '@bloxwap/hig/feedback';"})){
  const result=await build({stdin:{contents:input,resolveDir:resolve('.'),sourcefile:`${name}.js`},write:false,bundle:true,minify:true,format:'esm',platform:'neutral',metafile:true,external:['react','react-dom','react-native','react/jsx-runtime']});
  const gzip=gzipSync(result.outputFiles[0].contents).length;sizes[name]={raw:result.outputFiles[0].contents.length,gzip,inputs:Object.keys(result.metafile.inputs)};
  assertBudget(name,gzip,budgets[['nativeSwitchRow','nativeLink'].includes(name)?'nativeSwitch':name].gzip);
  if((name.startsWith('nativeSwitch')||name==='nativeLink')&&sizes[name].inputs.some(p=>/slider|svg|overlay|feedback|sfx|haptic|chart|react-dom/.test(p)))throw Error('Single native Switch imports unrelated runtime');
 }
 sizes.shipped={};for(const [specifier,limit] of Object.entries(budgets.shipped)){const {raw}=await shippedBytes(specifier);sizes.shipped[specifier]=raw;assertBudget(`shipped ${specifier}`,raw,limit);}
 const assetRoot='apps/docs/dist/_next/static';
 function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
 const assets=files(assetRoot).map(name=>({name,bytes:readFileSync(name)}));
 sizes.docsJS={raw:assets.filter(a=>a.name.endsWith('.js')).reduce((s,a)=>s+a.bytes.length,0),gzip:assets.filter(a=>a.name.endsWith('.js')).reduce((s,a)=>s+gzipSync(a.bytes).length,0)};
 sizes.docsCSS={raw:assets.filter(a=>a.name.endsWith('.css')).reduce((s,a)=>s+a.bytes.length,0)};
 sizes.fonts={raw:assets.filter(a=>a.name.endsWith('.woff2')).reduce((s,a)=>s+a.bytes.length,0)};
 const fontManifest=JSON.parse(readFileSync('packages/hig/native-fonts/fonts/manifest.json','utf8'));
 for(const [asset,hash] of Object.entries(fontManifest.outputs)){if(createHash('sha256').update(readFileSync(`packages/hig/native-fonts/fonts/${asset}`)).digest('hex')!==hash)throw Error(`Native font drift: ${asset}`);}
 sizes.nativeFonts={raw:['BloxwapSans.ttf','BloxwapSans-SemiBold.ttf','BloxwapMono.ttf'].reduce((sum,asset)=>sum+readFileSync(`packages/hig/native-fonts/fonts/${asset}`).length,0),scope:'Only three explicitly registered fixture faces; optional CJK/other weight assets remain unloaded'};
 sizes.nativeCues={raw:checkCueHashes()};
 for(const name of ['docsJS','docsCSS','fonts','nativeFonts','nativeCues']){const rule=budgets[name];for(const metric of Object.keys(rule))assertBudget(`${name}.${metric}`,sizes[name][metric],rule[metric]);}
 const report={version:workspaceVersion,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceTreeDirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),nativeRuntime,exports,sizes,baseline:'HIG candidate measurements; representative authenticated source React/Metro baselines in evidence/issue-1-18; deployed production deltas not claimed',physicalDevices:'pending; API/browser/Metro checks are not tactile or VoiceOver/TalkBack proof'};
 writeFileSync('evidence/quality-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({exports,sizes:Object.fromEntries(Object.entries(sizes).map(([k,v])=>[k,k==='shipped'?v:{raw:v.raw,gzip:v.gzip}]))},null,2));return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){requireGeneratedFonts('npm run quality');await qualityReport();}
