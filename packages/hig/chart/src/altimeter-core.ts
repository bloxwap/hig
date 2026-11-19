// Platform-independent chart geometry and feed. This entry loads neither renderer.
export * from './altimeter-model.js';
export * from './altimeter-targets.js';
export * from './altimeter-trail.js';
export type {TargetLabelInsets} from './outcome-model.js';
export {bitcoinPrice,type AltimeterFeed} from './bitcoin-price.js';

export interface AltimeterPosition {
 side:'long'|'short';
 breakEvenPrice:number;
 /** Host-reported net P&L, including fees where applicable. */
 pnl:number;
 /** Default is price. For a percentage, supply the return as a ratio (0.025 means +2.50%). */
 capsule?:'price'|'pnl'|{returnRatio:number};
}

export const ALTIMETER_BURST_COOLDOWN_MS=600;
export function sparkGeometry(index:number,direction:'up'|'down'){
  // Eighteen sparks fan into the crossing; six shorter sparks scatter back.
  const forward=index<18,count=forward?18:6,slot=forward?index:index-18;
  const angle=Math.PI*(slot+.5)/count;
  const dx=Math.cos(angle),dy=Math.sin(angle)*(direction==='up'?-1:1)*(forward?1:-1);
  const distance=forward?50+(index%5)*12:28+(index%3)*10,size=4+index%4;
  return {dx,dy,distance,size};
}
