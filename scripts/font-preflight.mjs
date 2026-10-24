// #98: release dry run, quality and the packed font smokes read the generated TTFs. They are gitignored and come from
// `npm run generate:fonts` (Python). Check for them first and name the step instead of failing with a raw ENOENT.
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
// Keep in sync with scripts/generate-native-fonts.py, scripts/ci-generate-fonts.sh and docs/governance/new-repository.md (tests/fonts.test.ts).
export const fontGeneratorRequirements=['fonttools[woff]==4.61.1','brotli==1.2.1'];
export const generatedFontDirectories=['packages/native-fonts/fonts','packages/og-fonts/fonts'];
export function generatedFontStatus(root='.'){
 const missing=[],stale=[];
 for(const directory of generatedFontDirectories){
  const manifestPath=join(root,directory,'manifest.json');
  if(!existsSync(manifestPath)){missing.push(`${directory}/manifest.json`);continue;}
  for(const [asset,hash] of Object.entries(JSON.parse(readFileSync(manifestPath,'utf8')).outputs)){
   const path=join(root,directory,asset);
   if(!existsSync(path))missing.push(`${directory}/${asset}`);
   else if(createHash('sha256').update(readFileSync(path)).digest('hex')!==hash)stale.push(`${directory}/${asset}`);
  }
 }
 return {missing,stale};
}
export function generatedFontsMessage({missing,stale},task='This script'){
 const list=files=>files.slice(0,4).join(', ')+(files.length>4?` and ${files.length-4} more`:'');
 const problems=[missing.length?`${missing.length} generated font file(s) are missing: ${list(missing)}`:'',stale.length?`${stale.length} generated font file(s) do not match their manifest SHA-256: ${list(stale)}`:''].filter(Boolean).join('; ');
 return `${task} needs the generated native and OG TTF faces. ${problems}.
Run \`npm run generate:fonts\` first. It needs Python 3 with ${fontGeneratorRequirements.join(' and ')}:
  python3 -m pip install ${fontGeneratorRequirements.map(r=>`"${r}"`).join(' ')}
  npm run generate:fonts
See docs/governance/new-repository.md.`;
}
export function assertGeneratedFonts(task,root='.'){const status=generatedFontStatus(root);if(status.missing.length||status.stale.length)throw Object.assign(Error(generatedFontsMessage(status,task)),{code:'HIG_GENERATED_FONTS'});}
// Entry points: print the actionable message (no stack trace) and exit non-zero.
export function requireGeneratedFonts(task,root='.'){try{assertGeneratedFonts(task,root);}catch(error){if(error.code!=='HIG_GENERATED_FONTS')throw error;console.error(error.message);process.exit(1);}}
