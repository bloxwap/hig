import {processColor} from 'react-native';

/** Multiply the colour's own alpha, including for translucent host market colours. */
export function translucent(fill:string,alpha:number):string|undefined{
 if(/^#[0-9a-f]{6}$/i.test(fill)){
  const alphaByte=Math.round(alpha*255).toString(16).padStart(2,'0');
  return fill+alphaByte;
 }
 const argb=processColor(fill);
 if(typeof argb!=='number')return undefined;
 const red=(argb>>>16)&255,green=(argb>>>8)&255,blue=argb&255;
 const opacity=Number(((argb>>>24)/255*alpha).toFixed(3));
 return `rgba(${red},${green},${blue},${opacity})`;
}

export const buttonTint=(accent:string)=>translucent(accent,0.15)??'transparent';
