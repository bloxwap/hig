/**
 * HIG's QR code: the encoder and the drawing geometry, shared by the web and native `QRCode` so both platforms draw the same
 * modules from the same arithmetic. Pure TypeScript with no DOM, React, React Native or package dependency.
 *
 * The encoder follows ISO/IEC 18004 (QR Code Model 2): numeric, alphanumeric and byte (UTF-8) modes, versions 1 to 40, error
 * correction L/M/Q/H, Reed–Solomon blocks, all eight masks scored with the four penalty rules, format and version information.
 */
/** Error correction level: roughly 7%, 15%, 25% and 30% of the code can be lost and still read. */
export type QRErrorCorrection='low'|'medium'|'quartile'|'high';
/** How the payload is packed: digits only, the 45-character upper-case alphabet, or UTF-8 bytes. */
export type QRMode='numeric'|'alphanumeric'|'byte';
export interface QREncodeOptions {
 /** Error correction level; default `medium`. */
 errorCorrection?:QRErrorCorrection;
 /** Symbol version 1 to 40 (21 to 177 modules a side). Omitted, the smallest version that holds the value is used. */
 version?:number;
 /** Mask pattern 0 to 7. Omitted, the mask with the lowest penalty score is used. */
 mask?:number;
 /** Packing mode. Omitted, the densest mode the whole value fits: `numeric`, then `alphanumeric`, then `byte`. */
 mode?:QRMode;
}
/** An encoded symbol, without a quiet zone. */
export interface QRMatrix {
 /** Modules per side: `17 + 4 × version`. */
 size:number;
 version:number;
 errorCorrection:QRErrorCorrection;
 /** The mask pattern applied, 0 to 7. */
 mask:number;
 mode:QRMode;
 /** `size × size` modules in row order; 1 is dark. */
 modules:Uint8Array;
}
const LEVELS:readonly QRErrorCorrection[]=['low','medium','quartile','high'];
// ISO/IEC 18004 Table 9, versions 1 to 40: error correction codewords in each block, then the number of blocks.
const ECC_WORDS:Readonly<Record<QRErrorCorrection,readonly number[]>>={
 low:[7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
 medium:[10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
 quartile:[13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
 high:[17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
};
const BLOCKS:Readonly<Record<QRErrorCorrection,readonly number[]>>={
 low:[1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
 medium:[1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
 quartile:[1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
 high:[1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
};
// Table 12: the two format bits that name each level.
const LEVEL_BITS:Readonly<Record<QRErrorCorrection,number>>={low:1,medium:0,quartile:3,high:2};
const MODE_BITS:Readonly<Record<QRMode,number>>={numeric:1,alphanumeric:2,byte:4};
// Table 3: bits in the character count, for versions 1–9, 10–26 and 27–40.
const COUNT_BITS:Readonly<Record<QRMode,readonly number[]>>={numeric:[10,12,14],alphanumeric:[9,11,13],byte:[8,16,16]};
/** Table 5: the alphanumeric alphabet in value order. */
export const QR_ALPHANUMERIC='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const alphanumericValue=(code:number)=>code<128?QR_ALPHANUMERIC.indexOf(String.fromCharCode(code)):-1;
/** Modules that carry data and error correction in a version: the symbol less its function patterns. */
function rawModules(version:number):number{
 let bits=(16*version+128)*version+64;
 if(version>=2){const align=Math.floor(version/7)+2;bits-=(25*align-10)*align-55;if(version>=7)bits-=36;}
 return bits;
}
/** Data capacity and block layout of a version at a level. */
function layout(version:number,level:QRErrorCorrection){
 const total=rawModules(version)>>>3,ecc=ECC_WORDS[level][version-1]!,blocks=BLOCKS[level][version-1]!;
 return {total,ecc,blocks,short:blocks-total%blocks,shortData:Math.floor(total/blocks)-ecc,data:total-ecc*blocks};
}
/** Centres of the alignment patterns along one axis (Annex E); empty for version 1. */
export function qrAlignmentCentres(version:number):number[]{
 if(version===1)return [];
 const count=Math.floor(version/7)+2,size=17+4*version,step=Math.floor((version*8+count*3+5)/(count*4-4))*2,centres=[6];
 for(let position=size-7;centres.length<count;position-=step)centres.splice(1,0,position);
 return centres;
}
/** The 15 format bits for a level and mask: five data bits, ten BCH(15,5) bits, masked with 101010000010010. */
export function qrFormatBits(level:QRErrorCorrection,mask:number):number{
 const data=LEVEL_BITS[level]<<3|mask;let remainder=data;
 for(let i=0;i<10;i++)remainder=remainder<<1^(remainder>>>9)*0x537;
 return (data<<10|remainder)^0x5412;
}
/** The 18 version bits for versions 7 and up: six data bits and twelve Golay(18,6) bits. */
export function qrVersionBits(version:number):number{
 let remainder=version;
 for(let i=0;i<12;i++)remainder=remainder<<1^(remainder>>>11)*0x1f25;
 return version<<12|remainder;
}
// GF(2^8) over x^8 + x^4 + x^3 + x^2 + 1. The exponent table is doubled so a product needs no modulo.
const EXP=new Uint8Array(510),LOG=new Uint8Array(256);
for(let i=0,x=1;i<255;i++){EXP[i]=x;EXP[i+255]=x;LOG[x]=i;x<<=1;if(x&0x100)x^=0x11d;}
const generators=new Map<number,Uint8Array>();
/** Coefficients of the Reed–Solomon generator polynomial of a degree, highest power first, without the leading 1. */
function generator(degree:number):Uint8Array{
 const known=generators.get(degree);if(known)return known;
 const poly=new Uint8Array(degree);poly[degree-1]=1;
 for(let i=0;i<degree;i++){
  const root=EXP[i]!;
  for(let j=0;j<degree;j++){const c=poly[j]!;poly[j]=(c?EXP[LOG[c]!+LOG[root]!]!:0)^(j+1<degree?poly[j+1]!:0);}
 }
 generators.set(degree,poly);return poly;
}
/** Error correction codewords of one block: the remainder of the data polynomial divided by the generator. */
function remainder(data:Uint8Array,gen:Uint8Array):Uint8Array{
 const degree=gen.length,result=new Uint8Array(degree);
 for(let i=0;i<data.length;i++){
  const factor=data[i]!^result[0]!;result.copyWithin(0,1);result[degree-1]=0;
  if(factor){const log=LOG[factor]!;for(let j=0;j<degree;j++){const g=gen[j]!;if(g)result[j]=result[j]!^EXP[LOG[g]!+log]!;}}
 }
 return result;
}
/** The Reed–Solomon error correction codewords of one block: `count` codewords for the data codewords given. */
export function qrErrorCorrectionCodewords(data:Uint8Array,count:number):Uint8Array{return remainder(data,generator(count));}
/** UTF-8 bytes of a string; an unpaired surrogate becomes U+FFFD, as `TextEncoder` writes it. */
export function qrUtf8(text:string):Uint8Array{
 const bytes:number[]=[];
 for(let i=0;i<text.length;i++){
  let code=text.charCodeAt(i);
  if(code>=0xd800&&code<=0xdbff&&i+1<text.length){const low=text.charCodeAt(i+1);if(low>=0xdc00&&low<=0xdfff){code=0x10000+(code-0xd800<<10)+(low-0xdc00);i++;}}
  if(code>=0xd800&&code<=0xdfff)code=0xfffd;
  if(code<0x80)bytes.push(code);
  else if(code<0x800)bytes.push(0xc0|code>>6,0x80|code&63);
  else if(code<0x10000)bytes.push(0xe0|code>>12,0x80|code>>6&63,0x80|code&63);
  else bytes.push(0xf0|code>>18,0x80|code>>12&63,0x80|code>>6&63,0x80|code&63);
 }
 return Uint8Array.from(bytes);
}
/** The densest mode that holds every character of a value: digits are `numeric`, the Table 5 alphabet `alphanumeric`, anything else `byte`. */
export function qrMode(value:string):QRMode{
 let mode:QRMode='numeric';
 for(let i=0;i<value.length;i++){const v=alphanumericValue(value.charCodeAt(i));if(v<0)return 'byte';if(v>9)mode='alphanumeric';}
 return mode;
}
const countBits=(mode:QRMode,version:number)=>COUNT_BITS[mode][Math.floor((version+7)/17)]!;
/** Payload bits after the mode and count fields. */
function payloadBits(mode:QRMode,length:number):number{return mode==='numeric'?Math.floor(length/3)*10+[0,4,7][length%3]!:mode==='alphanumeric'?Math.floor(length/2)*11+length%2*6:length*8;}
/** The interleaved data and error correction codewords of a symbol. */
function codewords(value:string,bytes:Uint8Array|null,mode:QRMode,version:number,level:QRErrorCorrection):Uint8Array{
 const plan=layout(version,level),data=new Uint8Array(plan.data),length=bytes?bytes.length:value.length;
 let position=0,held=0,heldBits=0;
 // Most significant bit first; at most 16 bits a push, so the accumulator stays well inside 32 bits.
 const push=(bits:number,count:number)=>{held=held<<count|bits;for(heldBits+=count;heldBits>=8;)data[position++]=held>>>(heldBits-=8)&0xff;};
 push(MODE_BITS[mode],4);push(length,countBits(mode,version));
 if(bytes)for(let i=0;i<length;i++)push(bytes[i]!,8);
 else if(mode==='numeric')for(let i=0;i<length;i+=3){const digits=Math.min(3,length-i);push(Number(value.slice(i,i+digits)),[0,4,7,10][digits]!);}
 else{for(let i=0;i+1<length;i+=2)push(alphanumericValue(value.charCodeAt(i))*45+alphanumericValue(value.charCodeAt(i+1)),11);if(length&1)push(alphanumericValue(value.charCodeAt(length-1)),6);}
 // Terminator (up to four zero bits), zero bits to the next codeword, then the two pad codewords in turn.
 let used=position*8+heldBits;
 if(heldBits)data[position]=held<<8-heldBits&0xff;
 used+=Math.min(4,plan.data*8-used);
 for(let i=Math.ceil(used/8),pad=0;i<plan.data;i++,pad^=1)data[i]=pad?0x11:0xec;
 // Split into blocks (the short ones first), then interleave data codewords and error correction codewords.
 const gen=generator(plan.ecc),blocks:Uint8Array[]=[],parity:Uint8Array[]=[];
 for(let i=0,start=0;i<plan.blocks;i++){const size=plan.shortData+(i<plan.short?0:1),block=data.subarray(start,start+size);blocks.push(block);parity.push(remainder(block,gen));start+=size;}
 const result=new Uint8Array(plan.total);let out=0;
 for(let i=0;i<=plan.shortData;i++)for(const block of blocks)if(i<block.length)result[out++]=block[i]!;
 for(let i=0;i<plan.ecc;i++)for(const block of parity)result[out++]=block[i]!;
 return result;
}
/** Whether mask pattern `mask` inverts the module at a column and row (Table 10). */
export function qrMaskAt(mask:number,column:number,row:number):boolean{
 switch(mask){
  case 0:return (column+row)%2===0;
  case 1:return row%2===0;
  case 2:return column%3===0;
  case 3:return (column+row)%3===0;
  case 4:return (Math.floor(column/3)+Math.floor(row/2))%2===0;
  case 5:return column*row%2+column*row%3===0;
  case 6:return (column*row%2+column*row%3)%2===0;
  default:return ((column+row)%2+column*row%3)%2===0;
 }
}
/** The function patterns of a version and the cells they reserve: finders, separators, alignment and timing patterns, with the format and version cells left light. */
function template(version:number):{modules:Uint8Array;reserved:Uint8Array}{
 const size=17+4*version,modules=new Uint8Array(size*size),reserved=new Uint8Array(size*size);
 const set=(column:number,row:number,dark:boolean|number)=>{modules[row*size+column]=dark?1:0;reserved[row*size+column]=1;};
 for(const [left,top] of [[0,0],[size-7,0],[0,size-7]] as const)for(let dy=-1;dy<8;dy++)for(let dx=-1;dx<8;dx++){
  const column=left+dx,row=top+dy;if(column<0||row<0||column>=size||row>=size)continue;
  const ring=Math.max(Math.abs(dx-3),Math.abs(dy-3));set(column,row,ring!==2&&ring<4);
 }
 const centres=qrAlignmentCentres(version);
 for(const row of centres)for(const column of centres){
  if(reserved[row*size+column])continue;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(column+dx,row+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 }
 for(let i=0;i<size;i++){if(!reserved[6*size+i])set(i,6,i%2===0);if(!reserved[i*size+6])set(6,i,i%2===0);}
 for(let i=0;i<9;i++){
  if(i!==6){set(8,i,0);set(i,8,0);}
  if(i<8){set(size-1-i,8,0);set(8,size-1-i,0);}
 }
 if(version>=7)for(let i=0;i<18;i++){const a=size-11+i%3,b=Math.floor(i/3);set(a,b,0);set(b,a,0);}
 return {modules,reserved};
}
// Rule 3's sequence, 1011101 with four light modules after it or before it, as the last eleven modules of a line.
const FINDER_LIKE=0b10111010000,FINDER_LIKE_REVERSED=0b00001011101;
/**
 * The mask penalty of a symbol (ISO/IEC 18004 §7.8.3): runs of five or more, 2×2 blocks, finder-like sequences and the share of
 * dark modules. `encodeQR` scores each candidate with its format and version cells still light, as the `qr` encoder behind Cuer
 * and python-qrcode do, so HIG picks the same mask they pick.
 */
export function qrPenalty(modules:Uint8Array,size:number):number{
 let score=0,dark=0;
 // Along the rows: runs, finder-like sequences (the last eleven modules, kept as bits), 2×2 blocks against the row above, and the dark count.
 for(let row=0,at=0;row<size;row++){
  let run=0,previous=2,window=0;
  for(let column=0;column<size;column++,at++){
   const cell=modules[at]!;dark+=cell;
   if(cell===previous)run++;else{if(run>=5)score+=run-2;run=1;previous=cell;}
   window=(window<<1|cell)&0x7ff;
   if(column>=10&&(window===FINDER_LIKE||window===FINDER_LIKE_REVERSED))score+=40;
   if(row&&column&&cell===modules[at-1]&&cell===modules[at-size]&&cell===modules[at-size-1])score+=3;
  }
  if(run>=5)score+=run-2;
 }
 // Down the columns: runs and finder-like sequences.
 for(let column=0;column<size;column++){
  let run=0,previous=2,window=0;
  for(let row=0,at=column;row<size;row++,at+=size){
   const cell=modules[at]!;
   if(cell===previous)run++;else{if(run>=5)score+=run-2;run=1;previous=cell;}
   window=(window<<1|cell)&0x7ff;
   if(row>=10&&(window===FINDER_LIKE||window===FINDER_LIKE_REVERSED))score+=40;
  }
  if(run>=5)score+=run-2;
 }
 const total=size*size;
 return score+10*Math.ceil(Math.max(0,Math.abs(dark*100-total*50)-total*5)/(total*5));
}
/** Why a value cannot be encoded: it is longer than a version 40 symbol (or the requested version) holds at the level. */
export class QRCapacityError extends RangeError {constructor(message:string){super(message);this.name='QRCapacityError';}}
/**
 * Encodes a string as a QR code symbol. Throws `QRCapacityError` when the value does not fit, and `RangeError` or `TypeError`
 * for an option outside its range. The same value and options always give the same modules.
 */
export function encodeQR(value:string,options:QREncodeOptions={}):QRMatrix{
 if(typeof value!=='string')throw new TypeError('QR value must be a string');
 const level=options.errorCorrection??'medium';
 if(!LEVELS.includes(level))throw new RangeError(`Unknown QR error correction: ${String(level)}`);
 const mode=options.mode??qrMode(value);
 if(!(mode in MODE_BITS))throw new RangeError(`Unknown QR mode: ${String(mode)}`);
 if(mode!=='byte'){const limit=mode==='numeric'?10:45;for(let i=0;i<value.length;i++){const v=alphanumericValue(value.charCodeAt(i));if(v<0||v>=limit)throw new RangeError(`QR ${mode} mode cannot hold ${JSON.stringify(value[i])}`);}}
 if(options.version!==undefined&&(!Number.isInteger(options.version)||options.version<1||options.version>40))throw new RangeError('QR version must be an integer from 1 to 40');
 if(options.mask!==undefined&&(!Number.isInteger(options.mask)||options.mask<0||options.mask>7))throw new RangeError('QR mask must be an integer from 0 to 7');
 const bytes=mode==='byte'?qrUtf8(value):null,length=bytes?bytes.length:value.length,payload=payloadBits(mode,length);
 const fits=(version:number)=>length<2**countBits(mode,version)&&4+countBits(mode,version)+payload<=layout(version,level).data*8;
 let version=options.version??1;
 if(options.version===undefined)while(version<=40&&!fits(version))version++;
 if(version>40||!fits(version))throw new QRCapacityError(`QR value of ${length} ${mode==='byte'?'bytes':'characters'} does not fit ${options.version===undefined?'a version 40 symbol':`version ${version}`} at ${level} error correction`);
 const size=17+4*version,{modules,reserved}=template(version),stream=codewords(value,bytes,mode,version,level);
 // Two-module columns from the right edge, alternately upward and downward, skipping the vertical timing column.
 const cells:number[]=[];
 for(let right=size-1,upward=true;right>=1;right-=2,upward=!upward){
  if(right===6)right=5;
  for(let i=0;i<size;i++){const row=upward?size-1-i:i;for(let j=0;j<2;j++){const at=row*size+right-j;if(!reserved[at])cells.push(at);}}
 }
 // Remainder bits past the last codeword stay light.
 for(let i=0;i<cells.length&&i<stream.length*8;i++)modules[cells[i]!]=stream[i>>>3]!>>>(7-(i&7))&1;
 const masked=(mask:number)=>{const out=modules.slice();for(const at of cells)if(qrMaskAt(mask,at%size,Math.floor(at/size)))out[at]=out[at]!^1;return out;};
 let mask=options.mask,best:Uint8Array|undefined;
 if(mask===undefined){let lowest=Infinity;mask=0;for(let candidate=0;candidate<8;candidate++){const trial=masked(candidate),score=qrPenalty(trial,size);if(score<lowest){lowest=score;mask=candidate;best=trial;}}}
 const result=best??masked(mask),format=qrFormatBits(level,mask);
 const set=(column:number,row:number,bit:number)=>{result[row*size+column]=bit;};
 for(let i=0;i<15;i++){
  const bit=format>>>i&1;
  if(i<6)set(8,i,bit);else if(i<8)set(8,i+1,bit);else if(i===8)set(7,8,bit);else set(14-i,8,bit);
  if(i<8)set(size-1-i,8,bit);else set(8,size-15+i,bit);
 }
 set(8,size-8,1);
 if(version>=7){const bits=qrVersionBits(version);for(let i=0;i<18;i++){const bit=bits>>>i&1,a=size-11+i%3,b=Math.floor(i/3);set(a,b,bit);set(b,a,bit);}}
 return {size,version,errorCorrection:level,mask,mode,modules:result};
}
/** The modules of a symbol as rows of booleans (`true` is dark), the shape other encoders return. */
export function qrRows(matrix:Pick<QRMatrix,'size'|'modules'>):boolean[][]{
 return Array.from({length:matrix.size},(_,row)=>Array.from({length:matrix.size},(_,column)=>matrix.modules[row*matrix.size+column]===1));
}
/** Modules a finder pattern spans on each side. */
export const QR_FINDER=7;
/** Quiet zone ISO/IEC 18004 asks for around a symbol, in modules. */
export const QR_QUIET_ZONE=4;
/** Radius of a data module's dot, in modules: Cuer's cell with its 10% inset, fully rounded. */
export const QR_DOT_RADIUS=0.4;
export interface QRGeometryOptions {
 /** Clears the centre square for an arena: an image or mark drawn over the code. */
 arena?:boolean;
}
/** A QR code's drawing in module units, measured from the symbol's top-left corner (the quiet zone is outside it). */
export interface QRGeometry {
 /** Modules per side. */
 size:number;
 /** One SVG path for the whole code: a round dot for every dark data module, then the three finder patterns, each a rounded ring around a rounded core. Fill it with the non-zero rule (the default). */
 path:string;
 /** Dots in `path`: the dark modules outside the finder patterns and the arena. */
 dots:number;
 /** Top-left module of each finder pattern: top left, top right, bottom left. */
 finders:readonly {x:number;y:number}[];
 /** The centre square cleared of modules, or `null` without an arena. `origin` is its first column and row and `size` its edge, in whole modules. */
 arena:{origin:number;size:number}|null;
}
/** Edge of the cleared centre square for a symbol: a quarter of the side, made odd so it is centred on the centre module. */
export function qrArenaSize(size:number):number{const quarter=Math.floor(size/4);return quarter%2===1?quarter:quarter+1;}
// A rounded square as one closed sub-path, clockwise or anticlockwise; a ring is a clockwise square around an anticlockwise one.
function roundedSquare(x:number,y:number,edge:number,radius:number,clockwise:boolean):string{
 const side=edge-2*radius,r=`${radius} ${radius}`;
 return clockwise
  ?`M${x+radius} ${y}h${side}a${r} 0 0 1 ${radius} ${radius}v${side}a${r} 0 0 1 ${-radius} ${radius}h${-side}a${r} 0 0 1 ${-radius} ${-radius}v${-side}a${r} 0 0 1 ${radius} ${-radius}z`
  :`M${x+radius} ${y}a${r} 0 0 0 ${-radius} ${radius}v${side}a${r} 0 0 0 ${radius} ${radius}h${side}a${r} 0 0 0 ${radius} ${-radius}v${-side}a${r} 0 0 0 ${-radius} ${-radius}z`;
}
/**
 * The Cuer look as one path: round dots for the data modules and rounded finder patterns, with the centre left clear when an
 * arena is drawn. The ring is Cuer's one-module stroke around a 6×6 square of radius 1.25, written as a filled outline (7×7,
 * radius 1.75) with a hole (5×5, radius 0.75); the core is 3×3 with radius 0.5.
 */
export function qrGeometry(matrix:Pick<QRMatrix,'size'|'modules'>,options:QRGeometryOptions={}):QRGeometry{
 const {size,modules}=matrix,far=size-QR_FINDER,cleared=options.arena?qrArenaSize(size):0,origin=(size-cleared)/2,diameter=QR_DOT_RADIUS*2;
 const arc=`a${QR_DOT_RADIUS} ${QR_DOT_RADIUS} 0 1 0 `;
 let path='',dots=0;
 for(let row=0;row<size;row++)for(let column=0;column<size;column++){
  if(!modules[row*size+column])continue;
  if((row<QR_FINDER&&(column<QR_FINDER||column>=far))||(row>=far&&column<QR_FINDER))continue;
  if(cleared&&row>=origin&&row<origin+cleared&&column>=origin&&column<origin+cleared)continue;
  // One circle as two half arcs. Tenths of a module are exact enough in a double to print without rounding noise.
  path+=`M${(column*10+1)/10} ${row+0.5}${arc}${diameter} 0${arc}${-diameter} 0`;dots++;
 }
 const finders=[{x:0,y:0},{x:far,y:0},{x:0,y:far}];
 for(const {x,y} of finders)path+=roundedSquare(x,y,7,1.75,true)+roundedSquare(x+1,y+1,5,0.75,false)+roundedSquare(x+2,y+2,3,0.5,true);
 return {size,path,dots,finders,arena:cleared?{origin,size:cleared}:null};
}
export interface QRCodeOptions {
 /** Error correction level. Omitted, `high` with an arena and `medium` without; under an arena `low` and `medium` are raised to `quartile`. */
 errorCorrection?:QRErrorCorrection;
 /** Clears the centre for an arena. */
 arena?:boolean;
}
/**
 * The error correction a code is drawn with. Without an arena it is the host's level, or `medium`. An arena covers the centre
 * of the code, so there the default is `high` and a host's `low` or `medium` is raised to `quartile`: with the centre covered,
 * `quartile` and `high` codes decoded in every case tested (tests/qr-model.test.ts), while some `medium` and most `low` ones did not.
 */
export function qrErrorCorrection(errorCorrection:QRErrorCorrection|undefined,arena:boolean):QRErrorCorrection{
 if(!arena)return errorCorrection??'medium';
 return errorCorrection===undefined?'high':errorCorrection==='low'||errorCorrection==='medium'?'quartile':errorCorrection;
}
/**
 * Encodes a value and lays it out, for a renderer: `null` when the value does not fit a QR code, so a component can draw
 * nothing instead of throwing while it renders.
 */
export function qrCodeGeometry(value:string,options:QRCodeOptions={}):QRGeometry|null{
 const arena=options.arena===true;
 try{return qrGeometry(encodeQR(value,{errorCorrection:qrErrorCorrection(options.errorCorrection,arena)}),{arena});}
 catch(error){if(error instanceof QRCapacityError)return null;throw error;}
}
/** Where a renderer draws a code inside a square of `edge` pixels with `quietZone` clear modules on every side. */
export interface QRFrame {
 /** Clear modules on every side, as drawn: never below zero. */
 quietZone:number;
 /** Modules across the square: the symbol and both quiet zones. */
 span:number;
 /** The SVG `viewBox`: module units with the symbol's top-left corner at the origin, so the path needs no transform. */
 viewBox:string;
 /** Pixels per module. */
 unit:number;
 /** Corner radius of the background tile, in modules: half the quiet zone, so a code without one has square corners. */
 tileRadius:number;
 /**
  * The arena's box, half a module inside the cleared square with a one-module corner radius; `null` without an arena.
  * `x`, `size` and `radius` are in modules from the symbol's corner (for a drawing inside the SVG); `left`, `edge` and
  * `corner` are the same box in pixels from the square's corner (for an overlay of fixed size); `inset` and `extent` are
  * its offset and edge as fractions of the square's edge (for an overlay that scales with the square).
  */
 arena:{x:number;size:number;radius:number;left:number;edge:number;corner:number;inset:number;extent:number}|null;
}
/** Lays a geometry out in a square: the view box, the module size and the arena's box. A `quietZone` below zero or not finite counts as zero. */
export function qrFrame(geometry:Pick<QRGeometry,'size'|'arena'>,edge:number,quietZone:number=QR_QUIET_ZONE):QRFrame{
 const quiet=Number.isFinite(quietZone)&&quietZone>0?quietZone:0,span=geometry.size+2*quiet,unit=edge/span,arena=geometry.arena;
 return {quietZone:quiet,span,viewBox:`${-quiet} ${-quiet} ${span} ${span}`,unit,tileRadius:quiet/2,arena:arena?{x:arena.origin+0.5,size:arena.size-1,radius:1,left:(quiet+arena.origin+0.5)*unit,edge:(arena.size-1)*unit,corner:unit,inset:(quiet+arena.origin+0.5)/span,extent:(arena.size-1)/span}:null};
}
