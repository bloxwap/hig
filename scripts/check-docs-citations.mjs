import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {markdownFiles,guideRoute,headings} from './docs-content.mjs';

export function checkAnchors(baseline,current,renamedAnchors){
 const exists=target=>{const i=target.indexOf('#');return i>0&&current[target.slice(0,i)]?.includes(target.slice(i+1));};
 for(const [from,entry] of Object.entries(renamedAnchors)){
  if(!entry.note?.trim()||!exists(entry.to))throw new Error(`Invalid renamedAnchors entry: ${from}; require a note and existing replacement`);
 }
 for(const [route,ids] of Object.entries(baseline))for(const id of ids){
  const key=`${route}#${id}`;
  if(!current[route]?.includes(id)&&!renamedAnchors[key])throw new Error(`Removed published anchor: ${key}; retain it or add renamedAnchors with a replacement and deprecation note`);
 }
}
export function checkCitations(){
 const current={};const version=JSON.parse(readFileSync('package.json','utf8')).version;
 for(const file of markdownFiles()){
  const source=readFileSync(file,'utf8');const stamp=source.match(/^# .* · HIG (.+)$/m)?.[1];
  if(stamp&&stamp!==version)throw new Error(`${file}: chapter version ${stamp} differs from package.json ${version}`);
  current[guideRoute(file)]=headings(source).map(h=>h.id);
 }
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const tags=git('tag','--list','v*','--sort=-version:refname').trim().split('\n').filter(t=>/^v\d+\.\d+\.\d+$/.test(t));
 let baseline,ref;
 for(const tag of tags){
  const paths=git('ls-tree','--name-only',tag,'planning/anchors.json').trim();
  if(paths){baseline=JSON.parse(git('show',`${tag}:planning/anchors.json`));ref=tag;break;}
 }
 if(!baseline){baseline=JSON.parse(git('show','HEAD:planning/anchors.json'));ref='HEAD (bootstrap: no released tag contains anchors.json)';}
 const {renamedAnchors}=JSON.parse(readFileSync('planning/renamed-anchors.json','utf8'));
 checkAnchors(baseline,current,renamedAnchors);
 if(JSON.stringify(current)!==JSON.stringify(JSON.parse(readFileSync('planning/anchors.json','utf8'))))throw new Error('Stale planning/anchors.json; run generate-docs.mjs');
 console.log(`Docs citations passed against ${ref}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)checkCitations();
