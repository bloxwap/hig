/** Resolved brand roles. Primary colours are opaque sRGB hex on every platform. */
export interface PrimaryColors {action:string;focus:string;onAction:string}

const linear=(channel:number)=>channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4;
const gamma=(channel:number)=>channel<=0.0031308?12.92*channel:1.055*channel**(1/2.4)-0.055;
const hex=(channels:number[])=>'#'+channels.map(channel=>Math.round(Math.min(1,Math.max(0,channel))*255).toString(16).padStart(2,'0')).join('');

/** Override action/focus together, choosing black or white text for maximum contrast.
 * Display P3 output converts the sRGB input for an iOS host using P3 channels.
 * Status and market-direction roles stay independent of the brand colour.
 */
export function resolvePrimaryColor(primaryColor:string,colorSpace:'srgb'|'display-p3'='srgb'):PrimaryColors {
 if(typeof primaryColor!=='string'||!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(primaryColor))throw new Error('HIG primaryColor must be an opaque sRGB hex colour (#RGB or #RRGGBB).');
 const normalized=primaryColor.length===4?'#'+[...primaryColor.slice(1)].map(channel=>channel+channel).join('').toLowerCase():primaryColor.toLowerCase();
 const [r,g,b]=normalized.slice(1).match(/../g)!.map(channel=>linear(parseInt(channel,16)/255));
 const luminance=0.2126*r+0.7152*g+0.0722*b;
 const onAction=(luminance+0.05)/0.05>=1.05/(luminance+0.05)?'#000000':'#ffffff';
 // Same linear sRGB -> Display P3 matrix as scripts/color-space.mjs.
 const action=colorSpace==='display-p3'?hex([
  0.8224621209*r+0.1775378791*g,
  0.0331941989*r+0.9668058011*g,
  0.0170826307*r+0.0723974407*g+0.9105199286*b
 ].map(gamma)):normalized;
 return {action,focus:action,onAction};
}
