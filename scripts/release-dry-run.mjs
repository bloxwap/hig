import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,cpSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {checkExports,qualityReport} from './quality.mjs';
import {requireGeneratedFonts} from './font-preflight.mjs';
const args=process.argv.slice(2);let channel='candidate';
for(let i=0;i<args.length;i++){if(args[i]==='--channel'&&['candidate','stable-simulation'].includes(args[i+1])){channel=args[++i];}else throw Error('Dry-run only: supported argument is --channel candidate|stable-simulation. Publishing, releases and tags are prohibited.');}
requireGeneratedFonts('The release dry run');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const sourceVersion=JSON.parse(readFileSync('package.json','utf8')).version;
const artifactVersion=channel==='candidate'?`${sourceVersion}-candidate.sha${commit.slice(0,8)}`:sourceVersion;
const output=resolve(`artifacts/release-${channel}`);mkdirSync(output,{recursive:true});
const artifacts=[];const report=await qualityReport();
for(const name of readdirSync('packages')){
 const root=`packages/${name}`,manifest=JSON.parse(readFileSync(`${root}/package.json`,'utf8'));
 if(manifest.version!==sourceVersion)throw Error('Coordinated version mismatch');
 const stage=join(output,'staging',name);mkdirSync(stage,{recursive:true});
 for(const entry of manifest.files){if(entry.startsWith('!')||!existsSync(`${root}/${entry}`))continue;cpSync(`${root}/${entry}`,join(stage,entry),{recursive:true});}
 manifest.version=artifactVersion;
 for(const field of ['dependencies','peerDependencies'])for(const key of Object.keys(manifest[field]??{}))if(key.startsWith('@bloxwap/hig-'))manifest[field][key]=artifactVersion;
 writeFileSync(join(stage,'package.json'),JSON.stringify(manifest,null,2)+'\n');
 checkExports(stage);
 const packed=JSON.parse(execFileSync('npm',['pack',stage,'--ignore-scripts','--json','--pack-destination',output],{encoding:'utf8'}))[0];const bytes=readFileSync(join(output,packed.filename));
 artifacts.push({package:manifest.name,version:artifactVersion,file:packed.filename,bytes:bytes.length,unpackedBytes:packed.unpackedSize,sha256:createHash('sha256').update(bytes).digest('hex'),files:packed.files.map(f=>f.path),dependencies:manifest.dependencies,optionalPeers:Object.keys(manifest.peerDependenciesMeta??{})});
}
// Web consumers load fonts from @bloxwap/font; native faces ship only in @bloxwap/hig-native-fonts (#64) and the
// OG/Satori subset of those faces only in @bloxwap/hig-og-fonts (#99).
const fontFile=/\.(?:ttf|otf|woff2?)$/i,fontPackages=['@bloxwap/hig-native-fonts','@bloxwap/hig-og-fonts'];
for(const artifact of artifacts.filter(a=>!fontPackages.includes(a.package)))if(artifact.files.some(f=>fontFile.test(f)))throw Error(`Font binary in web/shared package ${artifact.package}`);
const sizeOf=name=>{const artifact=artifacts.find(a=>a.package===name);if(!artifact)throw Error(`Missing release artifact ${name}`);return {file:artifact.file,bytes:artifact.bytes,unpackedBytes:artifact.unpackedBytes,fontFiles:artifact.files.filter(f=>fontFile.test(f)).length};};
const ogFontsLimit=1_000_000;
const packedSizes={webTokens:sizeOf('@bloxwap/hig-tokens'),nativeFonts:sizeOf('@bloxwap/hig-native-fonts'),ogFonts:{...sizeOf('@bloxwap/hig-og-fonts'),limit:ogFontsLimit}};
if(packedSizes.webTokens.fontFiles!==0)throw Error('Web tokens package ships font files');
if(packedSizes.ogFonts.bytes>=ogFontsLimit)throw Error(`@bloxwap/hig-og-fonts packed ${packedSizes.ogFonts.bytes} B, over the ${ogFontsLimit} B OG budget (#99)`);
const blockers=JSON.parse(readFileSync('planning/release-blockers.json','utf8'));
cpSync('apps/docs/dist',join(output,'docs'),{recursive:true});
const release={dryRun:true,published:false,tagsCreated:false,releasesCreated:false,channel,sourceCommit:commit,sourceVersion,artifactVersion,docsGuidelineVersion:sourceVersion,versionPolicy:'Prerelease package metadata references the same source/contract/docs candidate version and commit; no source versions or git refs are mutated.',artifacts,packedSizes,quality:report.sizes,publishable:false,blockers,rollback:'No deployment/publication occurred. Owners retain previous lockfile/artifacts and pilot flags; use docs/governance/release.md for rollout rollback.'};
writeFileSync(join(output,'report.json'),JSON.stringify(release,null,2)+'\n');
writeFileSync('evidence/release-dry-run.json',JSON.stringify(release,null,2)+'\n');
writeFileSync(join(output,'CHANGELOG.md'),`# ${artifactVersion} (${channel}, dry run)\n\nSource: ${commit}; HIG contract/docs ${sourceVersion}.\n\nSemantic tokens and separate renderers; optional feedback; docs/playground/gallery; migration/quality governance. No npm publication, release, tag or deployment.\n\nStable publication is blocked by task policy and pending source/device/adoption evidence.\n`);
console.log(`Dry run ${channel}: ${artifacts.length} local artifacts, ${artifactVersion}; no publication/release/tag; ${blockers.length} explicit blockers`);
