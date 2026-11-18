import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
// @ts-expect-error JavaScript codemod is exercised as an executable migration artifact.
import {transformImports} from '../codemods/imports.mjs';
it('changes approved imports while preserving aliases and financial business logic byte-for-byte',()=>{const input="import { Button as Action } from '@/components/ui/button';\nconst rawAmount = '0.00001';\nexport const submit = () => trade(rawAmount);";const result=transformImports(input,'web');expect(result.code).toBe(input.replace('@/components/ui/button','@bloxwap/hig/react/button'));expect(result.warnings.length).toBeGreaterThan(0);});
it('refuses unknown mixed/default imports and cross-platform guessing',()=>{for(const input of ["import Button from '@/components/ui/button';","import { Button, Unknown } from '@/components/ui/button';","import { Switch } from '@workspace/ui-native/switch';"]){expect(transformImports(input,'web').changed).toBe(false);}});
it('targets native single-control exports and leaves legacy variants for manual review',()=>{const native=transformImports("import { Switch } from '@workspace/ui-native/switch';",'native');expect(native.code).toContain('@bloxwap/hig/native/switch');const legacy=transformImports("import { Button } from '@/components/ui/button';\nconst UI=()=> <Button variant='brand' onClick={()=>trade(rawAmount)}/>;",'web');expect(legacy.code).toContain("variant='brand'");expect(legacy.warnings.join(' ')).toContain('Legacy variant retained');});
// @ts-expect-error JavaScript codemod is exercised as an executable migration artifact.
import {splitNativeBlockImports,nativeBlockEntries} from '../codemods/native-blocks.mjs';
it('moves native blocks imports to each block\'s own entry, keeping names, aliases and type modifiers',()=>{
 const input="import { SwapBlock, type SwapBlockProps, SwapKeypad as Keys, MarketRow } from '@bloxwap/hig/native/blocks';\nexport type { SwapToken } from '@bloxwap/hig/native/blocks';\nimport type { RewardEntry } from \"@bloxwap/hig/native/recipes\"\nconst rawAmount = '0.00001';";
 const result=splitNativeBlockImports(input);
 expect(result.code).toBe("import { SwapBlock, type SwapBlockProps } from '@bloxwap/hig/native/swap-block';\nimport { SwapKeypad as Keys } from '@bloxwap/hig/native/swap-parts';\nimport { MarketRow } from '@bloxwap/hig/native/market-row';\nexport type { SwapToken } from '@bloxwap/hig/native/swap-block';\nimport type { RewardEntry } from \"@bloxwap/hig/native/reward-block\"\nconst rawAmount = '0.00001';");
 expect(result.replacements).toBe(3);expect(result.warnings).toEqual([]);
});
it('leaves what it cannot split and says why',()=>{
 for(const input of ["import * as Blocks from '@bloxwap/hig/native/blocks';","import { SwapBlock, NotABlock } from '@bloxwap/hig/native/blocks';","export * from '@bloxwap/hig/native/blocks';"]){const result=splitNativeBlockImports(input);expect(result.changed,input).toBe(false);expect(result.warnings,input).toHaveLength(1);}
 const mocked=splitNativeBlockImports("jest.mock('@bloxwap/hig/native/blocks', () => ({}));\nimport { Button } from '@bloxwap/hig/native/button';");
 expect(mocked.changed).toBe(false);expect(mocked.warnings.join(' ')).toContain('needs a manual change');
});
it('maps every name the native blocks module exports to an entry the package publishes',()=>{
 const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,unknown>;
 const entries=nativeBlockEntries() as Map<string,string>;
 expect(entries.get('SwapBlock')).toBe('swap-block');expect(entries.get('TradeEntry')).toBe('trade-entry');expect(entries.size).toBeGreaterThan(100);
 for(const entry of new Set(entries.values()))expect(exportsMap[`./native/${entry}`],entry).toBeDefined();
});
// @ts-expect-error JavaScript codemod is exercised as an executable migration artifact.
import {replaceSuperseded,supersededPaths,supersededNames} from '../codemods/superseded.mjs';
it('moves a host off the removed paths and names without touching the code below its imports',()=>{
 const input=[
  "import { SwapPanelBlock, type SwapPanelBlockProps, swapAction } from '@bloxwap/hig/react/blocks/swap-panel-block';",
  "import { GestureSheet as Sheet } from '@bloxwap/hig/native/gesture-sheet-next';",
  "import { MarketRow } from \"@bloxwap/hig/react/recipes/market-row\";",
  "import { WalletAddress, type WalletAddressCoreProps } from '@bloxwap/hig/react/wallet-address-core';",
  "export { FromPicker as Source } from '@bloxwap/hig/native/pickers';",
  "jest.mock('@bloxwap/hig/native/gesture-sheet-next', () => ({}));",
  "const lazy = () => import('@bloxwap/hig/react/blocks/swap-panel');",
  "const rawAmount = '0.00001'; const UI = (props: SwapPanelBlockProps) => <SwapPanelBlock {...props}/>;",
 ].join('\n');
 const result=replaceSuperseded(input);
 expect(result.code).toBe([
  "import { SwapBlock as SwapPanelBlock, type SwapBlockProps as SwapPanelBlockProps, swapAction } from '@bloxwap/hig/react/blocks/swap-block';",
  "import { GestureSheet as Sheet } from '@bloxwap/hig/native/gesture-sheet';",
  "import { MarketRow } from \"@bloxwap/hig/react/blocks/market-row\";",
  "import { WalletAddress, type WalletAddressProps as WalletAddressCoreProps } from '@bloxwap/hig/react/wallet-address';",
  "export { FromPickerBlock as Source } from '@bloxwap/hig/native/pickers';",
  "jest.mock('@bloxwap/hig/native/gesture-sheet', () => ({}));",
  "const lazy = () => import('@bloxwap/hig/react/blocks/swap-block');",
  "const rawAmount = '0.00001'; const UI = (props: SwapPanelBlockProps) => <SwapPanelBlock {...props}/>;",
 ].join('\n'));
 expect(result.warnings).toEqual([]);
});
it('leaves the native core entry and unrelated imports alone, and reports what it cannot rename',()=>{
 const kept="import { WalletAddress, type WalletAddressCoreProps } from '@bloxwap/hig/native/wallet-address-core';\nimport { SwapPanel } from './local-swap-panel';";
 expect(replaceSuperseded(kept)).toMatchObject({code:kept,changed:false,warnings:[]});
 const chart=replaceSuperseded("const chart = <AltimeterChart dgen/>;");expect(chart.changed).toBe(false);expect(chart.warnings.join(' ')).toContain('degen');
 expect(replaceSuperseded("import * as Old from '@bloxwap/hig/react/recipes';").warnings).toHaveLength(1);
});
it('maps only to paths and names the package still publishes',async()=>{
 const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,unknown>;
 for(const [old,next] of Object.entries(supersededPaths as Record<string,string>)){expect(exportsMap[old.replace('@bloxwap/hig','.')],old).toBeUndefined();expect(exportsMap[next.replace('@bloxwap/hig','.')],next).toBeDefined();}
 const web={...await import('../packages/hig/react/src/blocks/swap-block'),...await import('../packages/hig/react/src/blocks/pickers')} as Record<string,unknown>;
 const source=readFileSync('packages/hig/react/src/blocks/swap-block.tsx','utf8')+readFileSync('packages/hig/react/src/blocks/pickers.tsx','utf8');
 for(const [old,next] of Object.entries(supersededNames as Record<string,string>)){expect(old in web,old).toBe(false);expect(next in web||new RegExp(`export (?:type|interface) ${next}\\b`).test(source),next).toBe(true);}
});
