// PR CI and publishing install with `bun install --frozen-lockfile`.
// This gate checks every workspace package.json against bun.lock.
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const kinds=['dependencies','devDependencies','optionalDependencies','peerDependencies'];
const direct=['dependencies','devDependencies','optionalDependencies'];
export const parseBunLock=text=>new Function(`return (${text})`)();
const bunVersion=entry=>{const id=entry[0];return id.slice(id.lastIndexOf('@')+1);};
export function compareLockfiles({bun,manifest}){
  const problems=[];
  for(const [path,entry] of Object.entries(bun.packages??{})){
    const resolved=entry?.[1];
    if(typeof resolved==='string' && resolved.startsWith('file:') && resolved.endsWith('.tgz'))
      problems.push(`${path}: local tarball resolution ${resolved} cannot be installed on a clean release runner; use the published registry package`);
  }
  for(const path of Object.keys(bun.workspaces??{}).sort()){
    const label=path||'(root)';const ws=bun.workspaces[path];const pkg=manifest(path);
    if(!ws||!pkg){problems.push(`${label}: workspace missing from ${[!ws&&'bun.lock',!pkg&&'package.json'].filter(Boolean).join(' and ')}`);continue;}
    for(const kind of kinds){
      const names=new Set([...Object.keys(pkg[kind]??{}),...Object.keys(ws[kind]??{})]);
      for(const name of names){
        const want=pkg[kind]?.[name],inBun=ws[kind]?.[name];
        if(want!==inBun)problems.push(`${label} ${kind} ${name}: package.json ${want??'(none)'} but bun.lock ${inBun??'(none)'}`);
      }
    }
    for(const kind of direct)for(const name of Object.keys(pkg[kind]??{})){
      const bunEntry=bun.packages[`${ws.name}/${name}`]??bun.packages[name];
      if(!bunEntry){problems.push(`${label} ${name}: not resolved in bun.lock`);continue;}
      const bunResolved=bunVersion(bunEntry);
      if(bunResolved.startsWith('workspace:'))continue;
    }
  }
  return problems;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const root=process.cwd();
  const manifest=path=>{const file=join(root,path,'package.json');return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):undefined;};
  const problems=compareLockfiles({bun:parseBunLock(readFileSync(join(root,'bun.lock'),'utf8')),manifest});
  if(problems.length){console.error(`bun.lock is out of sync with package.json:\n  ${problems.join('\n  ')}\nRun \`bun install\`, then commit bun.lock.`);process.exit(1);}
  console.log('bun.lock in sync with package.json');
}
