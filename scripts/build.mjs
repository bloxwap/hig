import {execFileSync} from 'node:child_process';
import {readdirSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
for(const p of readdirSync('packages')){if(!existsSync(`packages/${p}/tsconfig.json`))continue;execFileSync('npx',['tsc','-p',`packages/${p}/tsconfig.json`],{stdio:'inherit'});}
mkdirSync('packages/tokens/dist',{recursive:true});
for(const p of ['tokens.css','manifest.json'])copyFileSync(`packages/tokens/generated/${p}`,`packages/tokens/dist/${p}`);
if(existsSync('packages/react/src/styles.css'))copyFileSync('packages/react/src/styles.css','packages/react/dist/styles.css');
execFileSync('npx',['vite','build','fixtures/web'],{stdio:'inherit'});
