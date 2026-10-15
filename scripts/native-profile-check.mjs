// Runs the native Jest suite and the @bloxwap/hig-native typecheck against an alternate React Native/Expo
// profile (fixtures/native/profiles/<name>.json) in an isolated install, e.g. `--profile rn-0.83` (#68).
// The workspace itself stays on the certified RN 0.81.5 / Expo 54 toolchain.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,cpSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
const name=process.argv[process.argv.indexOf('--profile')+1];
if(!process.argv.includes('--profile')||!name)throw Error('Usage: node scripts/native-profile-check.mjs --profile <name>');
const profile=JSON.parse(readFileSync(`fixtures/native/profiles/${name}.json`,'utf8'));
const root=JSON.parse(readFileSync('package.json','utf8'));
const dir=mkdtempSync(join(tmpdir(),`hig-native-${name}-`));
for(const path of ['packages/native/src','packages/native/tsconfig.json','packages/tokens/dist','packages/tokens/assets','packages/tokens/package.json','packages/contracts/dist','packages/contracts/package.json','tests/native','jest.native.config.cjs','babel.config.cjs','tsconfig.json'])cpSync(path,join(dir,path),{recursive:true});
const pick=names=>Object.fromEntries(names.map(n=>[n,root.devDependencies[n]]));
writeFileSync(join(dir,'package.json'),JSON.stringify({name:`hig-native-${name}`,private:true,dependencies:{...profile.dependencies,...profile.devDependencies,...pick(['jest','@gorhom/bottom-sheet','typescript','@types/react'])}},null,2));
const tarballs=readdirSync('artifacts').filter(n=>/hig-(tokens|contracts)-/.test(n)&&n.endsWith('.tgz')).map(n=>resolve('artifacts',n));
execFileSync('npm',['install','--no-audit','--no-fund','--legacy-peer-deps',...tarballs],{cwd:dir,stdio:'pipe'});
const version=pkg=>JSON.parse(readFileSync(join(dir,'node_modules',pkg,'package.json'),'utf8')).version;
console.log(`Native profile ${profile.profile}: react-native ${version('react-native')}, react ${version('react')}, expo ${version('expo')}, jest-expo ${version('jest-expo')}`);
execFileSync('npx',['tsc','-p','packages/native/tsconfig.json','--noEmit'],{cwd:dir,stdio:'inherit'});
console.log('Typecheck: @bloxwap/hig-native sources against the profile React Native types passed');
execFileSync('npx',['jest','--config','jest.native.config.cjs'],{cwd:dir,stdio:'inherit'});
console.log(`Native Jest suite passed on ${profile.profile}`);
