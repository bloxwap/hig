import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {compilerCommand} from './compiler.mjs';
for(const p of ['contracts','tokens','native-fonts','og-fonts','feedback','react','chart','native']){if(!existsSync(`packages/${p}/tsconfig.json`))continue;rmSync(`packages/${p}/dist`,{recursive:true,force:true});execFileSync(compilerCommand[0],[...compilerCommand.slice(1),'-p',`packages/${p}/tsconfig.json`],{stdio:'inherit'});}
mkdirSync('packages/tokens/dist',{recursive:true});
for(const p of ['tokens.css','manifest.json'])copyFileSync(`packages/tokens/generated/${p}`,`packages/tokens/dist/${p}`);
for(const css of ['styles.css','base.css'])if(existsSync(`packages/react/src/${css}`))copyFileSync(`packages/react/src/${css}`,`packages/react/dist/${css}`);
execFileSync('npx',['vite','build','fixtures/web'],{stdio:'inherit'});
