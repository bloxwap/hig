// Publishing installs with `npm ci` while PR CI installs with Bun, so package-lock.json must
// match every workspace package.json and resolve the same direct versions as bun.lock (#181).
// `--npm` also regenerates package-lock.json with the pinned npm and fails if it changes.
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const kinds=['dependencies','devDependencies','optionalDependencies','peerDependencies'];
const direct=['dependencies','devDependencies','optionalDependencies'];
export const parseBunLock=text=>new Function(`return (${text})`)();
const bunVersion=entry=>{const id=entry[0];return id.slice(id.lastIndexOf('@')+1);};
export function compareLockfiles({bun,npm,manifest}){
  const problems=[];
  const npmWorkspaces=Object.keys(npm.packages).filter(p=>!p.includes('node_modules/'));
  const paths=[...new Set([...Object.keys(bun.workspaces),...npmWorkspaces])].sort();
  for(const path of paths){
    const label=path||'(root)';const ws=bun.workspaces[path];const npmWs=npm.packages[path];const pkg=manifest(path);
    if(!ws||!npmWs||!pkg){problems.push(`${label}: workspace missing from ${[!ws&&'bun.lock',!npmWs&&'package-lock.json',!pkg&&'package.json'].filter(Boolean).join(' and ')}`);continue;}
    for(const kind of kinds){
      const names=new Set([...Object.keys(pkg[kind]??{}),...Object.keys(ws[kind]??{}),...Object.keys(npmWs[kind]??{})]);
      for(const name of names){
        const want=pkg[kind]?.[name],inBun=ws[kind]?.[name],inNpm=npmWs[kind]?.[name];
        if(want!==inBun)problems.push(`${label} ${kind} ${name}: package.json ${want??'(none)'} but bun.lock ${inBun??'(none)'}`);
        if(want!==inNpm)problems.push(`${label} ${kind} ${name}: package.json ${want??'(none)'} but package-lock.json ${inNpm??'(none)'}`);
      }
    }
    for(const kind of direct)for(const name of Object.keys(pkg[kind]??{})){
      const bunEntry=bun.packages[`${ws.name}/${name}`]??bun.packages[name];
      const npmEntry=(path&&npm.packages[`${path}/node_modules/${name}`])||npm.packages[`node_modules/${name}`];
      if(!bunEntry||!npmEntry){problems.push(`${label} ${name}: not resolved in ${[!bunEntry&&'bun.lock',!npmEntry&&'package-lock.json'].filter(Boolean).join(' and ')}`);continue;}
      const bunResolved=bunVersion(bunEntry);
      if(bunResolved.startsWith('workspace:')&&npmEntry.link)continue;
      if(bunResolved!==npmEntry.version)problems.push(`${label} ${name}: bun.lock resolves ${bunResolved} but package-lock.json resolves ${npmEntry.version??npmEntry.resolved}`);
    }
  }
  return problems;
}
function npmRegenerates(root){
  const pinned=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).packageManager.replace(/^npm@/,'');
  const local=execFileSync('npm',['--version'],{cwd:root,encoding:'utf8'}).trim();
  const command=local===pinned?['npm']:['npx','--yes',`npm@${pinned}`];
  const lock=join(root,'package-lock.json');const before=readFileSync(lock);
  execFileSync(command[0],[...command.slice(1),'install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund'],{cwd:root,stdio:['ignore','ignore','inherit']});
  const after=readFileSync(lock);
  if(after.equals(before))return true;
  writeFileSync(lock,before);
  return false;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const root=process.cwd();
  const manifest=path=>{const file=join(root,path,'package.json');return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):undefined;};
  const problems=compareLockfiles({bun:parseBunLock(readFileSync(join(root,'bun.lock'),'utf8')),npm:JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8')),manifest});
  if(problems.length){console.error(`bun.lock and package-lock.json are out of sync with package.json or each other:\n  ${problems.join('\n  ')}\nRun \`bun install\` and \`npm install --package-lock-only --ignore-scripts\`, then commit both lockfiles.`);process.exit(1);}
  if(process.argv.includes('--npm')&&!npmRegenerates(root)){console.error('package-lock.json is stale: `npm install --package-lock-only --ignore-scripts` changes it. Run that and commit the result.');process.exit(1);}
  console.log(`Lockfiles in sync${process.argv.includes('--npm')?' (npm regenerates package-lock.json unchanged)':''}`);
}
