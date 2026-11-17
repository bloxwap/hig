// The generated avatar face, as plain arithmetic shared by the web and native renderers so both draw the same face for a seed.
// The geometry is the "beam" variant of boring-avatars 2.0.4 (MIT, https://boringavatars.com): the same seed and palette give the
// same shapes and the same palette positions, so a host that moves from that package keeps its faces.

/** Side of the square the face is drawn in. Every length in a `BeamAvatar` is in these units; renderers scale it with a `0 0 36 36` view box. */
export const beamSize = 36;
/** The eyes: two rounded bars at `leftEyeX` and `rightEyeX`. */
export const beamEye = {y:14,width:1.5,height:2,radius:1} as const;
/** Which ink reads on a colour: `dark` on a bright colour, `light` on a deep one. */
export type BeamInk = 'dark' | 'light';
/** The two inks a face may be drawn in. */
export interface BeamInks {dark:string;light:string}
/** boring-avatars' own inks. Renderers pass the provider's background and text roles instead. */
export const beamInks:BeamInks = {dark:'#000000',light:'#FFFFFF'};
/** A generated face: what to paint and where, with no platform types. */
export interface BeamAvatar {
 /** Position in the palette of the backdrop colour. */
 backgroundIndex:number;
 /** Position in the palette of the wrapper colour. */
 wrapperIndex:number;
 /** The backdrop: the whole square. */
 backgroundColor:string;
 /** The wrapper: the tilted shape the face sits on. */
 wrapperColor:string;
 /** Which ink reads on the wrapper colour. */
 ink:BeamInk;
 /** The eyes and mouth: `inks[ink]`. */
 faceColor:string;
 /** SVG transform of the wrapper, a `beamSize` square at the origin. */
 wrapperTransform:string;
 /** Corner radius of the wrapper: `beamSize` makes it a disc, `beamSize / 6` a rounded square. */
 wrapperRadius:number;
 /** SVG transform of the group that holds the eyes and mouth. */
 faceTransform:string;
 /** SVG path of the mouth. */
 mouthPath:string;
 /** True: the mouth is a line, stroked one unit wide with round caps and no fill. False: it is a filled shape with no stroke. */
 mouthStroked:boolean;
 /** Left edge of the left eye. */
 leftEyeX:number;
 /** Left edge of the right eye. */
 rightEyeX:number;
}

/** boring-avatars' string hash: a 32-bit rolling hash of the UTF-16 code units, made positive. It is case-sensitive, so pass an address in one casing. */
export function beamHash(seed:string):number {
 let hash = 0;
 for (let index = 0; index < seed.length; index++) { hash = (hash << 5) - hash + seed.charCodeAt(index); hash = hash & hash; }
 return Math.abs(hash);
}
const digit = (value:number,place:number):number => Math.floor(value / Math.pow(10, place) % 10);
const even = (value:number,place:number):boolean => digit(value, place) % 2 === 0;
/** `value % range`, negated when the decimal digit at `place` is even. A zero stays a plain zero, so descriptions compare equal. */
function unit(value:number,range:number,place?:number):number { const rest = value % range; return place && rest !== 0 && even(value, place) ? -rest : rest; }

const channel = (text:string,scale:number):number => text.endsWith('%') ? parseFloat(text) * 2.55 : parseFloat(text) * scale;
/** Red, green and blue (0–255) of `#rgb`, `#rrggbb` (an alpha digit pair is ignored), `rgb()` and `color(srgb | display-p3 …)`; undefined for anything else, such as a CSS variable or a colour name. Display P3 channels are read as they are written, which is close enough to choose an ink. */
function channels(color:string):readonly [number,number,number]|undefined {
 const text = color.trim().toLowerCase();
 const hex = /^#([0-9a-f]{3,8})$/.exec(text)?.[1];
 if (hex !== undefined) {
  if (hex.length === 3 || hex.length === 4) return [parseInt(hex[0]! + hex[0]!, 16), parseInt(hex[1]! + hex[1]!, 16), parseInt(hex[2]! + hex[2]!, 16)];
  if (hex.length === 6 || hex.length === 8) return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  return undefined;
 }
 const call = /^(rgba?|color)\(\s*(?:(srgb|display-p3)\s+)?([^)]*)\)$/.exec(text);
 if (!call) return undefined;
 const [, name, space, body = ''] = call;
 if ((name === 'color') !== (space !== undefined)) return undefined;
 const parts = body.split('/')[0]!.split(/[\s,]+/).filter(Boolean);
 if (parts.length < 3) return undefined;
 const [red, green, blue] = parts.slice(0, 3).map(part => channel(part, name === 'color' ? 255 : 1)) as [number,number,number];
 return Number.isFinite(red) && Number.isFinite(green) && Number.isFinite(blue) ? [red, green, blue] : undefined;
}
/**
 * The ink that reads on `color`, by boring-avatars' rule: `dark` when the colour's YIQ brightness is 128 or more, otherwise `light`.
 * A six-digit hex colour gets the answer boring-avatars gives. A colour this cannot read (a CSS variable, a colour name) gets `dark`,
 * because avatar palettes are bright; boring-avatars itself draws white there.
 */
export function beamInk(color:string):BeamInk {
 const rgb = channels(color);
 if (!rgb) return 'dark';
 return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 >= 128 ? 'dark' : 'light';
}

/**
 * The face for `seed` in `colors`: the same seed and palette always give the same description, on every platform.
 * `colors` is the palette, in order; its length decides which positions a seed lands on, so a host keeps its faces by keeping its palette.
 * `inks` are the two colours the eyes and mouth may take; the wrapper colour chooses between them (`beamInk`).
 * An empty palette gives empty colours at position 0; renderers substitute their default palette before calling.
 */
export function beamAvatar(seed:string,colors:readonly string[],inks:BeamInks = beamInks):BeamAvatar {
 const hash = beamHash(seed), range = Math.max(1, colors.length);
 const wrapperIndex = hash % range, backgroundIndex = (hash + 13) % range;
 const wrapperColor = colors[wrapperIndex] ?? '', backgroundColor = colors[backgroundIndex] ?? '';
 const preX = unit(hash, 10, 1), wrapperX = preX < 5 ? preX + beamSize / 9 : preX;
 const preY = unit(hash, 10, 2), wrapperY = preY < 5 ? preY + beamSize / 9 : preY;
 const faceX = wrapperX > beamSize / 6 ? wrapperX / 2 : unit(hash, 8, 1);
 const faceY = wrapperY > beamSize / 6 ? wrapperY / 2 : unit(hash, 7, 2);
 const centre = beamSize / 2, mouthY = 19 + unit(hash, 3), eyeSpread = unit(hash, 5), mouthStroked = even(hash, 2);
 const ink = beamInk(wrapperColor);
 return {
  backgroundIndex, wrapperIndex, backgroundColor, wrapperColor, ink, faceColor:inks[ink],
  wrapperTransform:`translate(${wrapperX} ${wrapperY}) rotate(${unit(hash, 360)} ${centre} ${centre}) scale(${1 + unit(hash, beamSize / 12) / 10})`,
  wrapperRadius:even(hash, 1) ? beamSize : beamSize / 6,
  faceTransform:`translate(${faceX} ${faceY}) rotate(${unit(hash, 10, 3)} ${centre} ${centre})`,
  mouthPath:mouthStroked ? `M15 ${mouthY}c2 1 4 1 6 0` : `M13,${mouthY} a1,0.75 0 0,0 10,0`,
  mouthStroked,
  leftEyeX:14 - eyeSpread,
  rightEyeX:20 + eyeSpread,
 };
}
