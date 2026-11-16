/** Native host options on the asset rows, the account and token blocks, the pickers, WalletAddress and MarketRow. */
let mockCuerLoaded=false;
jest.mock('cuer/QrCode',()=>{mockCuerLoaded=true;return {create:()=>({grid:Array.from({length:21},()=>Array.from({length:21},()=>false))})};});
const React=require('react');
const {readFileSync}=require('node:fs');
const {create:render,act}=require('react-test-renderer');
const {FlatList,StyleSheet,Text:RNText,View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AssetBalanceRow}=require('../../packages/hig/native/src/asset-balance-row');
const {AccountBlock,accountRows}=require('../../packages/hig/native/src/account-block');
const {TokenActionBlock}=require('../../packages/hig/native/src/token-action-block');
const pickers=require('../../packages/hig/native/src/pickers');
const blocks=require('../../packages/hig/native/src/blocks');
const core=require('../../packages/hig/native/src/wallet-address-core');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {Button}=require('../../packages/hig/native/src/button');
const {Usd,Percent}=require('../../packages/hig/native/src/data');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const outer=(view,id)=>all(view,id).find(node=>node.props.accessibilityLabel!==undefined);
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flows=view=>view.findAllByType(AnimatedNumberReadout);
const reading=(view,id)=>text(view.findAll(node=>node.type==='Text'&&node.props.testID===id)[0]);

describe('AssetBalanceRow',()=>{
 it('reads selected and disabled as states, draws a check, dims a disabled row and ignores its press',()=>{
  const select=jest.fn();
  let view=mount(h(AssetBalanceRow,{name:'Solana',symbol:'SOL',value:203,balance:1.25,selected:true,onSelect:select,testID:'row'}));
  expect(outer(view,'row').props.accessibilityState).toEqual({selected:true});expect(host(view,'row-check')).toBeDefined();
  view=mount(h(AssetBalanceRow,{name:'Solana',symbol:'SOL',value:0,balance:0,disabled:true,onSelect:select,testID:'row'}));
  const button=outer(view,'row');expect(button.props.accessibilityState).toEqual({disabled:true});expect(button.props.disabled).toBe(true);
  expect(flows(view)[0].props.tone).toBe('muted');
  view=mount(h(AssetBalanceRow,{name:'Solana',symbol:'SOL',value:0,disabled:true,testID:'row'}));expect(outer(view,'row').props.accessibilityState).toEqual({disabled:true});
  // Without the options the row reads no state.
  view=mount(h(AssetBalanceRow,{name:'Solana',symbol:'SOL',value:1,testID:'row'}));expect(outer(view,'row').props.accessibilityState).toBeUndefined();
 });
 it('draws no figures for an item to pick, a tag and a units suffix read in the label, and a trailing slot',()=>{
  let view=mount(h(AssetBalanceRow,{name:'Card',symbol:'Instant',amounts:false,onSelect:()=>{},testID:'row'}));
  expect(flows(view)).toHaveLength(0);expect(outer(view,'row').props.accessibilityLabel).toBe('Card, Instant');
  view=mount(h(AssetBalanceRow,{name:'Hyperliquid',symbol:'HYPE',value:57.97,balance:1.005,unitsSuffix:' HYPE',tag:'Spot',trailing:h(View,{testID:'trail'}),testID:'row'}));
  expect(outer(view,'row').props.accessibilityLabel).toBe('Hyperliquid, HYPE, $57.97, 1.005 HYPE, Spot');
  expect(flows(view)[1].props.suffix).toBe(' HYPE');expect(reading(view,'row-tag')).toBe('Spot');expect(StyleSheet.flatten(host(view,'row-tag').props.style)).toMatchObject({fontSize:12});
  expect(host(view,'trail')).toBeDefined();expect(host(view,'row-trailing').props.accessibilityElementsHidden).toBe(true);
 });
 it('reads the trailing slot last in the label: its text, or trailingLabel in its place',()=>{
  let view=mount(h(AssetBalanceRow,{name:'USD Coin',symbol:'USDC',value:5,tag:'Base',trailing:h(RNText,null,'Fee $0.10'),onSelect:()=>{},testID:'row'}));
  expect(outer(view,'row').props.accessibilityLabel).toBe('USD Coin, USDC, $5.00, Base, Fee $0.10');
  view=mount(h(AssetBalanceRow,{name:'USD Coin',symbol:'USDC',value:5,trailing:h(View,{testID:'warn'}),trailingLabel:'Network busy',testID:'row'}));
  expect(outer(view,'row').props.accessibilityLabel).toBe('USD Coin, USDC, $5.00, Network busy');
 });
});
describe('AccountBlock',()=>{
 const perp={id:'perp',name:'USD Coin',symbol:'USDC',value:500,units:false,tag:'Perp'};
 const spot={id:'spot',name:'USD Coin',symbol:'USDC',value:20,units:false,tag:'Spot'};
 const hypeSpot={id:'hype-spot',name:'Hyperliquid',symbol:'HYPE',balance:2,price:40,tag:'Spot'};
 const hypeStaked={id:'hype-staked',name:'Hyperliquid',symbol:'HYPE',balance:10,price:40,tag:'Staked'};
 const ids=view=>view.findAllByType(AssetBalanceRow).map(row=>row.props.testID);
 it('keeps the given order per section or block, pins by id and passes tags through',()=>{
  expect(accountRows([hypeStaked,spot,perp],'USDC',{order:'given',pinnedId:'perp'})).toEqual({pinned:perp,rest:[hypeStaked,spot]});
  let view=mount(h(AccountBlock,{sections:[{id:'ex',title:'Exchange',order:'given',pinnedId:'perp',assets:[spot,hypeStaked,perp,hypeSpot]},{id:'wallet',title:'Wallet',assets:[hypeSpot,hypeStaked]}]}));
  expect(ids(view)).toEqual(['account-section-ex-asset-perp','account-section-ex-asset-spot','account-section-ex-asset-hype-staked','account-section-ex-asset-hype-spot','account-section-wallet-asset-hype-staked','account-section-wallet-asset-hype-spot']);
  expect(view.findAllByType(AssetBalanceRow)[0].props.tag).toBe('Perp');
  view=mount(h(AccountBlock,{order:'given',pinnedId:'hype-spot',assets:[hypeStaked,perp,hypeSpot]}));
  expect(ids(view)).toEqual(['account-asset-hype-spot','account-asset-hype-staked','account-asset-perp']);
  // Pinned by id, the row keeps its units.
  expect(view.findAllByType(AssetBalanceRow)[0].props.balance).toBe(2);
 });
 it('unknownValue dash keeps the dash over the units; the default headlines them',()=>{
  const paper={id:'paper',name:'Paper',symbol:'PAPER',balance:1000,value:null,unitsSuffix:' PAPER'};
  let view=mount(h(AccountBlock,{assets:[{...paper,unknownValue:'dash'}]}));
  let row=view.findAllByType(AssetBalanceRow)[1];expect(row.props.headline).toBeUndefined();expect(row.props.unitsSuffix).toBe(' PAPER');
  expect(outer(view,'account-asset-paper').props.accessibilityLabel).toBe('Paper, PAPER, —, 1,000 PAPER');
  view=mount(h(AccountBlock,{assets:[paper]}));row=view.findAllByType(AssetBalanceRow)[1];expect(row.props.headline).toBe('units');
  expect(outer(view,'account-asset-paper').props.accessibilityLabel).toBe('Paper, PAPER, 1,000 PAPER');
 });
});
describe('TokenActionBlock',()=>{
 it('headlines the units with their suffix when there is no dollar value',()=>{
  let view=mount(h(TokenActionBlock,{symbol:'BLOX',name:'Bloxwap',units:1234.5,unitsSuffix:' BLOX',assets:[{label:'Wallet',value:1}],actions:[]}));
  expect(all(view,'token-value')).toHaveLength(0);expect(reading(view,'token-units')).toBe('1,234.5 BLOX');
  view=mount(h(TokenActionBlock,{symbol:'HYPE',name:'Hyperliquid',value:759,units:13.2,assets:[{label:'Wallet',value:759}],actions:[]}));
  expect(all(view,'token-units')).toHaveLength(0);expect(reading(view,'token-value')).toBe('$759.00');
 });
});
describe('Pickers',()=>{
 const hype={id:'hype',symbol:'HYPE',name:'Hyperliquid',chain:'Hyperliquid',chainId:999,balance:0,unitsSuffix:' HYPE',detail:'HYPE'};
 const usdc={id:'usdc',symbol:'USDC',name:'USD Coin',chain:'Hyperliquid',chainId:999,balance:12.5,unitsSuffix:' USDC'};
 it('leaves out the search, shows zero balances with their suffix and a detail line',()=>{
  let view=mount(h(pickers.FromPickerBlock,{tokens:[hype,usdc],search:false,zeroBalances:true,onSelect:jest.fn()}));
  expect(all(view,'swap-search-from')).toHaveLength(0);
  expect(reading(view,'swap-token-balance-hype')).toBe('0 HYPE');expect(reading(view,'swap-token-balance-usdc')).toBe('12.5 USDC');
  expect(view.findAll(node=>node.type==='Text'&&text(node)==='HYPE').length).toBeGreaterThan(0);
  view=mount(h(pickers.FromPickerBlock,{tokens:[hype,usdc],onSelect:jest.fn()}));expect(all(view,'swap-token-balance-hype')).toHaveLength(0);expect(host(view,'swap-search-from')).toBeDefined();
 });
 it('takes a list component, input refs and focus handlers, and visible labels; the host context is public',()=>{
  expect(pickers.SwapHostContext).toBe(require('../../packages/hig/native/src/swap-parts').SwapHostContext);expect(blocks.SwapHostContext).toBe(pickers.SwapHostContext);
  const SheetList=props=>h(FlatList,{...props,sheetList:true});
  const searchRef=React.createRef(),addressRef=React.createRef(),focus=jest.fn(),blur=jest.fn();
  const view=mount(h(pickers.ToPickerBlock,{tokens:[hype,usdc],onSelect:jest.fn(),listComponent:SheetList,address:'',onAddressChange:jest.fn(),addressLabel:'Recipient',addressRef,addressInputProps:{onFocus:focus,onBlur:blur},searchLabel:'Asset',searchRef,searchInputProps:{onFocus:focus}}));
  expect(view.findAll(node=>node.props.sheetList===true&&node.props.testID==='swap-list-to').length).toBeGreaterThan(0);
  expect(addressRef.current).toBeTruthy();expect(searchRef.current).toBeTruthy();
  const address=host(view,'picker-address');expect(address.props.accessibilityLabel).toBe('Recipient');
  act(()=>{address.props.onFocus({});address.props.onBlur({});});expect(focus).toHaveBeenCalledTimes(1);expect(blur).toHaveBeenCalledTimes(1);
  expect(host(view,'swap-search-to').props.accessibilityLabel).toBe('Asset');
  expect(view.findAll(node=>node.type==='Text'&&text(node)==='Recipient').length).toBeGreaterThan(0);expect(view.findAll(node=>node.type==='Text'&&text(node)==='Asset').length).toBeGreaterThan(0);
 });
});
describe('WalletAddress',()=>{
 const ethereum='0x9e0fD0622874ca1ccBf79DA087BaF4622Faf7768';
 it('draws the host QR from the core entry without loading cuer or react-native-svg',()=>{
  const view=mount(h(core.WalletAddress,{address:ethereum,qr:h(View,{testID:'host-qr'}),size:140}));
  expect(mockCuerLoaded).toBe(false);
  const image=host(view,'wallet-address-qr');expect(image.props.accessibilityRole).toBe('image');expect(image.props.accessibilityLabel).toBe('QR code');expect(host(view,'host-qr')).toBeDefined();
  expect(readFileSync('packages/hig/native/src/wallet-address-core.tsx','utf8')).not.toMatch(/from '(cuer|react-native-svg)[/']/);
  // The main entry takes the same qr and then encodes nothing.
  const main=require('../../packages/hig/native/src/wallet-address');
  mount(h(main.WalletAddress,{address:ethereum,qr:h(View,{testID:'host-qr'})}));expect(host(root.root,'host-qr')).toBeDefined();
  // As on web, qr={null} is the same as leaving it out: the cuer code is drawn.
  mount(h(main.WalletAddress,{address:ethereum,qr:null}));expect(root.root.findAll(node=>typeof node.type==='function'&&node.type.name==='CuerCode')).toHaveLength(1);
 });
 it('announce={false} shows no notice after a copy',async()=>{
  const copy=jest.fn();
  const view=mount(h(core.WalletAddress,{address:ethereum,qr:h(View),onCopy:copy,announce:false}));
  await act(async()=>{view.findAll(node=>node.props.testID==='wallet-address-copy'&&typeof node.props.onPress==='function')[0].props.onPress();await Promise.resolve();await Promise.resolve();});
  expect(copy).toHaveBeenCalledTimes(1);expect(view.findAll(node=>node.type==='Text'&&text(node)==='Address copied')).toHaveLength(0);
  mount(h(core.WalletAddress,{address:ethereum,qr:h(View),onCopy:copy}));
  await act(async()=>{root.root.findAll(node=>node.props.testID==='wallet-address-copy'&&typeof node.props.onPress==='function')[0].props.onPress();await Promise.resolve();await Promise.resolve();});
  expect(root.root.findAll(node=>node.type==='Text'&&text(node)==='Address copied').length).toBeGreaterThan(0);
 });
});
describe('MarketRow',()=>{
 const {MarketRow}=blocks;
 it('keeps the 0.6.0 row without options',()=>{
  const view=mount(h(MarketRow,{symbol:'BTC',name:'Bitcoin',price:1,change:1,onSelect:jest.fn()}));
  expect(view.findAllByType(Usd)).toHaveLength(1);expect(view.findAllByType(Percent)).toHaveLength(1);expect(view.findAllByType(Button)).toHaveLength(1);
 });
 it('leaves out price and change without dashes, and takes an icon, detail, trailing content, states, onPressIn and a ref',()=>{
  const select=jest.fn(),pressIn=jest.fn(),ref=React.createRef();
  let view=mount(h(MarketRow,{ref,symbol:'BTC',name:'Bitcoin',icon:h(View,{testID:'icon'}),detail:'40×',trailing:h(View,{testID:'pnl'}),selected:true,active:true,onPressIn:pressIn,onSelect:select,testID:'market'}));
  expect(view.findAllByType(Usd)).toHaveLength(0);expect(view.findAllByType(Percent)).toHaveLength(0);expect(view.findAll(node=>node.type==='Text'&&text(node)==='—')).toHaveLength(0);
  expect(ref.current).toBeTruthy();expect(host(view,'icon')).toBeDefined();expect(host(view,'pnl')).toBeDefined();expect(host(view,'market-check')).toBeDefined();
  const button=view.findAllByType(Button)[0];expect(button.props.accessibilityLabel).toBe('Bitcoin (BTC), 40×');expect(button.props.accessibilityState).toEqual({selected:true});
  act(()=>{button.props.onPressIn({});button.props.onPress();});expect(pressIn).toHaveBeenCalledTimes(1);expect(select).toHaveBeenCalledTimes(1);
  expect(StyleSheet.flatten(host(view,'market').props.style).backgroundColor).toBeDefined();
  view=mount(h(MarketRow,{symbol:'BTC',name:'Bitcoin',disabled:true,onSelect:select}));expect(view.findAllByType(Button)[0].props.disabled).toBe(true);
  // A node detail, as web takes, is drawn as given and its text is read with the name.
  view=mount(h(MarketRow,{symbol:'BTC',name:'Bitcoin',detail:h(RNText,{testID:'lev'},'Up to 40×'),onSelect:select}));
  expect(host(view,'lev')).toBeDefined();expect(view.findAllByType(Button)[0].props.accessibilityLabel).toBe('Bitcoin (BTC), Up to 40×');
  view=mount(h(MarketRow,{symbol:'BTC',name:'Bitcoin',active:true,onSelect:select,testID:'market'}));expect(StyleSheet.flatten(host(view,'market').props.style).borderRadius).toBe(14);
 });
 it('has the presentation mode the web row has: host identity, favourite, volume and formats, with no button',()=>{
  const view=mount(h(MarketRow,{mode:'presentation',symbol:'BTC',name:'Bitcoin',price:0.00001234,priceOptions:{style:'decimal',maximumFractionDigits:8},change:2.345,changeOptions:{minimumFractionDigits:2,maximumFractionDigits:2},identity:h(RNText,{testID:'identity'},'BTC'),favorite:h(View,{testID:'fav'}),volume:h(RNText,{testID:'vol'},'1.2M'),selected:true,testID:'p'}));
  expect(view.findAllByType(Button)).toHaveLength(0);expect(host(view,'identity')).toBeDefined();expect(host(view,'fav')).toBeDefined();expect(host(view,'vol')).toBeDefined();
  expect(view.findAllByType(Usd)[0].props.options).toEqual({style:'decimal',maximumFractionDigits:8});expect(view.findAllByType(Percent)[0].props.options).toEqual({minimumFractionDigits:2,maximumFractionDigits:2});
  expect(host(view,'p').props.accessibilityState).toEqual({selected:true});
 });
});
