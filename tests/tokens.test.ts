import {describe,it,expect} from 'vitest';
import {tokens,nativeColors,withAlpha} from '../packages/tokens/src/index';
import {formatNumber,nativeFont} from '../packages/contracts/src/index';
import contrast from '../evidence/contrast.json';
describe('platform contracts',()=>{
 it('keeps direction aliases',()=>{expect(tokens.colors.buy.srgb).toBe(tokens.colors.positive.srgb);expect(tokens.colors.sell.srgb).toBe('#ff5c5c');});
 it('keeps CSS out of RN',()=>{for(const color of Object.values(nativeColors.android))expect(color).toMatch(/^#[0-9a-f]{6}$/);expect(nativeColors.iosP3.action.components).toEqual([0,1,.24]);});
 it('validates alpha',()=>{expect(withAlpha('#00ff3f',.5)).toBe('#00ff3f80');expect(()=>withAlpha('red',2)).toThrow();});
 it('checks approved text pairs',()=>{expect(contrast.pairs.every(p=>p.aa)).toBe(true);});
 it('preserves unknown/zero/locale',()=>{expect(formatNumber(null)).toBe('—');expect(formatNumber(0)).toBe('0');expect(formatNumber(1234.5,'de-DE')).toBe('1.234,5');});
 it('requires registered native faces',()=>{expect(()=>nativeFont({version:'0.1.2',faces:[]},'Bloxwap Sans',400)).toThrow();});
});
