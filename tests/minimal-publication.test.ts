import {expect,it} from 'vitest';
import {readFileSync,mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
// @ts-expect-error Executable CI plan.
import {qualityPlan} from '../scripts/ci-quality-tasks.mjs';

it('builds and smoke-tests stable artifacts in release-tag CI',()=>{
 expect(qualityPlan('release','stable-simulation').map(([,args]:[string,string[]])=>args)).toEqual([
  ['run','release:dry-run','--','--channel','stable-simulation'],
  ['run','smoke:release-artifact','--','stable-simulation'],
 ]);
 expect(()=>qualityPlan('release','unknown')).toThrow('Unknown release channel');
 const quality=readFileSync('.github/workflows/quality.yml','utf8');
 expect(quality).toContain('npx --yes npm@11.6.1 ci');
 expect(quality).toContain('hig-stable-release-${{ github.sha }}');
 expect(quality).toContain('"$RELEASE_SECURITY" != success');
});

it('publication prerequisite fails closed without reviewers, exact tag, or a unique stable artifact',()=>{
 const root=mkdtempSync(join(tmpdir(),'hig-publication-gate-'));
 const workflow=readFileSync('.github/workflows/publish.yml','utf8');
 const command=workflow.split('        run: |\n')[1].split('\n  publish:')[0].split('\n').map(line=>line.slice(10)).join('\n');
 const gh=join(root,'gh'),output=join(root,'output');
 writeFileSync(gh,`#!${process.execPath}\nconst args=process.argv.slice(2);const route=args[1]??'';if(args[0]==='run')console.log('77');else if(route.includes('/commits/'))console.log('a'.repeat(40));else if(route.includes('/environments/'))console.log(process.env.REVIEWERS??'1');else if(route.includes('/artifacts'))console.log(process.env.ARTIFACT??'123');else process.exit(9);\n`);
 chmodSync(gh,0o755);
 const run=(env:Record<string,string | undefined>={})=>{
  writeFileSync(output,'');
  return spawnSync('bash',['-c',command],{encoding:'utf8',env:{...process.env,PATH:`${root}:${process.env.PATH}`,GITHUB_OUTPUT:output,GITHUB_REF:'refs/tags/v0.8.2',RELEASE_TAG:'v0.8.2',GITHUB_EVENT_NAME:'workflow_dispatch',GH_REPO:'bloxwap/hig',...env}});
 };
 try{
  expect(run().status).toBe(0);
  expect(readFileSync(output,'utf8')).toBe(`quality-run=77\nartifact-id=123\nrelease-sha=${'a'.repeat(40)}\n`);
  for(const env of [{REVIEWERS:'0'},{ARTIFACT:''},{ARTIFACT:'123\n456'},{GITHUB_REF:'refs/heads/main'}]){
   expect(run(env).status).not.toBe(0);
   expect(readFileSync(output,'utf8')).toBe('');
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
