// Optional authenticated audit, not a CI dependency on a private source repository.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,symlinkSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve('.'),directory=resolve('.local/source-metro');
const source=JSON.parse(readFileSync('evidence/issue-1-18/monorepo-source-fetch.json','utf8'));
if(!existsSync('.local/monorepo/packages/ui-native/src/components/button.tsx'))throw Error('Restore the commit-pinned audit paths into .local/monorepo before running this optional source baseline.');
mkdirSync(directory,{recursive:true});
const manifest=JSON.parse(readFileSync('fixtures/native/package.json','utf8'));
manifest.name='hig-source-metro-baseline';manifest.main='index.js';
writeFileSync(join(directory,'package.json'),JSON.stringify(manifest,null,2));
writeFileSync(join(directory,'app.json'),JSON.stringify({expo:{name:'HIG source baseline',slug:'hig-source-baseline',version:'0.1.0'}}));
copyFileSync('babel.config.cjs',join(directory,'babel.config.cjs'));
if(!existsSync(join(directory,'node_modules')))symlinkSync(resolve('node_modules'),join(directory,'node_modules'),'dir');
writeFileSync(join(directory,'metro.config.cjs'),`const {getDefaultConfig}=require('expo/metro-config');const path=require('node:path');const config=getDefaultConfig(__dirname);config.watchFolders=[${JSON.stringify(root)}];config.resolver.nodeModulesPaths=[${JSON.stringify(resolve('node_modules'))}];config.resolver.resolveRequest=(context,name,platform)=>{if(name==='@workspace/tokens'||name.startsWith('@workspace/tokens/'))return {type:'sourceFile',filePath:path.join(${JSON.stringify(resolve('.local/monorepo/packages/tokens/src'))},(name==='@workspace/tokens'?'index':name.slice('@workspace/tokens/'.length))+'.ts')};return context.resolveRequest(context,name,platform);};module.exports=config;`);
const faces=`{'Bloxwap Sans 400':require('@bloxwap/hig-native-fonts/fonts/BloxwapSans.ttf'),'Bloxwap Sans 600':require('@bloxwap/hig-native-fonts/fonts/BloxwapSans-SemiBold.ttf')}`;
const results=[];
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(path,e.name)):[join(path,e.name)]);}
for(const stage of ['before','hig']){
 const imports=stage==='before'?`import {Button} from '../monorepo/packages/ui-native/src/components/button';`:`import {Button} from '@bloxwap/hig-native/button';import {HIGProvider} from '@bloxwap/hig-native/provider';`;
 const content=stage==='before'?`<Button>Review order</Button>`:`<HIGProvider fontFamily='Bloxwap Sans 400' fontFamilies={{400:'Bloxwap Sans 400',600:'Bloxwap Sans 600'}}><Button>Review order</Button></HIGProvider>`;
 writeFileSync(join(directory,'index.js'),`import React from 'react';import {registerRootComponent} from 'expo';import {View} from 'react-native';import {useFonts} from 'expo-font';${imports}function App(){const [loaded]=useFonts(${faces});return loaded?<View style={{padding:24}}>${content}</View>:null;}registerRootComponent(App);`);
 execFileSync(resolve('node_modules/.bin/expo'),['export','--platform','android','--platform','ios','--output-dir',stage,'--max-workers','2'],{cwd:directory,stdio:'inherit'});
 results.push({stage,bundles:files(join(directory,stage)).filter(p=>p.endsWith('.hbc')).map(p=>({platform:p.includes('/android/')?'android':'ios',bytes:statSync(p).size})),metadata:JSON.parse(readFileSync(join(directory,stage,'metadata.json'),'utf8'))});
}
writeFileSync('evidence/issue-1-18/source-metro-baseline.json',JSON.stringify({sourceCommit:source.sha,toolchain:{react:'19.1.0',reactNative:'0.81.5',expo:'54',font:'0.1.2'},scope:'Representative standalone single-button Android/iOS Hermes bundles using the same registered faces and toolchain. Source uses its coupled Reanimated/haptic policy; HIG uses optional feedback. These are not deployed production bundles or a claim that any owning app migrated.',results},null,2)+'\n');
