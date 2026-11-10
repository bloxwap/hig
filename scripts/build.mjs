import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {compilerCommand} from './compiler.mjs';
import {buildOrder,entryGraph} from './build-order.mjs';
// Every packages/hig entry, each after the entries it imports via @bloxwap/hig/<entry> (#182).
for(const p of buildOrder(entryGraph())){if(!existsSync(`packages/hig/${p}/tsconfig.json`))throw new Error(`Missing packages/hig/${p}/tsconfig.json`);rmSync(`packages/hig/${p}/dist`,{recursive:true,force:true});execFileSync(compilerCommand[0],[...compilerCommand.slice(1),'-p',`packages/hig/${p}/tsconfig.json`],{stdio:'inherit'});}
mkdirSync('packages/hig/tokens/dist',{recursive:true});
for(const p of ['tokens.css','manifest.json'])copyFileSync(`packages/hig/tokens/generated/${p}`,`packages/hig/tokens/dist/${p}`);
for(const css of ['styles.css','base.css'])if(existsSync(`packages/hig/react/src/${css}`))copyFileSync(`packages/hig/react/src/${css}`,`packages/hig/react/dist/${css}`);
execFileSync('npx',['vite','build','fixtures/web'],{stdio:'inherit'});
