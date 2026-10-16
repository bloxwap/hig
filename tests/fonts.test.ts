import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {nativeFont} from '../packages/contracts/src/index';
import {fontManifest as nativeManifest} from '../packages/native-fonts/src/index';
import {fontManifest as ogManifest,ogFonts} from '../packages/og-fonts/src/index';
// @ts-expect-error Executable JavaScript gate tested through its public functions.
import {fontGeneratorRequirements,generatedFontDirectories,generatedFontStatus,generatedFontsMessage} from '../scripts/font-preflight.mjs';

// A checkout with the committed manifests but no generated TTFs, as on a fresh clone before `npm run generate:fonts`.
function checkoutWithoutFonts(){
 const root=mkdtempSync(join(tmpdir(),'hig-no-fonts-'));
 for(const directory of generatedFontDirectories as string[]){mkdirSync(join(root,directory),{recursive:true});writeFileSync(join(root,directory,'manifest.json'),readFileSync(join(directory,'manifest.json')));}
 return root;
}
function expectActionable(output:string){
 expect(output).toContain('npm run generate:fonts');
 expect(output).toContain('python3 -m pip install "fonttools[woff]==4.61.1" "brotli==1.2.0"');
 expect(output).toContain('packages/native-fonts/fonts/BloxwapSans.ttf');
 expect(output).not.toContain('ENOENT');
}

describe('generated font preflight (#98)',()=>{
 it('the release dry run names the missing generate:fonts step instead of a raw ENOENT',()=>{
  const result=spawnSync(process.execPath,[resolve('scripts/release-dry-run.mjs'),'--channel','candidate'],{cwd:checkoutWithoutFonts(),encoding:'utf8'});
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/^The release dry run needs the generated native and OG TTF faces\. 20 generated font file\(s\) are missing/);
  expectActionable(result.stderr);
 });
 it('quality and the packed native smoke fail the same way before touching the faces',()=>{
  for(const [script,label] of [['scripts/quality.mjs','npm run quality'],['scripts/packed-native-smoke.mjs','smoke:packed-native'],['scripts/packed-og-smoke.mjs','smoke:packed-og']]){
   const result=spawnSync(process.execPath,[resolve(script)],{cwd:checkoutWithoutFonts(),encoding:'utf8'});
   expect(result.status,script).toBe(1);expect(result.stderr).toContain(`${label} needs the generated native and OG TTF faces`);expectActionable(result.stderr);
  }
 });
 it('reports faces whose bytes no longer match the manifest',()=>{
  const root=checkoutWithoutFonts();writeFileSync(join(root,'packages/og-fonts/fonts/BloxwapSans.ttf'),'stale');
  const status=generatedFontStatus(root);
  expect(status.stale).toEqual(['packages/og-fonts/fonts/BloxwapSans.ttf']);
  expect(generatedFontsMessage(status,'Test')).toContain('1 generated font file(s) do not match their manifest SHA-256: packages/og-fonts/fonts/BloxwapSans.ttf');
 });
 it('names the same Python pins as the generator, CI and the setup guide',()=>{
  expect(fontGeneratorRequirements).toEqual(['fonttools[woff]==4.61.1','brotli==1.2.0']);
  expect(readFileSync('scripts/generate-native-fonts.py','utf8')).toContain('Requires fonttools[woff]==4.61.1 and brotli==1.2.0');
  expect(readFileSync('scripts/generate-native-fonts.py','utf8')).toContain("fontTools.__version__ != '4.61.1'");
  const workflow=readFileSync('.github/workflows/quality.yml','utf8');
  expect(workflow.match(/pip install "fonttools\[woff\]==4\.61\.1" "brotli==1\.2\.0"/g)?.length).toBe(workflow.match(/npm run generate:fonts/g)?.length);
  expect(readFileSync('docs/governance/new-repository.md','utf8')).toContain('`fonttools[woff]==4.61.1` and `brotli==1.2.0`');
 });
});

describe('OG/Satori fonts package (#99)',()=>{
 it('ships the typed manifest and copies native faces byte for byte, so every SHA-256 matches the native manifest',()=>{
  expect(ogManifest).toEqual(JSON.parse(readFileSync('packages/og-fonts/fonts/manifest.json','utf8')));
  expect(ogManifest.sources).toEqual(nativeManifest.sources);
  expect(ogManifest.derivedFrom).toBe('@bloxwap/hig-native-fonts');
  for(const [asset,hash] of Object.entries(ogManifest.outputs))expect(hash,asset).toBe((nativeManifest.outputs as Record<string,string>)[asset]);
  for(const face of ogManifest.faces)expect(nativeManifest.faces).toContainEqual(face);
  expect(ogManifest.faces.map(f=>f.asset)).toEqual(Object.keys(ogManifest.outputs));
 });
 it('covers the faces the chart, sfx, agent-cli and tapsiren OG cards load, all Latin',()=>{
  expect(Object.keys(ogManifest.outputs)).toEqual(['BloxwapSans.ttf','BloxwapSans-Medium.ttf','BloxwapSans-Bold.ttf','BloxwapSans-Black.ttf','BloxwapMono-Medium.ttf']);
  expect(readFileSync('scripts/generate-native-fonts.py','utf8')).toContain(`OG_FACES = [${Object.keys(ogManifest.outputs).map(a=>`'${a}'`).join(', ')}]`);
  expect(new Set(ogManifest.faces.map(f=>f.script))).toEqual(new Set(['latin']));
  expect(nativeFont(ogManifest,'BloxwapSans',700)).toBe('BloxwapSansBold');
 });
 it('describes each face in the Satori font shape',()=>{
  expect(ogFonts.map(f=>`${f.name} ${f.weight}`)).toEqual(['Bloxwap Sans 400','Bloxwap Sans 500','Bloxwap Sans 700','Bloxwap Sans 900','Bloxwap Mono 500']);
  for(const face of ogFonts){expect(face.style).toBe('normal');expect(face.sha256).toBe(ogManifest.outputs[face.asset]);}
 });
 it('names every face with its own literal asset URL so Turbopack and webpack bundle all five',async()=>{
  // A template URL (`../fonts/${asset}`) made Turbopack, the Next 16 default, read one file for every face (#99).
  const source=readFileSync('packages/og-fonts/src/node.ts','utf8');
  const literals=[...source.matchAll(/new URL\('\.\.\/fonts\/([^']+)', import\.meta\.url\)/g)].map(m=>m[1]);
  expect(literals).toEqual(Object.keys(ogManifest.outputs));
  expect(source.match(/new URL\(/g)).toHaveLength(literals.length);
  expect(source).not.toMatch(/new URL\(`/);
  const {loadOgFonts,readOgFont}=await import('../packages/og-fonts/src/node');
  const {createHash}=await import('node:crypto');
  const fonts=await loadOgFonts();
  expect(fonts.map(f=>createHash('sha256').update(f.data).digest('hex'))).toEqual(ogFonts.map(f=>f.sha256));
  await expect(readOgFont('constructor' as never)).rejects.toThrow('does not ship constructor');
 });
 it('keeps the raw faces well under the 1 MB packed budget (gzip measured by the release dry run)',()=>{
  expect(ogManifest.faces.reduce((sum,f)=>sum+f.bytes,0)).toBeLessThan(2_300_000);
  const pkg=JSON.parse(readFileSync('packages/og-fonts/package.json','utf8'));
  expect(pkg.name).toBe('@bloxwap/hig-og-fonts');expect(pkg.version).toBe(JSON.parse(readFileSync('package.json','utf8')).version);
  expect(Object.keys(pkg.exports)).toEqual(['.','./node','./manifest','./fonts/*']);
 });
});
