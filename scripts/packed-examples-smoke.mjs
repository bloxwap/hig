import {execFileSync} from 'node:child_process';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {scratchDir} from './scratch.mjs';
import {examples,exampleCode} from './example-code.mjs';
import {playgroundCode} from './playground-code.mjs';
import {verifyNativeReact} from './native-compatibility.mjs';
import {packedTarball} from './workspace-version.mjs';
let count=0;
for(const platform of ['react','native']){
 const directory=scratchDir(`hig-packed-${platform}-examples-`);
 const dependencies={...JSON.parse(readFileSync(`fixtures/${platform==='react'?'web':'native'}/package.json`)).dependencies};
 delete dependencies['@bloxwap/hig'];
 // PriceChart comes from @bloxwap/hig/chart, whose @bloxwap/chart peer is required (#96).
 if(platform==='react')dependencies['@bloxwap/chart']='0.4.0';
 const devDependencies={typescript:'5.9.3','@types/react':'19.1.16','@types/node':'22.18.10',...(platform==='react'?{'@types/react-dom':'19.1.9'}:{})};
 writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,type:'module',dependencies,devDependencies}));
 const tarballs=[packedTarball()];
 execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...tarballs],{cwd:directory,stdio:'pipe'});
 if(platform==='native')verifyNativeReact(directory);
 mkdirSync(join(directory,'examples'));
 for(const example of examples)for(const state of example.states){writeFileSync(join(directory,'examples',`${example.slug}-${state}.tsx`),exampleCode(example.name,platform,'comfortable',state));count++;}
 for(const sound of [false,true])for(const haptics of [false,true]){writeFileSync(join(directory,'examples',`configuration-${sound}-${haptics}.tsx`),playgroundCode('Button',platform,'comfortable','default',{sound,haptics,volume:.42,motion:false}));count++;}
 writeFileSync(join(directory,'examples/assets.d.ts'),readFileSync('types/assets.d.ts'));
 writeFileSync(join(directory,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,noEmit:true,esModuleInterop:true},include:['examples']}));
 execFileSync(process.execPath,[join(directory,'node_modules/typescript/bin/tsc'),'-p',join(directory,'tsconfig.json')],{cwd:directory,stdio:'inherit'});
 console.log(`Packed ${platform} examples: clean isolated runtime and shipped imports passed`);
}
console.log(`Packed examples: ${count} web/native state/configuration modules in separate installed consumers; no workspace paths`);
