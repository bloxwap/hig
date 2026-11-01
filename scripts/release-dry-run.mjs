import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,cpSync,existsSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {checkExports,qualityReport} from './quality.mjs';
import {requireGeneratedFonts} from './font-preflight.mjs';
const args=process.argv.slice(2);let channel='candidate';
for(let i=0;i<args.length;i++){if(args[i]==='--channel'&&['candidate','stable-simulation'].includes(args[i+1])){channel=args[++i];}else throw Error('Dry-run only: supported argument is --channel candidate|stable-simulation. Publishing, releases and tags are prohibited.');}
requireGeneratedFonts('The release dry run');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
// Capture input state before quality/report generation updates tracked measurement evidence.
const sourceTreeDirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();
// Rebuild the captured packages and docs before staging. Ignored output can otherwise contain an
// older API even when HEAD and the working tree are clean.
execFileSync('npm',['run','build'],{stdio:'inherit'});
const sourceVersion=JSON.parse(readFileSync('package.json','utf8')).version;
const artifactVersion=channel==='candidate'?`${sourceVersion}-candidate.sha${commit.slice(0,8)}`:sourceVersion;
const output=resolve(`artifacts/release-${channel}`);mkdirSync(output,{recursive:true});
const artifacts=[];const report=await qualityReport();
// One published package: @bloxwap/hig, with every surface behind a subpath export.
{
 const root='packages/hig',manifest=JSON.parse(readFileSync(`${root}/package.json`,'utf8'));
 if(manifest.name!=='@bloxwap/hig')throw Error(`Unexpected release package ${manifest.name}`);
 if(manifest.version!==sourceVersion)throw Error('Coordinated version mismatch');
 const stage=join(output,'staging','hig');rmSync(stage,{recursive:true,force:true});mkdirSync(stage,{recursive:true});
 for(const entry of manifest.files){if(entry.startsWith('!')||!existsSync(`${root}/${entry}`))continue;cpSync(`${root}/${entry}`,join(stage,entry),{recursive:true});}
 manifest.version=artifactVersion;
 writeFileSync(join(stage,'package.json'),JSON.stringify(manifest,null,2)+'\n');
 checkExports(stage);
 const packed=JSON.parse(execFileSync('npm',['pack',stage,'--ignore-scripts','--json','--pack-destination',output],{encoding:'utf8'}))[0];const bytes=readFileSync(join(output,packed.filename));
 artifacts.push({package:manifest.name,version:artifactVersion,file:packed.filename,bytes:bytes.length,unpackedBytes:packed.unpackedSize,sha256:createHash('sha256').update(bytes).digest('hex'),files:packed.files.map(f=>f.path),fileSizes:Object.fromEntries(packed.files.map(f=>[f.path,f.size])),dependencies:manifest.dependencies,peers:Object.keys(manifest.peerDependencies??{}),optionalPeers:Object.keys(manifest.peerDependenciesMeta??{}).filter(k=>manifest.peerDependenciesMeta[k]?.optional)});
}
const [artifact]=artifacts,stagingDirectory=join(output,"staging","hig");
// Web consumers load fonts from @bloxwap/font; native faces ship only under native-fonts/fonts (#64) and the
// OG/Satori subset of those faces only under og-fonts/fonts (#99). Web entries resolve neither directory.
const fontFile=/\.(?:ttf|otf|woff2?)$/i,fontDirectories=['native-fonts/fonts/','og-fonts/fonts/'];
const strayFonts=artifact.files.filter(f=>fontFile.test(f)&&!fontDirectories.some(d=>f.startsWith(d)));
if(strayFonts.length)throw Error(`Font binaries outside the font entries: ${strayFonts.join(', ')}`);
const sizeOf=prefix=>{const files=artifact.files.filter(f=>f.startsWith(prefix));if(!files.length)throw Error(`Missing ${prefix} in the release artifact`);return {entry:`@bloxwap/hig/${prefix.replace(/\/$/,'')}`,files:files.length,unpackedBytes:files.reduce((sum,f)=>sum+artifact.fileSizes[f],0),gzipBytes:files.reduce((sum,f)=>sum+gzipSync(readFileSync(join(stagingDirectory,f)),{level:9}).length,0),fontFiles:files.filter(f=>fontFile.test(f)).length};};
const ogFontsLimit=1_000_000;
const packedSizes={package:{file:artifact.file,bytes:artifact.bytes,unpackedBytes:artifact.unpackedBytes},webTokens:sizeOf('tokens/'),nativeFonts:sizeOf('native-fonts/'),ogFonts:{...sizeOf('og-fonts/'),limit:ogFontsLimit}};
if(packedSizes.webTokens.fontFiles!==0)throw Error('Web tokens entry ships font files');
if(packedSizes.ogFonts.gzipBytes>=ogFontsLimit)throw Error(`@bloxwap/hig/og-fonts compresses to ${packedSizes.ogFonts.gzipBytes} B, over the ${ogFontsLimit} B OG budget (#99)`);
// #96: @bloxwap/chart is a required peer only. An optional @bloxwap/chart peer makes npm 11 drop a host's workspace
// @bloxwap/chart when the lockfile is regenerated from scratch.
if(!artifact.peers.includes('@bloxwap/chart')||artifact.optionalPeers.includes('@bloxwap/chart')||Object.hasOwn(artifact.dependencies??{},'@bloxwap/chart'))throw Error('@bloxwap/hig must declare @bloxwap/chart as a required peer only (#96)');
const chartAdapter={package:'@bloxwap/hig',entry:'@bloxwap/hig/chart',file:artifact.file,peer:'@bloxwap/chart',peerOptional:false};
const blockers=JSON.parse(readFileSync('planning/release-blockers.json','utf8'));
rmSync(join(output,'docs'),{recursive:true,force:true});cpSync('apps/docs/dist',join(output,'docs'),{recursive:true});
const release={dryRun:true,published:false,tagsCreated:false,releasesCreated:false,channel,sourceCommit:commit,sourceTreeDirty,sourceVersion,artifactVersion,docsGuidelineVersion:sourceVersion,versionPolicy:'Prerelease package metadata references the same source/contract/docs candidate version and commit; no source versions or git refs are mutated.',artifacts,packedSizes,chartAdapter,quality:report.sizes,publishable:false,blockers,rollback:'No deployment/publication occurred. Owners retain previous lockfile/artifacts and pilot flags; use docs/governance/release.md for rollout rollback.'};
writeFileSync(join(output,'report.json'),JSON.stringify(release,null,2)+'\n');
writeFileSync('evidence/release-dry-run.json',JSON.stringify(release,null,2)+'\n');
writeFileSync(join(output,'CHANGELOG.md'),`# ${artifactVersion} (${channel}, dry run)\n\nSource: ${commit}; HIG contract/docs ${sourceVersion}.\n\nOne @bloxwap/hig package: semantic tokens and separate renderer entries; optional feedback; docs/playground/gallery; migration/quality governance. No npm publication, release, tag or deployment.\n\nPublication requires the maintainer-approved workflow and the satisfied or current owner-exception gates recorded in report.json.\n`);
console.log(`Dry run ${channel}: ${artifacts.length} local artifacts, ${artifactVersion}; no publication/release/tag; ${blockers.length} explicit blockers`);
