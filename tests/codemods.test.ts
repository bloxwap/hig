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
