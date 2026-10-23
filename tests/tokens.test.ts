import {describe,it,expect} from 'vitest';
import {tokens,nativeColors,withAlpha} from '../packages/tokens/src/index';
import {formatNumber,nativeFont} from '../packages/contracts/src/index';
import contrast from '../evidence/contrast.json';
import {fontManifest} from '../packages/native-fonts/src/index';
import {readFileSync,existsSync} from 'node:fs';
describe('platform contracts',()=>{
 it('keeps direction aliases',()=>{expect(tokens.colors.buy.srgb).toBe(tokens.colors.positive.srgb);expect(tokens.colors.sell.srgb).toBe(tokens.colors.negative.srgb);});
 it('keeps CSS out of RN',()=>{for(const color of Object.values(nativeColors.android))expect(color).toMatch(/^#[0-9a-f]{6}$/);expect(nativeColors.iosP3.action.components).toEqual([0,1,.24]);});
 it('validates alpha',()=>{expect(withAlpha('#00ff3f',.5)).toBe('#00ff3f80');expect(()=>withAlpha('red',2)).toThrow();});
 it('checks approved text pairs',()=>{expect(contrast.pairs.every(p=>p.aa)).toBe(true);});
 it('preserves unknown/zero/locale',()=>{expect(formatNumber(null)).toBe('—');expect(formatNumber(0)).toBe('0');expect(formatNumber(1234.5,'de-DE')).toBe('1.234,5');});
 it('requires registered native faces',()=>{expect(()=>nativeFont({version:'0.1.2',faces:[]},'Bloxwap Sans',400)).toThrow();});
});
describe('token CSS roles (#65, #66)',()=>{
 const css=readFileSync('packages/tokens/generated/tokens.css','utf8');
 const root=css.slice(0,css.indexOf('}'));
 it('defines radius, type, motion and density roles from source.json',()=>{
  for(const [k,v] of Object.entries(tokens.radius))expect(root).toContain(`--hig-radius-${k}: ${v>=9999?`${v}px`:`${v/16}rem`};`);
  for(const [k,v] of Object.entries(tokens.type)){expect(root).toContain(`--hig-type-${k}-size: ${v.size/16}rem;`);expect(root).toContain(`--hig-type-${k}-line-height: ${v.lineHeight/16}rem;`);expect(root).toContain(`--hig-type-${k}-weight: ${v.weight};`);expect(root).toContain(`--hig-type-${k}: ${v.weight} ${v.size/16}rem/${v.lineHeight/16}rem var(--hig-font-sans);`);}
  for(const [k,v] of Object.entries(tokens.motion))expect(root).toContain(`--hig-motion-duration-${k}: ${v}ms;`);
  expect(root).toContain('--hig-motion-easing-standard: cubic-bezier(0.22, 1, 0.36, 1);');
  for(const [mode,metrics] of Object.entries(tokens.density))for(const [k,v] of Object.entries(metrics))expect(root).toContain(`--hig-density-${mode}-${k}: ${v/16}rem;`);
  expect(css).toContain("[data-hig-density='compact'] { --hig-density-control: var(--hig-density-compact-control);");
 });
 it('zeroes motion durations for reduced motion',()=>{
  const reduced=Object.keys(tokens.motion).map(k=>`--hig-motion-duration-${k}: 0ms;`).join(' ');
  expect(css).toContain(`@media (prefers-reduced-motion: reduce) { :root { ${reduced} } }`);
  expect(css).toContain(`[data-hig-motion='reduced'] { ${reduced} }`);
 });
 it('exposes font roles that prefer the @bloxwap/font Next variables, then literal families',()=>{
  expect(root).toContain("--hig-font-sans: var(--font-bloxwap-sans, 'Bloxwap Sans'), system-ui, sans-serif;");
  expect(root).toContain("--hig-font-mono: var(--font-bloxwap-mono, 'Bloxwap Mono'), ui-monospace, monospace;");
  const controls=readFileSync('packages/react/src/styles.css','utf8');
  expect(controls).toContain("font:600 1rem/1.5 var(--hig-font-sans,'Bloxwap Sans',system-ui,sans-serif)");
  expect(controls).toContain("font-family:var(--hig-font-mono,'Bloxwap Mono',monospace)");
  expect(controls).not.toMatch(/font(?:-family)?:[^;{}]*?(?<!var\(--hig-font-(?:sans|mono),)'Bloxwap (?:Sans|Mono)'/);
 });
});
describe('native fonts package (#64)',()=>{
 it('keeps font binaries out of the web tokens package',()=>{
  const pkg=JSON.parse(readFileSync('packages/tokens/package.json','utf8'));
  expect(Object.keys(pkg.exports).some(k=>k.startsWith('./fonts'))).toBe(false);
  expect(existsSync('packages/tokens/assets/fonts')).toBe(false);
 });
 it('ships the typed manifest that resolves registered faces',()=>{
  expect(fontManifest).toEqual(JSON.parse(readFileSync('packages/native-fonts/fonts/manifest.json','utf8')));
  expect(nativeFont(fontManifest,'BloxwapSans',600)).toBe('BloxwapSansSemiBold');
  expect(Object.keys(fontManifest.outputs)).toHaveLength(15);
 });
});
