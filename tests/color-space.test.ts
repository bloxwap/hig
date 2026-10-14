import {expect,it} from 'vitest';
// @ts-expect-error Build-time JS conversion has no public runtime declaration.
import {oklchToSrgb,oklchToDisplayP3,srgbHexToDisplayP3} from '../scripts/color-space.mjs';
import {sourceColors,nativeColors,tokens} from '../packages/tokens/src';
it('preserves authored semantic values, native alpha and explicit color spaces',()=>{
 expect(sourceColors.web.background).toBe('oklch(0.145 0 0)');
 expect(sourceColors.android.border).toBe('rgba(255, 255, 255, 0.1)');
 expect(oklchToSrgb('oklch(1 0 0 / 15%)')).toBe('rgba(255, 255, 255, 0.15)');
 expect(oklchToDisplayP3('oklch(0 0 0)')).toBe('#000000');
 expect(srgbHexToDisplayP3('#ff0000')).toBe('#ea3323');
 expect(nativeColors.android.action).toBe('#00ff3f');
 expect(nativeColors.iosDisplayP3.action).toBe('#00ff3d');
 expect(tokens.colors.surface.srgb).toBe(sourceColors.android.card);
});
