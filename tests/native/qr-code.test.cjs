/**
 * Native QRCode: HIG's own encoder drawn as one react-native-svg path, with the tile, the arena and the accessible name.
 * The shared module is the real one; its encoding step is wrapped so the tests can count how often a render encodes.
 */
jest.mock('@bloxwap/hig/contracts/qr',()=>{const actual=jest.requireActual('@bloxwap/hig/contracts/qr');return {...actual,qrCodeGeometry:jest.fn(actual.qrCodeGeometry)};});
const React=require('react');
const {readFileSync}=require('node:fs');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,Image,View}=require('react-native');
const {default:Svg,Path,Rect}=require('react-native-svg');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const qr=require('@bloxwap/hig/contracts/qr');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {QRCode}=require('../../packages/hig/native/src/qr-code');
const core=require('../../packages/hig/native/src/wallet-address-core');
const h=React.createElement;
const ethereum='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688';
const solana='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
const geometry=jest.requireActual('@bloxwap/hig/contracts/qr').qrCodeGeometry;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
beforeEach(()=>{qr.qrCodeGeometry.mockClear();});
afterEach(()=>{if(root){act(()=>root.unmount());root=undefined;}});
it('draws the whole code as one path on a tile, as one image named QR code',()=>{
 const tree=mount(h(QRCode,{value:ethereum,testID:'qr'}));
 const box=host(tree,'qr');
 expect(box.props.accessible).toBe(true);expect(box.props.accessibilityRole).toBe('image');expect(box.props.accessibilityLabel).toBe('QR code');
 expect(flat(box)).toMatchObject({width:196,height:196});
 const svg=tree.findByType(Svg);
 // Version 3 (29 modules) at medium error correction, inside the four-module quiet zone.
 expect(svg.props).toMatchObject({width:196,height:196,viewBox:'-4 -4 37 37',accessible:false,testID:'qr-code'});
 const paths=tree.findAllByType(Path);expect(paths).toHaveLength(1);
 expect(paths[0].props.d).toBe(geometry(ethereum).path);expect(paths[0].props.fill).toBe(colors.text);
 const tiles=tree.findAllByType(Rect);expect(tiles).toHaveLength(1);
 expect(tiles[0].props).toMatchObject({x:-4,y:-4,width:37,height:37,rx:2,fill:colors.background});
 // Nothing else is drawn: no element per module, no image.
 expect(React.Children.toArray(svg.props.children)).toHaveLength(2);expect(tree.findAllByType(Image)).toHaveLength(0);
});
it('takes the size, the colours and the quiet zone from the host',()=>{
 let tree=mount(h(QRCode,{value:ethereum,size:120,color:'black',background:'white',quietZone:2,style:{margin:4}}));
 expect(tree.findByType(Svg).props).toMatchObject({width:120,height:120,viewBox:'-2 -2 33 33'});
 expect(tree.findByType(Path).props.fill).toBe('black');expect(tree.findByType(Rect).props).toMatchObject({fill:'white',rx:1});
 expect(flat(tree.findAllByType(View)[0])).toMatchObject({width:120,height:120,margin:4});
 // No tile and no quiet zone, for a host surface that keeps the margin itself.
 for(const background of ['none','transparent']){
  tree=mount(h(QRCode,{value:ethereum,background,quietZone:0}));
  expect(tree.findAllByType(Rect)).toHaveLength(0);expect(tree.findByType(Svg).props.viewBox).toBe('0 0 29 29');
 }
});
it('paints from the provider roles, so the code follows the provider’s colour table',()=>{
 const source=readFileSync('packages/hig/native/src/qr-code.tsx','utf8');
 expect(source).toMatch(/color\?\?colors\.text/);expect(source).toMatch(/background\?\?colors\.background/);expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
 // One encoder for both platforms: the entry's only imports are React, React Native, react-native-svg and HIG.
 expect([...source.matchAll(/from '([^']+)'/g)].map(match=>match[1]).sort()).toEqual(['./provider.js','@bloxwap/hig/contracts/qr','@bloxwap/hig/contracts/qr','react','react-native','react-native-svg']);
});
it('uses high error correction and clears the centre under an arena image, centred in the square',()=>{
 let tree=mount(h(QRCode,{value:ethereum,arena:'https://example.test/eth.png',size:370,quietZone:0,testID:'qr'}));
 expect(qr.qrCodeGeometry).toHaveBeenLastCalledWith(ethereum,{errorCorrection:undefined,arena:true});
 // High error correction needs version 5 (37 modules): 10dp a module here.
 expect(tree.findByType(Svg).props.viewBox).toBe('0 0 37 37');expect(tree.findByType(Path).props.d).toBe(geometry(ethereum,{arena:true}).path);
 const image=host(tree,'qr-arena');
 expect(image.props.source).toEqual({uri:'https://example.test/eth.png'});
 // The cleared square is 9 modules; the image is 8, with one module of corner radius.
 expect(flat(image)).toEqual({width:80,height:80,borderRadius:10});
 // Centred, not offset from one edge, so a right-to-left layout cannot move it off the cleared square.
 const layer=tree.findAll(node=>node.type==='View'&&node.props.pointerEvents==='none')[0];
 expect(flat(layer)).toEqual({position:'absolute',top:0,right:0,bottom:0,left:0,alignItems:'center',justifyContent:'center'});
 expect(layer.props.importantForAccessibility).toBe('no-hide-descendants');
 expect(tree.findAllByType(Path)).toHaveLength(1);
 // The host's level wins when it names one; without an arena nothing is cleared.
 tree=mount(h(QRCode,{value:ethereum,arena:'https://example.test/eth.png',errorCorrection:'quartile',quietZone:0}));expect(tree.findByType(Svg).props.viewBox).toBe('0 0 33 33');
 tree=mount(h(QRCode,{value:ethereum,arena:'',quietZone:0}));expect(tree.findByType(Svg).props.viewBox).toBe('0 0 29 29');expect(tree.findAllByType(Image)).toHaveLength(0);
});
it('lays a host node out in the arena box',()=>{
 const tree=mount(h(QRCode,{value:solana,size:370,quietZone:0,testID:'qr',arena:h(View,{testID:'mark'})}));
 const arena=host(tree,'qr-arena');
 expect(flat(arena)).toEqual({overflow:'hidden',alignItems:'center',justifyContent:'center',width:80,height:80,borderRadius:10});
 expect(arena.findAll(node=>node.props.testID==='mark').length).toBeGreaterThan(0);expect(tree.findAllByType(Image)).toHaveLength(0);
});
it('is named by the host, by the provider, or hidden when the host names it elsewhere',()=>{
 let tree=mount(h(QRCode,{value:ethereum,testID:'qr'}),{messages:{qrCode:'Code QR'}});expect(host(tree,'qr').props.accessibilityLabel).toBe('Code QR');
 tree=mount(h(QRCode,{value:ethereum,testID:'qr',label:'Deposit address'}),{messages:{qrCode:'Code QR'}});expect(host(tree,'qr').props.accessibilityLabel).toBe('Deposit address');
 tree=mount(h(QRCode,{value:ethereum,testID:'qr',decorative:true}));
 const box=host(tree,'qr');
 expect(box.props.accessible).toBe(false);expect(box.props.accessibilityElementsHidden).toBe(true);expect(box.props.importantForAccessibility).toBe('no-hide-descendants');
 expect(box.props.accessibilityRole).toBeUndefined();expect(box.props.accessibilityLabel).toBeUndefined();
});
it('draws the same path as the web renderer in a right-to-left provider',()=>{
 const tree=mount(h(QRCode,{value:ethereum}),{direction:'rtl'});
 expect(tree.findByType(Path).props.d).toBe(geometry(ethereum).path);expect(tree.findByType(Svg).props.viewBox).toBe('-4 -4 37 37');
});
it('encodes once per value and options: a new size, colour, quiet zone or parent render recomputes nothing',()=>{
 const Host=({size,tick})=>h(View,{testID:`tick-${tick}`},h(QRCode,{value:ethereum,size,color:tick?'red':undefined,quietZone:tick?1:undefined}));
 act(()=>{root=render(h(HIGProvider,{reducedMotion:true},h(Host,{size:196,tick:0})));});
 expect(qr.qrCodeGeometry).toHaveBeenCalledTimes(1);expect(qr.qrCodeGeometry).toHaveBeenLastCalledWith(ethereum,{errorCorrection:undefined,arena:false});
 const first=root.root.findByType(Path).props.d;
 for(const [size,tick] of [[196,0],[300,1],[64,2]])act(()=>{root.update(h(HIGProvider,{reducedMotion:true},h(Host,{size,tick})));});
 expect(qr.qrCodeGeometry).toHaveBeenCalledTimes(1);expect(root.root.findByType(Path).props.d).toBe(first);
 expect(root.root.findByType(Svg).props).toMatchObject({width:64,viewBox:'-1 -1 31 31'});
 act(()=>{root.update(h(HIGProvider,{reducedMotion:true},h(QRCode,{value:solana,size:64})));});
 expect(qr.qrCodeGeometry).toHaveBeenCalledTimes(2);expect(root.root.findByType(Path).props.d).not.toBe(first);
});
it('draws an empty, unnamed square for a value no QR code can hold',()=>{
 const tree=mount(h(QRCode,{value:'a'.repeat(3000),size:100,testID:'qr'}));
 const box=host(tree,'qr');
 expect(flat(box)).toMatchObject({width:100,height:100});expect(box.props.accessible).toBe(false);expect(box.props.accessibilityLabel).toBeUndefined();
 expect(tree.findAllByType(Path)).toHaveLength(0);expect(tree.findAllByType(Rect)).toHaveLength(0);
});
it('is the code of WalletAddress from wallet-address-core: hidden itself, named once by the address',()=>{
 const tree=mount(h(core.WalletAddress,{address:ethereum,size:140,qr:h(QRCode,{value:ethereum,size:140,quietZone:0,background:'none',decorative:true,testID:'qr'})}));
 const named=tree.findAll(node=>typeof node.type==='string'&&node.props.accessibilityRole==='image');
 expect(named).toHaveLength(1);expect(named[0].props.testID).toBe('wallet-address-qr');expect(named[0].props.accessibilityLabel).toBe('QR code');
 expect(host(tree,'qr').props.accessible).toBe(false);expect(tree.findByType(Svg).props).toMatchObject({width:140,viewBox:'0 0 29 29'});
 expect(tree.findAllByType(Rect)).toHaveLength(0);expect(tree.findByType(Path).props.d).toBe(geometry(ethereum).path);
 // 140dp code, 7 rows: 20dp each.
 expect(flat(host(tree,'wallet-address-column')).lineHeight).toBe(20);
});
