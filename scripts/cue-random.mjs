// Only preloaded in the offline CLI subprocess. Fixed noise makes recipe comparisons
// sensitive without widening dB tolerances to accommodate random short transients.
// Mulberry32; keep this seed/algorithm stable alongside the committed manifest.
let state=0x183;
Math.random=()=>{
 let value=state+=0x6D2B79F5;
 value=Math.imul(value^(value>>>15),value|1);
 value^=value+Math.imul(value^(value>>>7),value|61);
 return ((value^(value>>>14))>>>0)/4294967296;
};
