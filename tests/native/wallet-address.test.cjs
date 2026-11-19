/**
 * Native wallet address components: the vertical address column and HIG's own QR code beside it.
 * The code's modules are covered with the encoder in tests/qr-model.test.ts; here it is the drawing HIG's `QRCode` makes.
 */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,Image}=require('react-native');
const {Path,Rect}=require('react-native-svg');
const {qrCodeGeometry}=require('@bloxwap/hig/contracts/qr');
const {QRCode}=require('../../packages/hig/native/src/qr-code');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {VerticalAddress,addressKind,addressRows}=require('../../packages/hig/native/src/data');
const {WalletAddress}=require('../../packages/hig/native/src/wallet-address');
const h=React.createElement;
const ethereum='0x9e0fD0622874ca1ccBf79DA087BaF4622Faf7768';
const solana='6uRAouaynVhU87V9iMaWy616295tf2ZnZQv2YxAcPnhQ';
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const cells=tree=>tree.findAll(node=>node.type==='Text'&&typeof node.props.children==='string');
beforeEach(()=>{jest.useFakeTimers();});
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
 const drawn=cells(tree);expect(drawn.map(node=>node.props.children.replaceAll('\n',''))).toEqual([ethereum.slice(0,6),ethereum.slice(6,-4),ethereum.slice(-4)]);
 expect(flat(drawn[0])).toMatchObject({color:colors.text,fontWeight:'600'});expect(flat(drawn[1])).toMatchObject({color:colors.muted,fontWeight:'500'});expect(flat(drawn[2])).toMatchObject({color:colors.text,fontWeight:'600'});
 tree=mount(h(VerticalAddress,{address:solana,testID:'column'}));
 expect(flat(host(tree,'column'))).toMatchObject({lineHeight:22,fontSize:20});expect(text(host(tree,'column')).split('\n')).toHaveLength(11);
});
it('renders HIG\'s QR code as a named image in the text colour beside a column exactly as tall as the code',()=>{
 const tree=mount(h(WalletAddress,{address:ethereum,testID:'wallet'}));
 // The code sits on the host's surface: no tile, and no quiet zone of its own.
 expect(tree.findByType(QRCode).props).toMatchObject({value:ethereum,size:196,quietZone:0,background:'none'});
 const qr=host(tree,'wallet-address-qr');
 expect(qr.props.accessibilityLabel).toBe('QR code');expect(qr.props.accessibilityRole).toBe('image');
 expect(tree.findAllByType(Rect)).toHaveLength(0);
 const drawing=tree.findByType(Path);expect(drawing.props.fill).toBe(colors.text);expect(drawing.props.d).toBe(qrCodeGeometry(ethereum).path);
 // 196dp code, 7 rows: 28dp each.
 expect(flat(host(tree,'wallet-address-column')).lineHeight).toBe(28);expect(tree.findAllByType(Image)).toHaveLength(0);
 // Without a clipboard adapter it is not a control and shows no hint.
 expect(tree.findAll(node=>node.props.accessibilityRole==='button')).toHaveLength(0);expect(tree.findAll(node=>node.type==='Text'&&text(node)==='Tap to copy')).toHaveLength(0);
});
it('sizes the Solana column to the code, encodes a separate payload and clears the centre for an arena',()=>{
 const payload=`solana:${solana}?amount=1`;
 const tree=mount(h(WalletAddress,{address:solana,qrValue:payload,arena:'https://example.test/sol.png',size:220}));
 expect(tree.findByType(QRCode).props).toMatchObject({value:payload,arena:'https://example.test/sol.png',size:220});
 expect(flat(host(tree,'wallet-address-column')).lineHeight).toBe(20);expect(text(host(tree,'wallet-address-column')).replace(/\n/g,'')).toBe(solana);
 expect(tree.findByType(Image).props.source).toEqual({uri:'https://example.test/sol.png'});
 // With an arena the code is encoded at a higher error correction and its centre is left clear.
 const cleared=qrCodeGeometry(payload,{arena:true});expect(tree.findByType(Path).props.d).toBe(cleared.path);expect(cleared.path).not.toBe(qrCodeGeometry(payload).path);
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
 const sizes=new Set(view.root.findAll(n=>typeof n.type==='string'&&n.type==='Text'&&typeof n.props.children==='string').map(n=>StyleSheet.flatten(n.props.style).fontSize));
 expect([...sizes]).toEqual([25.5]);act(()=>view.unmount());
});
