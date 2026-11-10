import {execFileSync} from 'node:child_process';
import {existsSync,mkdtempSync,readdirSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tsrsSupported} from './compiler.mjs';

function emittedFiles(directory,prefix=''){
 return readdirSync(join(directory,prefix),{withFileTypes:true}).flatMap(entry=>{
  const name=join(prefix,entry.name);
  return entry.isDirectory()?emittedFiles(directory,name):/\.(js|d\.ts|map)$/.test(name)?[name]:[];
 });
}

// Compare the union: missing/extra files are failures too. Never normalize bytes.
export function compareOutputs(left,right){
 const a=new Set(emittedFiles(left)),b=new Set(emittedFiles(right));
 if(!a.size&&!b.size)throw new Error('Compiler parity: no emitted files');
 return [...new Set([...a,...b])].sort().filter(name=>
  !a.has(name)||!b.has(name)||!readFileSync(join(left,name)).equals(readFileSync(join(right,name)))
 );
}

function main(){
 if(!tsrsSupported)throw new Error('Compiler parity requires a platform supported by tsrs');
 const differences=[];
 let count=0;
 for(const entry of readdirSync('packages/hig').sort()){
  const directory=join('packages/hig',entry);
  if(!existsSync(join(directory,'tsconfig.json')))continue;
  // Equal-depth sibling output dirs keep source-map paths identical without
  // rewriting maps. Real dist stays intact for workspace export resolution.
  const scratch=mkdtempSync(join(directory,'.compiler-parity-'));
  try{
   for(const compiler of ['tsrs','tsc']){
    execFileSync(process.execPath,[
     'scripts/tsc.mjs',...(compiler==='tsc'?['--tsc']:[]),
     '-p',join(directory,'tsconfig.json'),'--outDir',join(scratch,compiler),
     '--incremental','false'
    ],{stdio:'inherit'});
   }
   differences.push(...compareOutputs(join(scratch,'tsrs'),join(scratch,'tsc')).map(name=>`${entry}/${name}`));
   count+=emittedFiles(join(scratch,'tsrs')).length;
  }finally{rmSync(scratch,{recursive:true,force:true});}
 }
 if(!count)throw new Error('Compiler parity: no package entries compiled');
 if(differences.length)throw new Error(`Compiler output differs:\n${differences.join('\n')}`);
 console.log(`Compiler parity: ${count} emitted files are byte-identical`);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
