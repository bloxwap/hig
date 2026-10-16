// Node-only loader for Satori / next/og renderers (#99). Edge runtimes copy fonts/* at build time and check
// fontManifest.outputs themselves; see docs/installation.md.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fontManifest,ogFonts,type OgFont,type OgFontAsset} from './index.js';

export interface LoadedOgFont { readonly name: OgFont['name']; readonly weight: OgFont['weight']; readonly style: 'normal'; readonly data: Buffer }

/** Reads one packaged TTF and throws unless its SHA-256 matches the manifest. */
export async function readOgFont(asset: OgFontAsset): Promise<Buffer> {
  const expected = fontManifest.outputs[asset];
  if (!expected) throw new Error(`@bloxwap/hig-og-fonts does not ship ${String(asset)}`);
  const data = await readFile(new URL(`../fonts/${asset}`, import.meta.url));
  const actual = createHash('sha256').update(data).digest('hex');
  if (actual !== expected) throw new Error(`@bloxwap/hig-og-fonts ${asset}: SHA-256 ${actual} does not match the manifest (${expected})`);
  return data;
}

/** Verified fonts in the shape Satori and next/og ImageResponse take: {name, data, weight, style}. */
export async function loadOgFonts(faces: ReadonlyArray<OgFont> = ogFonts): Promise<LoadedOgFont[]> {
  return Promise.all(faces.map(async face => ({name: face.name, weight: face.weight, style: face.style, data: await readOgFont(face.asset)})));
}
