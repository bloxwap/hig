import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// @ts-expect-error The build preflight is executable JavaScript.
import {assertGeneratedFonts} from '../scripts/generated-fonts.mjs';

it('explains font preparation on a fresh checkout, then accepts the generated faces',()=>{
 const root=mkdtempSync(join(tmpdir(),'hig-font-preflight-'));
 try{
  const directory=join(root,'packages/native-fonts/fonts');mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'manifest.json'),JSON.stringify({outputs:{'BloxwapSans.ttf':'fixture'}}));
  expect(()=>assertGeneratedFonts(root,['native-fonts'])).toThrow(/npm run generate:fonts.*fonttools\[woff\]==4\.61\.1.*brotli==1\.2\.0/);
  writeFileSync(join(directory,'BloxwapSans.ttf'),'fixture');
  expect(()=>assertGeneratedFonts(root,['native-fonts'])).not.toThrow();
 }finally{rmSync(root,{recursive:true,force:true});}
});
