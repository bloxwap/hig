// HIG's QR encoder and drawing geometry (@bloxwap/hig/contracts/qr), checked against the specification's published
// constants, against the encoders installed in this workspace (Cuer's, and Kazuhiko Arase's where present), and by decoding.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {describe,expect,it} from 'vitest';
import {create as cuer} from 'cuer/QrCode';
import {QRCapacityError,QR_QUIET_ZONE,encodeQR,qrAlignmentCentres,qrArenaSize,qrCodeGeometry,qrErrorCorrection,qrErrorCorrectionCodewords,qrFormatBits,qrFrame,qrGeometry,qrMaskAt,qrMode,qrPenalty,qrRows,qrUtf8,qrVersionBits,type QRErrorCorrection,type QRMatrix} from '../packages/hig/contracts/src/qr';
const require=createRequire(import.meta.url);
// `qr` is Cuer's encoder, installed as its dependency: resolved from Cuer so the test does not lean on hoisting.
const fromCuer=createRequire(require.resolve('cuer/package.json'));
const {encodeQR:reference}=await import(pathToFileURL(fromCuer.resolve('qr')).href) as {encodeQR:(text:string,output:'raw',options:{ecc?:QRErrorCorrection;version?:number;mask?:number;encoding?:'numeric'|'alphanumeric'|'byte';border:number;scale:number})=>boolean[][]};
const {decodeQR}=await import(pathToFileURL(fromCuer.resolve('qr/decode.js')).href) as {decodeQR:(image:{width:number;height:number;data:Uint8Array})=>string};
/** The reference matrix without its one-module border (`qr` refuses a border of zero). */
const referenceRows=(value:string,options:{ecc?:QRErrorCorrection;version?:number;mask?:number;encoding?:'numeric'|'alphanumeric'|'byte'}={})=>reference(value,'raw',{...options,border:1,scale:1}).slice(1,-1).map(row=>row.slice(1,-1));
const levels:readonly QRErrorCorrection[]=['low','medium','quartile','high'];
const eth='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',sol='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
/** A deterministic generator, so a failure names a reproducible payload. */
function random(seed:number){let state=seed;return ()=>{state=(state*1103515245+12345)&0x7fffffff;return state/0x7fffffff;};}
const bits=(value:number,width:number)=>value.toString(2).padStart(width,'0');
/** An RGBA bitmap of a drawing, `scale` pixels a module with a quiet zone, dark on white. `dark(x, y)` is asked in module units at each pixel centre. */
function bitmap(size:number,scale:number,dark:(x:number,y:number)=>boolean){
 const quiet=QR_QUIET_ZONE,edge=(size+2*quiet)*scale,data=new Uint8Array(edge*edge*4).fill(255);
 for(let py=0;py<edge;py++)for(let px=0;px<edge;px++)if(dark((px+0.5)/scale-quiet,(py+0.5)/scale-quiet)){const at=(py*edge+px)*4;data[at]=data[at+1]=data[at+2]=0;}
 return {width:edge,height:edge,data};
}
const squares=(matrix:QRMatrix)=>bitmap(matrix.size,6,(x,y)=>x>=0&&y>=0&&x<matrix.size&&y<matrix.size&&matrix.modules[Math.floor(y)*matrix.size+Math.floor(x)]===1);
/** The Cuer drawing as pixels: the dots read back from the path, the finder patterns as a rounded ring and core. */
function dots(geometry:NonNullable<ReturnType<typeof qrCodeGeometry>>){
 const centres=[...geometry.path.matchAll(/M([\d.]+) ([\d.]+)a0\.4 0\.4 0 1 0 0\.8 0a0\.4 0\.4 0 1 0 -0\.8 0/g)].map(match=>[Number(match[1])+0.4,Number(match[2])] as const);
 expect(centres).toHaveLength(geometry.dots);
 const lit=new Map<number,(readonly [number,number])[]>();
 for(const centre of centres){const key=Math.floor(centre[1])*geometry.size+Math.floor(centre[0]);lit.set(key,[...(lit.get(key)??[]),centre]);}
 const rounded=(x:number,y:number,left:number,top:number,edge:number,radius:number)=>{const dx=Math.max(left+radius-x,0,x-(left+edge-radius)),dy=Math.max(top+radius-y,0,y-(top+edge-radius));return x>=left&&y>=top&&x<=left+edge&&y<=top+edge&&dx*dx+dy*dy<=radius*radius;};
 return bitmap(geometry.size,10,(x,y)=>{
  for(const finder of geometry.finders){if(rounded(x,y,finder.x+2,finder.y+2,3,0.5))return true;if(rounded(x,y,finder.x,finder.y,7,1.75))return !rounded(x,y,finder.x+1,finder.y+1,5,0.75);}
  return (lit.get(Math.floor(y)*geometry.size+Math.floor(x))??[]).some(([cx,cy])=>(x-cx)**2+(y-cy)**2<=0.16);
 });
}
describe('QR specification constants',()=>{
 it('writes the format information of ISO/IEC 18004 Annex C for every level and mask',()=>{
  // The published table: level bits, mask bits and BCH(15,5) remainder, masked with 101010000010010.
  const table:Record<QRErrorCorrection,string[]>={
   low:['111011111000100','111001011110011','111110110101010','111100010011101','110011000101111','110001100011000','110110001000001','110100101110110'],
   medium:['101010000010010','101000100100101','101111001111100','101101101001011','100010111111001','100000011001110','100111110010111','100101010100000'],
   quartile:['011010101011111','011000001101000','011111100110001','011101000000110','010010010110100','010000110000011','010111011011010','010101111101101'],
   high:['001011010001001','001001110111110','001110011100111','001100111010000','000011101100010','000001001010101','000110100001100','000100000111011'],
  };
  for(const level of levels)expect(Array.from({length:8},(_,mask)=>bits(qrFormatBits(level,mask),15)),level).toEqual(table[level]);
 });
 it('writes the version information of Annex D, and none of its words collide',()=>{
  expect(bits(qrVersionBits(7),18)).toBe('000111110010010100');expect(bits(qrVersionBits(8),18)).toBe('001000010110111100');
  expect(bits(qrVersionBits(21),18)).toBe('010101011010000011');expect(bits(qrVersionBits(40),18)).toBe('101000110001101001');
  expect(new Set(Array.from({length:34},(_,index)=>qrVersionBits(index+7))).size).toBe(34);
 });
 it('places the alignment patterns of Annex E',()=>{
  expect(qrAlignmentCentres(1)).toEqual([]);expect(qrAlignmentCentres(2)).toEqual([6,18]);expect(qrAlignmentCentres(7)).toEqual([6,22,38]);
  expect(qrAlignmentCentres(14)).toEqual([6,26,46,66]);expect(qrAlignmentCentres(32)).toEqual([6,34,60,86,112,138]);
  expect(qrAlignmentCentres(36)).toEqual([6,24,50,76,102,128,154]);expect(qrAlignmentCentres(40)).toEqual([6,30,58,86,114,142,170]);
 });
 it('computes Reed–Solomon codewords: the worked HELLO WORLD block at version 1-M',()=>{
  const data=Uint8Array.from([32,91,11,120,209,114,220,77,67,64,236,17,236,17,236,17]);
  expect([...qrErrorCorrectionCodewords(data,10)]).toEqual([196,35,39,119,235,215,231,226,93,23]);
 });
 it('applies the eight mask conditions of Table 10',()=>{
  const cells=(mask:number)=>Array.from({length:6},(_,row)=>Array.from({length:6},(_,column)=>qrMaskAt(mask,column,row)?'#':'.').join(''));
  expect(cells(0)).toEqual(['#.#.#.','.#.#.#','#.#.#.','.#.#.#','#.#.#.','.#.#.#']);
  expect(cells(1)).toEqual(['######','......','######','......','######','......']);
  expect(cells(2)).toEqual(['#..#..','#..#..','#..#..','#..#..','#..#..','#..#..']);
  expect(cells(3)).toEqual(['#..#..','..#..#','.#..#.','#..#..','..#..#','.#..#.']);
  expect(cells(4)).toEqual(['###...','###...','...###','...###','###...','###...']);
  expect(cells(5)).toEqual(['######','#.....','#..#..','#.#.#.','#..#..','#.....']);
  expect(cells(6)).toEqual(['######','###...','##.##.','#.#.#.','#.##.#','#...##']);
  expect(cells(7)).toEqual(['#.#.#.','...###','#...##','.#.#.#','###...','.###..']);
 });
 it('scores the penalty rules',()=>{
  // An empty version 1 symbol: 42 runs of 21 (19 each), 400 light 2×2 blocks (3 each) and no dark modules (nine 5% steps from half).
  expect(qrPenalty(new Uint8Array(441),21)).toBe(42*19+400*3+90);
  // 1011101 at the start of row 0, followed by light modules: 40 for the finder-like run; the row's run of 21 becomes one of 14
  // (−7), five columns' runs lose a module (−5) and seven 2×2 blocks are no longer one colour (−21).
  const row=new Uint8Array(441);for(const column of [0,2,3,4,6])row[column]=1;
  expect(qrPenalty(row,21)-qrPenalty(new Uint8Array(441),21)).toBe(40-7-5-21);
 });
});
describe('QR payload packing',()=>{
 it('picks the densest mode the whole value fits',()=>{
  expect(qrMode('0123456789')).toBe('numeric');expect(qrMode('HELLO WORLD')).toBe('alphanumeric');expect(qrMode('HTTPS://BLOXWAP.COM/A-B')).toBe('alphanumeric');
  expect(qrMode('hello')).toBe('byte');expect(qrMode(eth)).toBe('byte');expect(qrMode('')).toBe('numeric');expect(qrMode('€')).toBe('byte');
 });
 it('writes UTF-8 as TextEncoder does, including astral characters and unpaired surrogates',()=>{
  for(const text of ['','ascii','é ü ñ','日本語','🚀 emoji','mixed ك عربى 語','\ud83d alone','tail \udc00','\ud83d🚀'])expect([...qrUtf8(text)],JSON.stringify(text)).toEqual([...new TextEncoder().encode(text)]);
 });
 it('sizes the symbol: 21 modules at version 1, four more a version, up to 177',()=>{
  expect(encodeQR('1').size).toBe(21);expect(encodeQR('1',{version:2}).size).toBe(25);expect(encodeQR('1',{version:40}).size).toBe(177);
  const matrix=encodeQR(eth);expect(matrix).toMatchObject({version:3,size:29,errorCorrection:'medium',mode:'byte'});expect(matrix.modules).toHaveLength(29*29);
  expect(encodeQR(eth,{errorCorrection:'high'}).version).toBe(5);
 });
 it('holds exactly the published capacities and refuses one more character',()=>{
  // Table 7: version 40 holds 7089 digits, 4296 alphanumerics or 2953 bytes at L, and 1273 bytes at H; version 1-H holds 7 bytes.
  expect(encodeQR('7'.repeat(7089),{errorCorrection:'low'}).version).toBe(40);expect(()=>encodeQR('7'.repeat(7090),{errorCorrection:'low'})).toThrow(QRCapacityError);
  expect(encodeQR('A'.repeat(4296),{errorCorrection:'low'}).version).toBe(40);expect(()=>encodeQR('A'.repeat(4297),{errorCorrection:'low'})).toThrow(QRCapacityError);
  expect(encodeQR('a'.repeat(2953),{errorCorrection:'low'}).version).toBe(40);expect(()=>encodeQR('a'.repeat(2954),{errorCorrection:'low'})).toThrow(QRCapacityError);
  expect(encodeQR('a'.repeat(1273),{errorCorrection:'high'}).version).toBe(40);expect(()=>encodeQR('a'.repeat(1274),{errorCorrection:'high'})).toThrow(QRCapacityError);
  expect(encodeQR('a'.repeat(7),{errorCorrection:'high'}).version).toBe(1);expect(encodeQR('a'.repeat(8),{errorCorrection:'high'}).version).toBe(2);
  expect(()=>encodeQR('a'.repeat(8),{errorCorrection:'high',version:1})).toThrow(/does not fit version 1 at high/);
 });
 it('rejects options outside their range',()=>{
  expect(()=>encodeQR('1',{version:0})).toThrow(RangeError);expect(()=>encodeQR('1',{version:41})).toThrow(RangeError);expect(()=>encodeQR('1',{version:1.5})).toThrow(RangeError);
  expect(()=>encodeQR('1',{mask:8})).toThrow(RangeError);expect(()=>encodeQR('1',{mask:-1})).toThrow(RangeError);
  expect(()=>encodeQR('abc',{mode:'numeric'})).toThrow(/numeric mode cannot hold "a"/);expect(()=>encodeQR('abc',{mode:'alphanumeric'})).toThrow(RangeError);
  expect(()=>encodeQR('1',{errorCorrection:'max' as QRErrorCorrection})).toThrow(RangeError);expect(()=>encodeQR(1 as unknown as string)).toThrow(TypeError);
 });
 it('gives the same modules for the same value and options',()=>{
  expect([...encodeQR(sol,{errorCorrection:'high'}).modules]).toEqual([...encodeQR(sol,{errorCorrection:'high'}).modules]);
  expect([...encodeQR(sol).modules]).not.toEqual([...encodeQR(`${sol}1`).modules]);
 });
});
describe('QR matrix against the installed encoders',()=>{
 it('matches Cuer module for module: addresses, payment URIs, links, digits, upper case and UTF-8 at every level',()=>{
  const payloads=['',' ','1','A','a',eth,sol,`ethereum:${eth}@8453`,`solana:${sol}?amount=1&label=Bloxwap`,'https://bloxwap.com/invite/9e0fD0622874','HTTPS://BLOXWAP.COM/INVITE','0123456789012345678901234567890123456789','HELLO WORLD','bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.001','Zażółć gęślą jaźń','日本語のテキスト','🚀🚀🚀 to the moon','WIFI:T:WPA;S:hig;P:"p4ss;word";;','x'.repeat(300),'9'.repeat(700)];
  for(const value of payloads)for(const errorCorrection of levels){
   const matrix=encodeQR(value,{errorCorrection}),theirs=cuer(value,{errorCorrection});
   expect(matrix.size,`${JSON.stringify(value.slice(0,24))} ${errorCorrection}`).toBe(theirs.edgeLength);
   expect(qrRows(matrix),`${JSON.stringify(value.slice(0,24))} ${errorCorrection}`).toEqual(theirs.grid);
  }
 });
 it('matches Cuer for 600 generated payloads of every mode and many lengths, choosing the same version and mask',()=>{
  const next=random(20261116);
  const alphabets=['0123456789','0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:','abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:/?&=._-','héllo wörld ✓ 日本語 🚀 ك'].map(text=>[...text]);
  const seen={versions:new Set<number>(),masks:new Set<number>(),modes:new Set<string>()};
  for(let index=0;index<600;index++){
   const alphabet=alphabets[index%4]!,length=Math.floor(next()*next()*(index%9===0?1200:180));
   let value='';for(let k=0;k<length;k++)value+=alphabet[Math.floor(next()*alphabet.length)];
   const errorCorrection=levels[Math.floor(index/4)%4]!;
   const matrix=encodeQR(value,{errorCorrection});seen.versions.add(matrix.version);seen.masks.add(matrix.mask);seen.modes.add(matrix.mode);
   expect(qrRows(matrix),`payload ${index} (${length} characters, ${errorCorrection})`).toEqual(cuer(value,{errorCorrection}).grid);
  }
  expect([...seen.masks].sort()).toEqual([0,1,2,3,4,5,6,7]);expect([...seen.modes].sort()).toEqual(['alphanumeric','byte','numeric']);expect(seen.versions.size).toBeGreaterThan(20);
 });
 it('matches the reference at every version from 1 to 40 and every level: function patterns, block layout and version words',()=>{
  for(let version=1;version<=40;version++)for(const errorCorrection of levels){
   const value=`v${version}`;
   expect(qrRows(encodeQR(value,{version,errorCorrection})),`version ${version} ${errorCorrection}`).toEqual(referenceRows(value,{version,ecc:errorCorrection}));
  }
 });
 it('matches the reference at every version filled to capacity, where every block carries data',()=>{
  const next=random(7);
  for(let version=1;version<=40;version+=3)for(const errorCorrection of levels){
   // The longest byte payload the version holds at this level: found by bisection on the encoder, then checked against the reference.
   const fits=(bytes:number)=>{try{encodeQR('a'.repeat(bytes),{version,errorCorrection,mode:'byte',mask:0});return true;}catch{return false;}};
   let length=1,over=3000;while(over-length>1){const middle=(length+over)>>1;if(fits(middle))length=middle;else over=middle;}
   let value='';for(let k=0;k<length;k++)value+=String.fromCharCode(33+Math.floor(next()*90));
   expect(qrRows(encodeQR(value,{version,errorCorrection,mode:'byte'})),`version ${version} ${errorCorrection} at ${length} bytes`).toEqual(referenceRows(value,{version,ecc:errorCorrection,encoding:'byte'}));
  }
 });
 it('matches the reference for each forced mask and each forced mode',()=>{
  for(let mask=0;mask<8;mask++)for(const errorCorrection of levels)expect(qrRows(encodeQR(eth,{mask,errorCorrection})),`mask ${mask} ${errorCorrection}`).toEqual(referenceRows(eth,{mask,ecc:errorCorrection}));
  for(const mode of ['numeric','alphanumeric','byte'] as const)expect(qrRows(encodeQR('20261116',{mode})),mode).toEqual(referenceRows('20261116',{encoding:mode}));
 });
 it('refuses the values the reference refuses',()=>{
  for(const [value,errorCorrection] of [['a'.repeat(2954),'low'],['a'.repeat(1274),'high'],['7'.repeat(7090),'low'],['é'.repeat(1500),'low']] as const){
   expect(()=>encodeQR(value,{errorCorrection})).toThrow(QRCapacityError);expect(()=>cuer(value,{errorCorrection})).toThrow();
  }
 });
 // Kazuhiko Arase's encoder ships inside qrcode-terminal, which Expo's CLI installs: a second, unrelated implementation.
 const arase=(()=>{try{return {QRCode:require('qrcode-terminal/vendor/QRCode') as new(version:number,level:number)=>{addData(value:string):void;makeImpl(test:boolean,mask:number):void;modules:(boolean|null)[][]},level:require('qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel') as Record<'L'|'M'|'Q'|'H',number>};}catch{return null;}})();
 it.skipIf(!arase)('matches Kazuhiko Arase’s encoder for byte payloads at every mask',()=>{
  const names={low:'L',medium:'M',quartile:'Q',high:'H'} as const;
  for(const value of [eth,sol,`solana:${sol}?amount=1`,'https://bloxwap.com/a?b=c&d=e','hig'])for(const errorCorrection of levels){
   const version=encodeQR(value,{errorCorrection,mode:'byte'}).version;
   for(let mask=0;mask<8;mask++){
    const theirs=new arase!.QRCode(version,arase!.level[names[errorCorrection]]);theirs.addData(value);theirs.makeImpl(false,mask);
    expect(qrRows(encodeQR(value,{errorCorrection,mode:'byte',version,mask})),`${value} ${errorCorrection} mask ${mask}`).toEqual(theirs.modules.map(row=>row.map(Boolean)));
   }
  }
 });
});
describe('QR codes read back',()=>{
 it('decodes as square modules: every mode, level and a range of versions',()=>{
  for(const value of [eth,sol,`ethereum:${eth}@8453`,'0123456789','HELLO WORLD','Zażółć 日本語 🚀','x'.repeat(400)])for(const errorCorrection of levels)expect(decodeQR(squares(encodeQR(value,{errorCorrection}))),`${value.slice(0,24)} ${errorCorrection}`).toBe(value);
  for(const version of [1,2,6,7,10,14,20,27])expect(decodeQR(squares(encodeQR('hig',{version}))),`version ${version}`).toBe('hig');
 });
 it('decodes as drawn, in round dots with rounded finder patterns',()=>{
  for(const value of [eth,sol,`solana:${sol}?amount=1`,'https://bloxwap.com/invite/9e0fD0622874'])expect(decodeQR(dots(qrCodeGeometry(value)!)),value).toBe(value);
 });
 it('decodes with the centre cleared for an arena at high error correction, for the payloads a wallet shows',()=>{
  const payloads=[eth,sol,`ethereum:${eth}@8453`,`solana:${sol}?amount=1&label=Bloxwap`,'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq','https://bloxwap.com/invite/9e0fD0622874ca1cBf79DA087BaF4622Faf77688','0x1','hig'];
  for(const value of payloads){const geometry=qrCodeGeometry(value,{arena:true})!;expect(geometry.arena,value).not.toBeNull();expect(decodeQR(dots(geometry)),value).toBe(value);}
  const next=random(99);
  for(let index=0;index<40;index++){let value='';const length=1+Math.floor(next()*120);for(let k=0;k<length;k++)value+=String.fromCharCode(33+Math.floor(next()*90));expect(decodeQR(dots(qrCodeGeometry(value,{arena:true})!)),`generated ${index}: ${value}`).toBe(value);}
 });
});
describe('QR drawing geometry',()=>{
 const matrix=encodeQR(eth),geometry=qrGeometry(matrix);
 it('draws every dark data module as one round dot and leaves the finder modules to the finder patterns',()=>{
  const finder=(row:number,column:number)=>(row<7&&(column<7||column>=22))||(row>=22&&column<7);
  let dark=0;for(let row=0;row<29;row++)for(let column=0;column<29;column++)if(matrix.modules[row*29+column]&&!finder(row,column))dark++;
  expect(geometry.size).toBe(29);expect(geometry.dots).toBe(dark);expect(geometry.arena).toBeNull();
  expect(geometry.path.match(/a0\.4 0\.4 0 1 0 0\.8 0a0\.4 0\.4 0 1 0 -0\.8 0/g)).toHaveLength(dark);
  // The first dark module outside a finder in row 0 is drawn 0.1 in from its cell's edge, on the cell's centre line.
  const first=Array.from({length:29},(_,column)=>column).find(column=>column>=7&&matrix.modules[column]===1)!;
  expect(geometry.path.startsWith(`M${first}.1 0.5a0.4 0.4 0 1 0 0.8 0a0.4 0.4 0 1 0 -0.8 0`)).toBe(true);
  // No number carries rounding noise.
  expect(geometry.path).not.toMatch(/\d\.\d{3,}/);
 });
 it('draws three finder patterns: a ring as an outline with a hole, around a core',()=>{
  expect(geometry.finders).toEqual([{x:0,y:0},{x:22,y:0},{x:0,y:22}]);
  const shapes=geometry.path.slice(geometry.path.lastIndexOf('0 -0.8 0')+8).split('z').filter(Boolean);expect(shapes).toHaveLength(9);
  // Top left: the outline clockwise from (1.75, 0), the hole anticlockwise from (1.75, 1), the core clockwise from (2.5, 2).
  expect(shapes[0]).toBe('M1.75 0h3.5a1.75 1.75 0 0 1 1.75 1.75v3.5a1.75 1.75 0 0 1 -1.75 1.75h-3.5a1.75 1.75 0 0 1 -1.75 -1.75v-3.5a1.75 1.75 0 0 1 1.75 -1.75');
  expect(shapes[1]).toBe('M1.75 1a0.75 0.75 0 0 0 -0.75 0.75v3.5a0.75 0.75 0 0 0 0.75 0.75h3.5a0.75 0.75 0 0 0 0.75 -0.75v-3.5a0.75 0.75 0 0 0 -0.75 -0.75');
  expect(shapes[2]).toBe('M2.5 2h2a0.5 0.5 0 0 1 0.5 0.5v2a0.5 0.5 0 0 1 -0.5 0.5h-2a0.5 0.5 0 0 1 -0.5 -0.5v-2a0.5 0.5 0 0 1 0.5 -0.5');
  expect(shapes[3]!.startsWith('M23.75 0h3.5')).toBe(true);expect(shapes[6]!.startsWith('M1.75 22h3.5')).toBe(true);
 });
 it('clears an odd, centred square for an arena and draws no dot inside it',()=>{
  expect([21,25,29,33,37,41,45,177].map(qrArenaSize)).toEqual([5,7,7,9,9,11,11,45]);
  const cleared=qrGeometry(matrix,{arena:true});expect(cleared.arena).toEqual({origin:11,size:7});
  let inside=0;for(let row=11;row<18;row++)for(let column=11;column<18;column++)if(matrix.modules[row*29+column])inside++;
  expect(inside).toBeGreaterThan(0);expect(cleared.dots).toBe(geometry.dots-inside);
  for(const match of cleared.path.matchAll(/M([\d.]+) ([\d.]+)a0\.4/g)){const column=Math.floor(Number(match[1])),row=Math.floor(Number(match[2]));expect(column>=11&&column<18&&row>=11&&row<18,`${column},${row}`).toBe(false);}
 });
 it('uses high error correction under an arena unless the host names a level',()=>{
  expect(qrErrorCorrection(undefined,false)).toBe('medium');expect(qrErrorCorrection(undefined,true)).toBe('high');expect(qrErrorCorrection('quartile',true)).toBe('quartile');expect(qrErrorCorrection('low',false)).toBe('low');
  expect(qrCodeGeometry(eth)!.size).toBe(29);expect(qrCodeGeometry(eth,{arena:true})!.size).toBe(37);expect(qrCodeGeometry(eth,{arena:true,errorCorrection:'medium'})!.size).toBe(29);
  expect(qrCodeGeometry(eth,{errorCorrection:'high'})!.path).toBe(qrGeometry(encodeQR(eth,{errorCorrection:'high'})).path);
 });
 it('returns null for a value no QR code holds, and still throws for a programming error',()=>{
  expect(qrCodeGeometry('a'.repeat(3000))).toBeNull();expect(qrCodeGeometry('a'.repeat(1274),{arena:true})).toBeNull();
  expect(()=>qrCodeGeometry(undefined as unknown as string)).toThrow(TypeError);
 });
 it('lays the code out in a square: quiet zone, module size, tile radius and the arena box in modules and pixels',()=>{
  expect(qrFrame(geometry,196)).toEqual({quietZone:4,span:37,viewBox:'-4 -4 37 37',unit:196/37,tileRadius:2,arena:null});
  expect(qrFrame(geometry,290,0)).toEqual({quietZone:0,span:29,viewBox:'0 0 29 29',unit:10,tileRadius:0,arena:null});
  expect(qrFrame(geometry,290,-3).viewBox).toBe('0 0 29 29');expect(qrFrame(geometry,290,Number.NaN).span).toBe(29);
  const cleared=qrGeometry(matrix,{arena:true});
  // Half a module inside the cleared 7×7: a 6-module box from 11.5, centred on the symbol's centre at 14.5.
  expect(qrFrame(cleared,290,0).arena).toEqual({x:11.5,size:6,radius:1,left:115,edge:60,corner:10});
  const padded=qrFrame(cleared,370,4).arena!;expect(padded).toMatchObject({x:11.5,size:6,left:155,edge:60,corner:10});
  // The box is centred in the square whatever the quiet zone, so mirroring the layout cannot move it.
  expect(padded.left+padded.edge/2).toBe(185);
 });
});
