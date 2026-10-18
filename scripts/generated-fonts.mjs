import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repository=fileURLToPath(new URL('..',import.meta.url));
/** Fail before packing or measuring incomplete artifacts, with the reproducible preparation step. */
export function assertGeneratedFonts(root=repository,packages=['native-fonts','og-fonts']){
 const missing=[];
 for(const name of packages){
  const directory=join(root,'packages',name,'fonts');
  const manifest=join(directory,'manifest.json');
  if(!existsSync(manifest)){missing.push(`packages/${name}/fonts/manifest.json`);continue;}
  for(const asset of Object.keys(JSON.parse(readFileSync(manifest,'utf8')).outputs)){
   if(!existsSync(join(directory,asset)))missing.push(`packages/${name}/fonts/${asset}`);
  }
 }
 if(missing.length)throw new Error(`Generated HIG fonts are missing (${missing.join(', ')}). Run npm run generate:fonts before quality, packing, or release checks. Python requires fonttools[woff]==4.61.1 and brotli==1.2.0; install them in your Python environment with: python3 -m pip install "fonttools[woff]==4.61.1" "brotli==1.2.0".`);
}
