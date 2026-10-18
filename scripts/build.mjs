import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,existsSync} from 'node:fs';
for(const p of ['contracts','tokens','native-fonts','og-fonts','feedback','react','native']){if(!existsSync(`packages/${p}/tsconfig.json`))continue;execFileSync('npx',['tsc','-p',`packages/${p}/tsconfig.json`],{stdio:'inherit'});}
mkdirSync('packages/tokens/dist',{recursive:true});
for(const p of ['tokens.css','manifest.json'])copyFileSync(`packages/tokens/generated/${p}`,`packages/tokens/dist/${p}`);
for(const file of ['styles.css','base.css'])copyFileSync(`packages/react/src/${file}`,`packages/react/dist/${file}`);
execFileSync('npx',['vite','build','fixtures/web'],{stdio:'inherit'});
