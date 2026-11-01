import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {compilerCommand} from './compiler.mjs';
for(const p of ['contracts','tokens','native-fonts','og-fonts','feedback','react','chart','native']){if(!existsSync(`packages/hig/${p}/tsconfig.json`))continue;rmSync(`packages/hig/${p}/dist`,{recursive:true,force:true});execFileSync(compilerCommand[0],[...compilerCommand.slice(1),'-p',`packages/hig/${p}/tsconfig.json`],{stdio:'inherit'});}
mkdirSync('packages/hig/tokens/dist',{recursive:true});
for(const p of ['tokens.css','manifest.json'])copyFileSync(`packages/hig/tokens/generated/${p}`,`packages/hig/tokens/dist/${p}`);
for(const css of ['styles.css','base.css'])if(existsSync(`packages/hig/react/src/${css}`))copyFileSync(`packages/hig/react/src/${css}`,`packages/hig/react/dist/${css}`);
execFileSync('npx',['vite','build','fixtures/web'],{stdio:'inherit'});
