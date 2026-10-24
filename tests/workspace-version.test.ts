import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
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
