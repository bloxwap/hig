import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const [appArgument,simulator,outArgument]=process.argv.slice(2);
if(!appArgument||!simulator||!outArgument)throw Error('Usage: node scripts/native-sim/adoption-evidence.mjs <prepared-app> <simulator-udid> <out-dir>');
const app=resolve(appArgument),out=resolve(outArgument);
const read=filename=>JSON.parse(readFileSync(filename,'utf8'));
const hash=filename=>createHash('sha256').update(readFileSync(filename)).digest('hex');
const checks=[['default','testTypographyAndBusySpacing','typography'],['default','testToastRecoveryAndDismissal','toast-default'],['default','testCustomSheetCardStack','sheet'],['ax5','testToastRecoveryAndDismissal','toast-ax5']].map(([prefix,test,report])=>{
 const summary=read(resolve(out,prefix,`${test}-xcresult.json`));
 if(summary.result!=='Passed'||summary.failedTests!==0||summary.passedTests!==1)throw Error(`Adoption check failed: ${test} ${prefix}`);
 return {test,prefix,passedTests:summary.passedTests,failedTests:summary.failedTests,devices:summary.devicesAndConfigurations.map(item=>item.device),observations:read(resolve(out,prefix,`${report}.json`))};
});
const modules=['provider','surface','radio-group','data','animated-number','status','button','gesture-sheet'];
const runtime=Object.fromEntries(modules.map(name=>{
 const relative=`packages/native/dist/${name}.js`,installed=hash(resolve(app,`node_modules/@bloxwap/hig-native/dist/${name}.js`)),workspace=hash(resolve(root,relative));
 if(installed!==workspace)throw Error(`Installed adoption runtime differs from workspace: ${name}`);
 return [relative,workspace];
}));
const fonts=Object.fromEntries(['BloxwapSans.ttf','BloxwapSans-SemiBold.ttf','BloxwapMono.ttf','BloxwapSansKR.ttf','BloxwapSansKR-SemiBold.ttf','BloxwapSansSC.ttf','BloxwapSansSC-SemiBold.ttf'].map(name=>{
 const relative=`packages/native-fonts/fonts/${name}`,workspace=hash(resolve(root,relative));
 if(workspace!==hash(resolve(app,`node_modules/@bloxwap/hig-native-fonts/fonts/${name}`)))throw Error(`Installed adoption font differs from workspace: ${name}`);
 return [relative,workspace];
}));
const sources=Object.fromEntries([...modules.map(name=>`packages/native/src/${name}.tsx`),'fixtures/native/adoption-check.tsx','fixtures/native/index-adoption.js','scripts/native-sim/ios/UITests/AdoptionVerificationUITests.swift'].map(relative=>[relative,hash(resolve(root,relative))]));
const versions=Object.fromEntries(['expo','react','react-native','@gorhom/bottom-sheet','react-native-reanimated','react-native-worklets'].map(name=>[name,read(resolve(app,'node_modules',name,'package.json')).version]));
writeFileSync(resolve(out,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),scope:'Current workspace JS and generated static fonts copied into a prepared iOS Simulator app; separate from packed-install validation.',simulator,versions,checks,sources,runtime,fonts,limits:['Simulator touch, layout and accessibility-tree observations; VoiceOver and physical devices were not exercised.','AX5 runtime coverage is the notification recovery/dismissal flow; other adoption checks use the normal content size.','Android runtime adoption behavior was not observed by this run.']},null,2)+'\n');
