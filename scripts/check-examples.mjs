import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {compilerCommand} from './compiler.mjs';
import {exampleCode,examples} from './example-code.mjs';
import {playgroundCode} from './playground-code.mjs';
const directory='artifacts/example-consumer';mkdirSync(directory,{recursive:true});let count=0;
for(const platform of ['react','native'])for(const example of examples)for(const state of example.states){writeFileSync(`${directory}/${platform}-${example.slug}-${state}.tsx`,exampleCode(example.name,platform,'comfortable',state));count++;}
for(const platform of ['react','native'])for(const sound of [false,true])for(const haptics of [false,true]){writeFileSync(`${directory}/configuration-${platform}-${sound}-${haptics}.tsx`,playgroundCode('Button',platform,'comfortable','default',{sound,haptics,volume:.42,motion:false}));count++;}
writeFileSync(`${directory}/tsconfig.json`,JSON.stringify({extends:'../../tsconfig.json',include:['*.tsx','../../types/assets.d.ts','../../types/css-exports.d.ts'],compilerOptions:{noEmit:true}},null,2));
execFileSync(compilerCommand[0],[...compilerCommand.slice(1),'-p',`${directory}/tsconfig.json`],{stdio:'inherit'});
console.log(`Copyable examples: ${count} web/native state modules typechecked against actual package exports`);
