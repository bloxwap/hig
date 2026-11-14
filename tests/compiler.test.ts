import {expect,it} from 'vitest';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// @ts-expect-error Executable JavaScript parity checker.
import {compareOutputs} from '../scripts/compiler-parity.mjs';

function selections(cases:{platform:string;arch:string;forced?:boolean}[]){
 return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
  const results=[];
  for(const [i,{platform,arch,forced}] of ${JSON.stringify(cases)}.entries()){
   Object.defineProperty(process,'platform',{value:platform});
   Object.defineProperty(process,'arch',{value:arch});
   process.argv=forced?['node','script','--tsc']:['node','script'];
   const {tsrsSupported,useTsc,compilerCommand}=await import('./scripts/compiler.mjs?case='+i);
   results.push({tsrsSupported,useTsc,compilerCommand});
  }
  console.log(JSON.stringify(results));
 `],{encoding:'utf8'}));
}
function selection(platform:string,arch:string,forced=false){
 return selections([{platform,arch,forced}])[0];
}

it.each(['darwin','win32'])('automatically selects TypeScript 7 on %s-x64',platform=>{
 const result=selection(platform,'x64');
 expect(result.tsrsSupported).toBe(false);
 expect(result.useTsc).toBe(true);
 expect(result.compilerCommand).toEqual([process.execPath,expect.stringMatching(/typescript-7[/\\]bin[/\\]tsc$/)]);
});

it('matches every published tsrs platform and rejects unpublished targets',()=>{
 const metadata=JSON.parse(readFileSync('node_modules/tsrs/package.json','utf8'));
 const targets=new Set<string>(Object.keys(metadata.optionalDependencies).map(name=>name.replace('@tsrs/','').split('-').slice(0,2).join('-')));
 const platforms=new Set(['darwin','linux','win32','freebsd','openbsd','aix','sunos','android',...Array.from(targets,t=>t.split('-')[0])]);
 const arches=new Set(['x64','arm64','ia32','arm','ppc64','s390x','riscv64',...Array.from(targets,t=>t.split('-')[1])]);
 const cases=[...platforms].flatMap(platform=>[...arches].map(arch=>({platform,arch})));
 const results=selections(cases);
 for(const [i,{platform,arch}] of cases.entries()){
  const result=results[i];
  const supported=targets.has(`${platform}-${arch}`);
  expect(result.tsrsSupported,`${platform}-${arch}`).toBe(supported);
  expect(result.useTsc).toBe(!supported);
  if(supported)expect(result.compilerCommand).toEqual(['npx','tsrs']);
 }
 expect(selection('darwin','arm64',true).useTsc).toBe(true);
});

it('keeps package scripts behind the compiler wrapper',()=>{
 const files=execFileSync('git',['ls-files','**/package.json','package.json'],{encoding:'utf8'}).trim().split('\n');
 for(const file of files){
  const {scripts={}}=JSON.parse(readFileSync(file,'utf8'));
  for(const [name,command] of Object.entries(scripts))expect(command,`${file}#${name}`).not.toMatch(/(?:^|[\s;&|])(?:tsrs|tsc)(?:\s|$)/);
 }
 for(const [file,names] of [['package.json',['typecheck','typecheck:tsc']],['apps/docs/package.json',['build','build:tsc','check','check:tsc']]] as const){
  const {scripts}=JSON.parse(readFileSync(file,'utf8'));
  for(const name of names)expect(scripts[name]).toContain('scripts/tsc.mjs');
 }
});

it('forwards compiler arguments and removes --tsc from the shared CLI',()=>{
 const version=execFileSync(process.execPath,['scripts/tsc.mjs','--tsc','--version'],{encoding:'utf8'});
 const expected=execFileSync(process.execPath,['node_modules/typescript-7/bin/tsc','--version'],{encoding:'utf8'});
 expect(version).toBe(expected);
 expect(()=>execFileSync(process.execPath,['scripts/tsc.mjs','--tsc','--invalid-compiler-option'],{stdio:'pipe'})).toThrow();
});

it('names every byte difference and missing emitted file, including maps',()=>{
 const directory=mkdtempSync(join(tmpdir(),'hig-parity-test-'));
 const left=join(directory,'left'),right=join(directory,'right');
 try{
  mkdirSync(left);mkdirSync(right);
  for(const file of ['index.js','index.d.ts','index.js.map','index.d.ts.map']){
   writeFileSync(join(left,file),'identical\n');writeFileSync(join(right,file),'identical\n');
  }
  expect(compareOutputs(left,right)).toEqual([]);
  writeFileSync(join(right,'index.js'),'different\n');
  writeFileSync(join(right,'index.d.ts'),'identical\r\n');
  writeFileSync(join(right,'index.js.map'),'different map');
  rmSync(join(right,'index.d.ts.map'));
  writeFileSync(join(right,'extra.js'),'extra');
  expect(compareOutputs(left,right)).toEqual(['extra.js','index.d.ts','index.d.ts.map','index.js','index.js.map']);
  rmSync(left,{recursive:true});rmSync(right,{recursive:true});
  mkdirSync(left);mkdirSync(right);
  expect(()=>compareOutputs(left,right)).toThrow('no emitted files');
 }finally{rmSync(directory,{recursive:true,force:true});}
});
