import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {exampleCode,examples} from './example-code.mjs';
const directory='artifacts/example-consumer';mkdirSync(directory,{recursive:true});let count=0;
for(const platform of ['react','native'])for(const example of examples)for(const state of example.states){writeFileSync(`${directory}/${platform}-${example.slug}-${state}.tsx`,exampleCode(example.name,platform,'comfortable',state));count++;}
writeFileSync(`${directory}/tsconfig.json`,JSON.stringify({extends:'../../tsconfig.json',include:['*.tsx'],compilerOptions:{noEmit:true}},null,2));
execFileSync('npx',['tsc','-p',`${directory}/tsconfig.json`],{stdio:'inherit'});
console.log(`Copyable examples: ${count} web/native state modules typechecked against actual package exports`);
