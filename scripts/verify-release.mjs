import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const releasePackages=['contracts','tokens','native-fonts','og-fonts','feedback','react','native'].map(name=>`@bloxwap/hig-${name}`);
export const releaseGateIds=['task-policy','source-audit','native-fonts','physical-devices','owning-migrations','upstream-feedback-gaps'];
function currentException(blocker,today){
 const date=blocker.reviewBy;
 const validDate=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
 return blocker.status==='approved-exception'&&typeof blocker.approvedBy==='string'&&blocker.approvedBy.trim().length>0&&/^https:\/\/github\.com\/bloxwap\//.test(blocker.approval??'')&&validDate&&date>=today;
}
/** Verifies only; publication is confined to the manually approved workflow. */
export function verifyReleaseArtifacts(report,{directory,sourceCommit,sourceVersion,tag,today=new Date().toISOString().slice(0,10)}){
 assert.equal(report.dryRun,true,'Release input must be a reviewed dry-run report');
 assert.equal(report.channel,'stable-simulation','Registry release must use coordinated stable artifacts');
 assert.equal(report.published,false);assert.equal(report.tagsCreated,false);assert.equal(report.releasesCreated,false);
 assert.equal(tag,`v${sourceVersion}`,'Tag must match the coordinated source version');
 assert.equal(report.sourceCommit,sourceCommit,'Artifact source must match the immutable release tag');
 assert.equal(report.sourceVersion,sourceVersion);assert.equal(report.artifactVersion,sourceVersion);
 assert(Array.isArray(report.blockers),'Release gates must be explicitly recorded');
 assert.deepEqual(report.blockers.map(blocker=>blocker.id).sort(),[...releaseGateIds].sort(),'All six release gates must be recorded exactly once');
 const pending=report.blockers.filter(blocker=>!['cleared','satisfied'].includes(blocker.status)&&!currentException(blocker,today));
 assert.equal(pending.length,0,`Release gates remain: ${pending.map(blocker=>blocker.id).join(', ')}`);
 assert.deepEqual(report.artifacts.map(artifact=>artifact.package).sort(),[...releasePackages].sort(),'Release must contain the complete approved package set');
 return releasePackages.map(name=>{
  const artifact=report.artifacts.find(artifact=>artifact.package===name);
  assert.equal(artifact.version,sourceVersion,`${name}: coordinated version`);
  assert.equal(artifact.file,`${name.slice('@bloxwap/'.length)}-${sourceVersion}.tgz`,`${name}: expected tarball filename`);
  const file=resolve(directory,artifact.file);const bytes=readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),artifact.sha256,`${name}: tarball hash mismatch`);
  return file;
 });
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i+=2){assert(['--report','--tag','--output'].includes(args[i])&&args[i+1], 'Usage: verify-release.mjs --report <report.json> --tag <vVERSION> [--output <file>]');options[args[i].slice(2)]=args[i+1];}
 assert(options.report&&options.tag,'A release report and immutable tag are required');
 const report=JSON.parse(readFileSync(options.report,'utf8'));
 const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const sourceVersion=JSON.parse(readFileSync('package.json','utf8')).version;
 // CI measurement reports may change; release sources and workflows must remain exactly at the tag.
 execFileSync('git',['diff','--exit-code','HEAD','--','packages','scripts','docs','apps','fixtures','.github','package.json','package-lock.json'],{stdio:'pipe'});
 const files=verifyReleaseArtifacts(report,{directory:dirname(resolve(options.report)),sourceCommit,sourceVersion,tag:options.tag});
 if(options.output)writeFileSync(options.output,files.join('\n')+'\n');
 console.log(`Verified ${files.length} coordinated release artifacts and SHA-256 hashes; nothing published`);
}
