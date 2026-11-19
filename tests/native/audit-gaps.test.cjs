/** Native side of the defects and small gaps the app audits found (Unreleased). */
jest.mock('react-native-safe-area-context',()=>({useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {ScrollView,StyleSheet,Text:RNText,View}=require('react-native');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const blocks=require('../../packages/hig/native/src/blocks');
const {ProfileBlock}=require('../../packages/hig/native/src/profile-block');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {Button}=require('../../packages/hig/native/src/button');
const {ListRow}=require('../../packages/hig/native/src/list-group');
const {NumberReadout}=require('../../packages/hig/native/src/data');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const press=(view,id,event)=>act(()=>all(view,id).find(node=>typeof node.props.onPress==='function').props.onPress(event??{stopPropagation(){},isDefaultPrevented:()=>false}));
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};

describe('MarketRow is one line (defect fix)',()=>{
 it('does not wrap: the identity shrinks and its name truncates, the figures and trailing content keep their width',()=>{
  const view=mount(h(blocks.MarketRow,{symbol:'HYPESTRAT',name:'Hyperliquid Strategies Holdings',detail:'Up to 10×',icon:h(View,{testID:'icon'}),trailing:h(View,{testID:'pnl'}),selected:true,onSelect:jest.fn(),testID:'market'}));
  const row=flat(host(view,'market'));expect(row.flexWrap).toBe('nowrap');expect(row.paddingVertical).toBe(8);
  const lines=view.findAll(node=>node.type==='Text'&&node.props.numberOfLines===1).map(node=>node.props.children);
  expect(lines).toEqual(expect.arrayContaining(['Hyperliquid Strategies Holdings (HYPESTRAT)','Up to 10×']));
  // The name cell has a 96dp floor and never shrinks; the trailing content is the last to give up space (clipped).
  expect(flat(view.findAllByType(Button)[0])).toMatchObject({flexGrow:1,flexShrink:0,flexBasis:96});
  expect(flat(host(view,'market-trailing'))).toMatchObject({flexShrink:1,minWidth:0,overflow:'hidden'});
  expect(host(view,'market-figures')).toBeUndefined();
  // The name button has no vertical padding, so a two-line name is a 44 row inside 8 + 8: 60 at most.
  expect(flat(view.findAllByType(Button)[0]).paddingVertical).toBe(0);
  // Without a detail line the name still truncates on one line.
  const plain=mount(h(blocks.MarketRow,{symbol:'SOL',name:'Solana',icon:h(View),selected:true,onSelect:jest.fn()}));
  expect(plain.findAll(node=>node.type==='Text'&&node.props.numberOfLines===1).map(node=>node.props.children)).toContain('Solana (SOL)');
 });
 it('groups the figures in one clipped wrapping line that gives up its space first, so whole figures drop when the row is narrow',()=>{
  const view=mount(h(blocks.MarketRow,{symbol:'BTC',name:'Bitcoin',icon:h(View),price:64321.12,change:-1.23,trailing:h(View),selected:true,onSelect:jest.fn(),testID:'market'}));
  expect(flat(host(view,'market-figures'))).toMatchObject({flexDirection:'row',flexWrap:'wrap',height:44,overflow:'hidden',flexShrink:1000,minWidth:0});
  // A zero-width first item, then the price and the change.
  const kids=host(view,'market-figures').children;expect(kids).toHaveLength(3);expect(flat(kids[0])).toMatchObject({width:0,height:44});
 });
});

describe('stickyHeader on the remaining blocks',()=>{
 const labels={title:'Manage Position',margin:'Margin',notional:'Notional',liquidation:'Liquidation',toLiquidation:percent=>`${percent} to liquidation`,mark:'Mark',entry:'Entry',long:'Long',short:'Short'};
 const cases=[
  [h(ProfileBlock,{name:'Joe',sections:[],onClose:jest.fn(),stickyHeader:true}),'profile-sticky-header','profile-bar'],
  [h(blocks.ManagePositionBlock,{labels,side:'long',entry:1,actions:[],stickyHeader:true}),'manage-sticky-header','manage-header'],
  [h(blocks.AccountBlock,{assets:[],stickyHeader:true}),'account-sticky-header','account-header'],
  [h(blocks.TokenActionBlock,{symbol:'HYPE',actions:[],stickyHeader:true}),'token-sticky-header','token-header'],
  [h(blocks.LanguageBlock,{languages:[],onSelect:jest.fn(),stickyHeader:true,testID:'language'}),'language-sticky-header',null],
 ];
 it.each(cases.map(([element,id,inner])=>[id,element,inner]))('%s: its own scroll view with the header pinned, transparent until content scrolls under it',(id,element,inner)=>{
  const view=mount(element);const scroll=view.findByType(ScrollView);expect(scroll.props.stickyHeaderIndices).toEqual([0]);
  expect(flat(host(view,id)).backgroundColor).toBe('transparent');expect(flat(host(view,id)).paddingTop).toBe(16);
  if(inner)expect(host(host(view,id),inner)).toBeDefined();
  act(()=>{scroll.props.onScroll({nativeEvent:{contentOffset:{y:30}}});});expect(flat(host(view,id)).backgroundColor).toBe(nativeSrgb.background);
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:0}}});});expect(flat(host(view,id)).backgroundColor).toBe('transparent');
 });
 it('takes the host fill and scroll view, and leaves the block unchanged without stickyHeader',()=>{
  function HostScroll(props){return h(ScrollView,{...props,testID:'host-scroll'});}
  const view=mount(h(blocks.AccountBlock,{assets:[],stickyHeader:true,stickyHeaderBackground:'#101010',scrollComponent:HostScroll}));
  expect(host(view,'host-scroll')).toBeDefined();act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:4}}});});expect(flat(host(view,'account-sticky-header')).backgroundColor).toBe('#101010');
  for(const [element] of cases){const plain=mount(React.cloneElement(element,{stickyHeader:undefined}));expect(plain.findAllByType(ScrollView)).toHaveLength(0);}
 });
});

describe('row values use the interface face',()=>{
 it('draws a number in a ListRow value in the provider face, never the mono face',()=>{
  const view=mount(h(ListRow,{label:'Leverage',value:h(NumberReadout,{value:40,suffix:'×',testID:'lev'}),valueLabel:'40×'}),{fontFamily:'BloxwapSans',monoFontFamily:'BloxwapMono'});
  const text=view.findAll(node=>node.type==='Text'&&node.props.testID==='lev')[0];expect(flat(text).fontFamily).not.toBe('BloxwapMono');
 });
});

describe('picker token rows',()=>{
 it('read the selected row as selected and take host test IDs',()=>{
  const eth={id:'1-eth',symbol:'ETH',name:'Ether',chain:'Ethereum',chainId:1},usdc={id:'1-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1};
  const view=mount(h(blocks.FromPickerBlock,{tokens:[eth,usdc],selected:usdc,onSelect:jest.fn(),tokenRowProps:token=>token.id==='1-usdc'?{testID:'token-usdc',accessibilityHint:'Selected asset'}:{}}));
  const row=host(view,'token-usdc');expect(row.props.accessibilityState).toEqual({selected:true});expect(row.props.accessibilityHint).toBe('Selected asset');
  expect(host(view,'swap-token-1-eth').props.accessibilityState).toEqual({selected:false});
 });
});

describe('SwapBlock title',()=>{
 it('draws the shared ScreenHeader: centred 17/24 title in a 44 row',()=>{
  const onBack=jest.fn();const view=mount(h(blocks.SwapBlock,{tokens:[],onSubmit:jest.fn(),title:'Deposit',onBack,headingId:'deposit-title'}));
  const title=host(view,'swap-title');expect(flat(title)).toMatchObject({textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600'});expect(title.props.nativeID).toBe('deposit-title');
  expect(flat(host(view,'swap-header')).minHeight).toBe(44);
  press(view,'swap-back');expect(onBack).toHaveBeenCalledTimes(1);
 });
});

describe('SegmentedControl',()=>{
 it('gives each segment its own test ID',()=>{
  const change=jest.fn();const view=mount(h(SegmentedControl,{label:'Mode',options:[{value:'image',label:'Image'},{value:'video',label:'Video'}],value:'image',onValueChange:change,testID:'trade-share-mode'}));
  expect(host(view,'trade-share-mode-video').props.accessibilityState).toEqual({checked:false,disabled:false});
  press(view,'trade-share-mode-video');expect(change).toHaveBeenCalledWith('video');
  expect(mount(h(SegmentedControl,{label:'Mode',options:[{value:'a',label:'A'}]})).findAll(node=>typeof node.props.testID==='string'&&node.props.testID.endsWith('-a'))).toHaveLength(0);
 });
});

describe('Button market fills',()=>{
 it('fills up and down with the provider market colours at 15% behind a full-colour label',()=>{
  let view=mount(h(View,null,h(Button,{intent:'up',testID:'long'},'Long'),h(Button,{intent:'down',testID:'short'},'Short')));
  expect(flat(host(view,'long')).backgroundColor).toBe(nativeSrgb.buy+'26');expect(flat(host(view,'short')).backgroundColor).toBe(nativeSrgb.sell+'26');
  const label=view.findAll(node=>node.type==='Text'&&node.props.children==='Long')[0];expect(flat(label).color).toBe(nativeSrgb.buy);
  view=mount(h(Button,{intent:'up',testID:'long'},'Long'),{marketColors:{up:'#ff3b30',down:'#0a84ff'}});expect(flat(host(view,'long')).backgroundColor).toBe('#ff3b3026');
  view=mount(h(Button,{intent:'down',disabled:true,testID:'short'},'Short'));expect(flat(host(view,'short')).backgroundColor).not.toBe(nativeSrgb.sell);
 });
});

describe('headingId and labelledBy',()=>{
 // The sheet's side, `labelledBy` on its content, is covered with the sheet in gesture-sheet.test.cjs.
 it('sets nativeID on the block titles',()=>{
  for(const [element,id] of [[h(blocks.AccountBlock,{assets:[],headingId:'h'}),'account-title'],[h(blocks.TokenActionBlock,{symbol:'HYPE',actions:[],headingId:'h'}),'token-title'],[h(blocks.LanguageBlock,{languages:[],onSelect:jest.fn(),headingId:'h',testID:'language'}),'language-title'],[h(ProfileBlock,{name:'Joe',sections:[],headingId:'h'}),'profile-name']]){
   expect([id,host(mount(element),id).props.nativeID]).toEqual([id,'h']);
  }
 });
});
