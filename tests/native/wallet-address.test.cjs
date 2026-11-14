/**
 * Native wallet address components: the vertical address column and the cuer-style QR beside it.
 * The encoder (`cuer/QrCode`, ESM) is replaced by a fixed grid so the drawing can be asserted module by module.
 */
const size=21;
// 21×21 (version 1): finder squares in three corners, then a few data modules, one of them in the centre.
const grid=Array.from({length:size},(_,row)=>Array.from({length:size},(_,column)=>{
 const finder=(row<7&&(column<7||column>=size-7))||(row>=size-7&&column<7);
 return finder||(row===10&&column===10)||(row===8&&column===8)||(row===12&&column===15)||(row===20&&column===20);
}));
const create=jest.fn(()=>({grid,edgeLength:size,finderLength:7}));
jest.mock('cuer/QrCode',()=>({create:(...args)=>create(...args)}));
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,Image}=require('react-native');
const {Path,Rect}=require('react-native-svg');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {VerticalAddress,addressKind,addressRows}=require('../../packages/hig/native/src/data');
const {WalletAddress,qrGeometry}=require('../../packages/hig/native/src/wallet-address');
const h=React.createElement;
const ethereum='0x9e0fD0622874ca1ccBf79DA087BaF4622Faf7768';
const solana='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const cells=tree=>tree.findAll(node=>node.type==='Text'&&typeof node.props.children==='string'&&node.props.children.length===1);
beforeEach(()=>{jest.useFakeTimers();create.mockClear();});
afterEach(()=>{if(root){act(()=>root.unmount());root=undefined;}jest.useRealTimers();});
it('tells Ethereum from Solana by the 0x prefix',()=>{
 expect(addressKind(ethereum)).toBe('ethereum');expect(addressKind(solana)).toBe('solana');expect(addressKind('')).toBe('solana');
});
it('splits an Ethereum address into 7 rows of 6 and emphasises the first 6 and last 4 characters',()=>{
 const rows=addressRows(ethereum);expect(rows).toHaveLength(7);expect(rows.every(row=>row.length===6)).toBe(true);
 expect(rows.map(row=>row.map(cell=>cell.character).join('')).join('')).toBe(ethereum);
 const anchors=rows.flat().map(cell=>cell.anchor);expect(anchors.filter(Boolean)).toHaveLength(10);
 expect(anchors.slice(0,6).every(Boolean)).toBe(true);expect(anchors.slice(6,38).some(Boolean)).toBe(false);expect(anchors.slice(38).every(Boolean)).toBe(true);
});
it('splits a Solana address into 11 rows of 4 and emphasises the first 4 and last 4 characters',()=>{
 const rows=addressRows(solana);expect(rows).toHaveLength(11);expect(rows.every(row=>row.length===4)).toBe(true);
 const anchors=rows.flat().map(cell=>cell.anchor);expect(anchors.filter(Boolean)).toHaveLength(8);
 expect(anchors.slice(0,4).every(Boolean)).toBe(true);expect(anchors.slice(4,40).some(Boolean)).toBe(false);expect(anchors.slice(40).every(Boolean)).toBe(true);
 // An explicit kind overrides the prefix.
 expect(addressRows(solana,'ethereum')[0]).toHaveLength(6);
});
it('draws the column as one selectable, left-to-right text named by the whole address, sized by the row height',()=>{
 let tree=mount(h(VerticalAddress,{address:ethereum,rowHeight:28,testID:'column'}),{direction:'rtl',monoFontFamily:'BloxwapMonoRegular'});
 const column=host(tree,'column');
 expect(column.props.accessibilityLabel).toBe(ethereum);expect(column.props.selectable).toBe(true);
 expect(flat(column)).toMatchObject({fontFamily:'BloxwapMonoRegular',lineHeight:28,fontSize:25.5,writingDirection:'ltr',textAlign:'left'});
 expect(text(column).split('\n')).toEqual(['0x9e0f','D06228','74ca1c','cBf79D','A087Ba','F4622F','af7768']);
 const drawn=cells(tree);expect(drawn).toHaveLength(42);
 expect(flat(drawn[0])).toMatchObject({color:colors.text,fontWeight:'600'});expect(flat(drawn[6])).toMatchObject({color:colors.muted,fontWeight:'500'});expect(flat(drawn[41])).toMatchObject({color:colors.text,fontWeight:'600'});
 tree=mount(h(VerticalAddress,{address:solana,testID:'column'}));
 expect(flat(host(tree,'column'))).toMatchObject({lineHeight:22,fontSize:20});expect(text(host(tree,'column')).split('\n')).toHaveLength(11);
});
it('maps the encoder grid to three finders and one path of dots, clearing the centre for an arena',()=>{
 const plain=qrGeometry(grid,false);
 expect(plain.edge).toBe(21);expect(plain.finders).toEqual([{x:0,y:0},{x:14,y:0},{x:0,y:14}]);expect(plain.arena).toBeNull();
 // Four data modules; the finder modules are drawn as rounded squares instead.
 expect(plain.count).toBe(4);expect(plain.dots.match(/M/g)).toHaveLength(4);expect(plain.dots.startsWith('M8.05 8.5a0.45 0.45 0 1 0 0.9 0')).toBe(true);
 const cleared=qrGeometry(grid,true);
 expect(cleared.arena).toEqual({origin:8,size:5});expect(cleared.count).toBe(2);expect(cleared.dots).not.toContain('M10.05 10.5');
});
it('renders the QR as a named image in the text colour beside a column exactly as tall as the code',()=>{
 const tree=mount(h(WalletAddress,{address:ethereum,testID:'wallet'}));
 expect(create).toHaveBeenCalledWith(ethereum,{errorCorrection:'medium'});
 const qr=host(tree,'wallet-address-qr');
 expect(qr.props.accessibilityLabel).toBe('QR code');expect(qr.props.accessibilityRole).toBe('image');
 const rects=tree.findAllByType(Rect);expect(rects).toHaveLength(6);
 expect(rects.filter(rect=>rect.props.fill==='none').map(rect=>[rect.props.x,rect.props.y,rect.props.width,rect.props.stroke])).toEqual([[0.5,0.5,6,colors.text],[14.5,0.5,6,colors.text],[0.5,14.5,6,colors.text]]);
 expect(rects.filter(rect=>rect.props.fill!=='none').map(rect=>[rect.props.x,rect.props.y,rect.props.width,rect.props.fill])).toEqual([[2,2,3,colors.text],[16,2,3,colors.text],[2,16,3,colors.text]]);
 const dots=tree.findByType(Path);expect(dots.props.fill).toBe(colors.text);expect(dots.props.d.match(/M/g)).toHaveLength(4);
 // 196dp code, 7 rows: 28dp each.
 expect(flat(host(tree,'wallet-address-column')).lineHeight).toBe(28);expect(tree.findAllByType(Image)).toHaveLength(0);
 // Without a clipboard adapter it is not a control and shows no hint.
 expect(tree.findAll(node=>node.props.accessibilityRole==='button')).toHaveLength(0);expect(tree.findAll(node=>node.type==='Text'&&text(node)==='Tap to copy')).toHaveLength(0);
});
it('sizes the Solana column to the code, encodes a separate payload and raises the error correction for an arena',()=>{
 const tree=mount(h(WalletAddress,{address:solana,qrValue:`solana:${solana}?amount=1`,arena:'https://example.test/sol.png',size:220}));
 expect(create).toHaveBeenCalledWith(`solana:${solana}?amount=1`,{errorCorrection:'high'});
 expect(flat(host(tree,'wallet-address-column')).lineHeight).toBe(20);expect(text(host(tree,'wallet-address-column')).replace(/\n/g,'')).toBe(solana);
 const arena=host(tree,'wallet-address-arena');expect(arena.props.source).toEqual({uri:'https://example.test/sol.png'});
 const unit=220/21;expect(flat(arena)).toMatchObject({position:'absolute',left:8.5*unit,top:8.5*unit,width:4*unit,height:4*unit});
 expect(tree.findByType(Path).props.d.match(/M/g)).toHaveLength(2);
});
it('copies through the host as one button, shows Tap to copy, and raises Address copied only on success',async()=>{
 const onCopy=jest.fn(()=>Promise.resolve());let tree=mount(h(WalletAddress,{address:ethereum,onCopy}));
 const buttons=tree.findAll(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function'&&node.props.testID==='wallet-address-copy');
 expect(buttons.length).toBeGreaterThan(0);expect(buttons[0].props.accessibilityLabel).toBe(`Copy address: ${ethereum}`);
 expect(tree.findAll(node=>node.type==='Text'&&text(node)==='Tap to copy')).toHaveLength(1);
 const copied=()=>tree.findAll(node=>node.type==='Text'&&text(node)==='Address copied').length;
 await act(async()=>{buttons[0].props.onPress();await Promise.resolve();await Promise.resolve();});
 expect(onCopy).toHaveBeenCalledTimes(1);expect(copied()).toBeGreaterThan(0);
 act(()=>{jest.advanceTimersByTime(4000);});expect(copied()).toBe(0);
 const denied=jest.fn(()=>Promise.reject(new Error('denied')));tree=mount(h(WalletAddress,{address:solana,onCopy:denied}));
 await act(async()=>{host(tree,'wallet-address-copy').props.onPress?.();tree.findAll(node=>node.props.testID==='wallet-address-copy'&&typeof node.props.onPress==='function')[0].props.onPress();await Promise.resolve();await Promise.resolve();await Promise.resolve();});
 expect(denied).toHaveBeenCalled();expect(copied()).toBe(0);
});
it('translates the hint, the QR name and the copy name through the provider',()=>{
 const tree=mount(h(WalletAddress,{address:ethereum,onCopy:jest.fn()}),{messages:{tapToCopy:'Toucher pour copier',qrCode:'Code QR',copyAddress:'Copier l’adresse'}});
 expect(tree.findAll(node=>node.type==='Text'&&text(node)==='Toucher pour copier')).toHaveLength(1);expect(host(tree,'wallet-address-qr').props.accessibilityLabel).toBe('Code QR');
 expect(tree.findAll(node=>node.props.testID==='wallet-address-copy'&&node.props.accessibilityLabel===`Copier l’adresse: ${ethereum}`).length).toBeGreaterThan(0);
});
it('every character carries the row type size, so HIG Text\'s body size cannot shrink the address',()=>{
 const React=require('react');const {create,act}=require('react-test-renderer');const {StyleSheet}=require('react-native');
 const {HIGProvider}=require('../../packages/hig/native/src/provider');const {VerticalAddress}=require('../../packages/hig/native/src/data');
 let view;act(()=>{view=create(React.createElement(HIGProvider,null,React.createElement(VerticalAddress,{address:'0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',rowHeight:28})));});
 const sizes=new Set(view.root.findAll(n=>typeof n.type==='string'&&n.type==='Text'&&typeof n.props.children==='string'&&n.props.children.length===1).map(n=>StyleSheet.flatten(n.props.style).fontSize));
 expect([...sizes]).toEqual([25.5]);act(()=>view.unmount());
});
