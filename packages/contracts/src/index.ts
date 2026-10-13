export type Density = 'comfortable' | 'compact';
export type Intent = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type Direction = 'ltr' | 'rtl';
export interface Environment { density: Density; locale: string; direction: Direction; reducedMotion: boolean }
export const defaultEnvironment: Environment = {density:'comfortable',locale:'en-US',direction:'ltr',reducedMotion:false};
/** Display only. Keep raw decimal strings in transaction logic. */
export function formatNumber(value: number | null | undefined, locale = 'en-US', options: Intl.NumberFormatOptions = {}): string {
 return value == null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat(locale, options).format(value);
}
/** Font 0.1.2 publishes CSS/Next loaders, no typed native manifest. */
export interface FontManifest { version: string; faces: ReadonlyArray<{family:string; weight:number; asset:string; script:string}> }
export function nativeFont(manifest: FontManifest, family: string, weight: number, script = 'latin'): string {
 const face = manifest.faces.find(f=>f.family===family && f.weight===weight && f.script===script);
 if (!face) throw new Error(`Register a pinned ${family} ${weight} ${script} native face`);
 return face.family;
}
