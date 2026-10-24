import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

it('uses the checked-out coordinated version for packed artifacts from any working directory',()=>{
 const directory=mkdtempSync(join(tmpdir(),'hig-version-'));
 try{
  mkdirSync(join(directory,'scripts'));
  writeFileSync(join(directory,'package.json'),JSON.stringify({version:'0.9.7'}));
  const script=join(directory,'scripts/workspace-version.mjs');
  copyFileSync('scripts/workspace-version.mjs',script);
  const probe=`import {workspaceVersion,packedTarball} from ${JSON.stringify(pathToFileURL(script).href)};console.log(JSON.stringify({version:workspaceVersion,file:packedTarball('tokens',${JSON.stringify(join(directory,'artifacts'))})}));`;
  const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',probe],{cwd:tmpdir(),encoding:'utf8'}));
  expect(result).toEqual({version:'0.9.7',file:join(directory,'artifacts/bloxwap-hig-tokens-0.9.7.tgz')});
 }finally{rmSync(directory,{recursive:true,force:true});}
});

it('passes versioned archive paths through the boundary smoke array mapping',()=>{
 const script=pathToFileURL(join(process.cwd(),'scripts/packed-boundaries-smoke.mjs')).href;
 const probe=`import childProcess from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';import {rmSync} from 'node:fs';import {build} from 'esbuild';void build;childProcess.execFileSync=(command,args,options)=>{console.log(JSON.stringify(args));rmSync(options.cwd,{recursive:true,force:true});process.exit(0);};syncBuiltinESMExports();await import(${JSON.stringify(script)});`;
 const args=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',probe],{encoding:'utf8'}));
 const version=JSON.parse(readFileSync('package.json','utf8')).version;
 expect(args.slice(4)).toEqual(['tokens','contracts','feedback'].map(name=>join(process.cwd(),'artifacts',`bloxwap-hig-${name}-${version}.tgz`)));
});
