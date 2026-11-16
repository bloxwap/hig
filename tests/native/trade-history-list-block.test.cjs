/** Native TradeHistoryListBlock: a header and one capsule row per closed trade. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,View}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {TradeHistoryListBlock,tradeHistorySide}=require('../../packages/hig/native/src/trade-history-list-block');
const h=React.createElement;
let root;
const labels={title:'History',long:'Long',short:'Short',empty:'No closed trades yet'};
const trades=[{id:'1',name:'Amazon',side:'short',leverage:20,pnl:1.412,time:'2d'},{id:'2',name:'NVIDIA',side:'long',leverage:20,pnl:17.9,time:'3d'},{id:'3',name:'Robinhood',side:'long',leverage:10,pnl:-7.762,time:'4d'}];
function mount(props,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,provider,h(TradeHistoryListBlock,{labels,trades,testID:'history',...props})));});return root.root;}
const all=(tree,testID)=>tree.findAll(node=>node.props.testID===testID);
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('reads a side with the host word and the leverage',()=>{
 expect(tradeHistorySide({side:'short',leverage:20},labels)).toBe('Short 20×');expect(tradeHistorySide({side:'long'},labels)).toBe('Long');
});
it('shows the heading, Back and one row per trade that reads the asset, side, result and age',()=>{
 const back=jest.fn();const tree=mount({onBack:back});
 expect(text(all(tree,'history-title').find(node=>typeof node.type==='string'))).toBe('History');
 act(()=>{all(tree,'history-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 expect(trades.map(trade=>host(tree,`history-${trade.id}`).props.accessibilityLabel)).toEqual(['Amazon, Short 20×, +$1.412, 2d','NVIDIA, Long 20×, +$17.90, 3d','Robinhood, Long 10×, -$7.762, 4d']);
 expect(flat(host(tree,'history-rows')).gap).toBe(8);expect(flat(host(tree,'history-1'))).toMatchObject({minHeight:56,borderRadius:28,backgroundColor:colors.surface});
 expect(all(tree,'history-1').some(node=>node.props.onPress)).toBe(false);
});
it('colours the leverage by direction and makes rows buttons with onSelect',()=>{
 const select=jest.fn();const tree=mount({onSelect:select});
 const leverage=id=>StyleSheet.flatten(host(tree,`history-${id}-side`).findAll(node=>node.type==='Text')[0].props.style).color;
 expect(leverage('1')).toBe(colors.negative);expect(leverage('2')).toBe(colors.positive);
 const button=all(tree,'history-3').find(node=>node.props.onPress);expect(button.props.accessibilityRole).toBe('button');
 act(()=>{button.props.onPress({});});expect(select).toHaveBeenCalledWith(trades[2]);
});
describe('host slots (Unreleased)',()=>{
 const {FlatList}=require('react-native');
 it('colours side, leverage and result with the market up/down roles, like the detail block',()=>{
  const tree=mount({},{marketColors:{up:'#ff3b30',down:'#0a84ff'}});
  const leverage=id=>StyleSheet.flatten(host(tree,`history-${id}-side`).findAll(node=>node.type==='Text')[0].props.style).color;
  expect(leverage('1')).toBe('#0a84ff');expect(leverage('2')).toBe('#ff3b30');
  const tones=trades.map(trade=>all(tree,`history-${trade.id}-pnl`).find(node=>node.props.tone).props.tone);expect(tones).toEqual(['up','up','down']);
  const source=require('node:fs').readFileSync('packages/hig/native/src/trade-history-list-block.tsx','utf8');expect(source).not.toMatch(/colors\[trade\.side==='long'\?'positive':'negative'\]/);
 });
 it('draws a notice, a footer, a tag before the age, a leverage note and a symbol fallback',()=>{
  const tree=mount({onSelect(){},notice:h(View,{testID:'partial'}),footer:h(View,{testID:'more'}),trades:[{id:'9',name:'Bitcoin',symbol:'BTC',side:'long',leverage:20,leverageNote:'current',pnl:2,time:'2d',tag:'0x22…22'}]});
  const order=host(tree,'history').children.map(child=>child.props.testID);expect(order).toEqual(['history','history-notice','history-rows','history-footer']);
  expect(all(tree,'partial').length).toBeGreaterThan(0);expect(all(tree,'more').length).toBeGreaterThan(0);
  expect(host(tree,'history-9').props.accessibilityLabel).toBe('Bitcoin, Long 20× current, +$2.000, 0x22…22, 2d');
  expect(text(host(tree,'history-9-meta'))).toBe('0x22…22·2d');expect(text(host(tree,'history-9-leverage-note'))).toBe('current');
  expect(host(tree,'history-9').findAll(node=>node.type==='Text').map(text)).toContain('BTC');
 });
 it('shows skeleton rows while loading, an error in place of the rows, and a two-line empty state',()=>{
  let tree=mount({loading:true});const busy=host(tree,'history-loading');expect(busy.props.accessibilityState).toEqual({busy:true});expect(busy.props.accessible).toBe(false);expect(busy.children).toHaveLength(4);expect(host(tree,'history-rows')).toBeUndefined();
  tree=mount({loading:true,loadingLabel:'Loading history'});expect(host(tree,'history-loading').props).toMatchObject({accessible:true,accessibilityLabel:'Loading history'});
  tree=mount({error:'History is unavailable'});const error=host(tree,'history-error');expect(error.props.accessibilityRole).toBe('alert');expect(StyleSheet.flatten(error.props.style).color).toBe(colors.negative);
  tree=mount({trades:[],labels:{...labels,emptyDescription:'Closed trades appear here.'}});expect(host(tree,'history-empty').props.accessibilityLabel).toBe('No closed trades yet, Closed trades appear here.');
 });
 it('renders the rows through the host list with renderList, so a long history is virtualized',()=>{
  const many=Array.from({length:100},(_,index)=>({id:String(index),name:`Asset ${index}`,side:index%2?'short':'long',pnl:index}));
  const renderList=jest.fn(list=>h(FlatList,{data:list.trades,renderItem:list.renderItem,keyExtractor:list.keyExtractor,ItemSeparatorComponent:list.ItemSeparatorComponent,initialNumToRender:10,windowSize:2}));
  const tree=mount({trades:many,onSelect(){},renderList});
  expect(renderList).toHaveBeenCalled();const list=renderList.mock.calls[0][0];expect(list.trades).toBe(many);expect(list.keyExtractor(many[3])).toBe('3');
  const mounted=many.filter(trade=>host(tree,`history-${trade.id}`)).length;expect(mounted).toBeGreaterThan(0);expect(mounted).toBeLessThan(100);
  expect(flat(host(tree,'history'))).toMatchObject({flex:1});expect(flat(host(tree,'history-rows'))).toMatchObject({flex:1});
  // Without listChrome the block keeps its own padded stack around the list, and the list gets only the row helpers.
  expect(flat(host(tree,'history'))).toMatchObject({padding:16,gap:16,flex:1});
  expect(Object.keys(list).sort()).toEqual(['ItemSeparatorComponent','keyExtractor','renderItem','trades']);
  const stacked=mount({renderList,notice:h(View,{testID:'partial'}),footer:h(View,{testID:'more'})});
  expect(host(stacked,'history').children.map(child=>child.props.testID)).toEqual(['history','history-notice','history-rows','history-footer']);
  // Without renderList the block keeps its plain stack.
  expect(flat(host(mount(),'history')).flex).toBeUndefined();
 });
 it('keeps the header fixed above a pinned host list without listChrome, and fills it once the list scrolls (Unreleased)',()=>{
  const renderList=jest.fn(list=>h(FlatList,{data:list.trades,...list}));
  const tree=mount({renderList,stickyHeader:true,notice:h(View,{testID:'partial'}),footer:h(View,{testID:'more'})});
  const list=renderList.mock.calls[0][0];expect(list.ListHeaderComponent).toBeUndefined();expect(list.contentContainerStyle).toBeUndefined();expect(typeof list.onScroll).toBe('function');
  expect(tree.findByType(FlatList).findAll(node=>node.props.testID==='partial').length).toBe(0);
  expect(flat(host(tree,'history-sticky-header')).backgroundColor).toBe('transparent');
  act(()=>{list.onScroll({nativeEvent:{contentOffset:{y:30}}});});expect(flat(host(root.root,'history-sticky-header')).backgroundColor).toBe(colors.background);
 });
 it('hands the host list the header, notice, footer and inset with listChrome, so a self-sizing sheet measures the list alone (Unreleased)',()=>{
  const renderList=jest.fn(list=>h(FlatList,{data:list.trades,...list}));
  const tree=mount({renderList,listChrome:true,onBack(){},notice:h(View,{testID:'partial'}),footer:h(View,{testID:'more'})});
  const list=renderList.mock.calls[0][0];
  expect(list.contentContainerStyle).toEqual({padding:16});expect(list.onScroll).toBeUndefined();
  expect(all(tree,'history-header').length).toBeGreaterThan(0);expect(all(tree,'partial').length).toBeGreaterThan(0);expect(all(tree,'more').length).toBeGreaterThan(0);
  // The header and notice are inside the list, not stacked above it, and the block adds no padding of its own.
  const flatList=tree.findByType(FlatList);expect(flatList.findAll(node=>node.props.testID==='history-header').length).toBeGreaterThan(0);
  expect(flat(host(tree,'history'))).toEqual(expect.not.objectContaining({padding:16}));
  // Pinned, the header stays above the list and fills once the list reports an offset.
  mount({renderList,listChrome:true,stickyHeader:true});const pinned=renderList.mock.calls.at(-1)[0];
  expect(pinned.ListHeaderComponent).toBeNull();expect(typeof pinned.onScroll).toBe('function');
  expect(flat(host(root.root,'history-sticky-header')).backgroundColor).toBe('transparent');
  act(()=>{pinned.onScroll({nativeEvent:{contentOffset:{y:30}}});});expect(flat(host(root.root,'history-sticky-header')).backgroundColor).toBe(colors.background);
 });
 it('formats one trade with its own pnlOptions and pins the header without renderList (Unreleased)',()=>{
  const {ScrollView}=require('react-native');
  const tree=mount({stickyHeader:true,trades:[{id:'a',name:'Amazon',side:'long',pnl:0.00001234,pnlOptions:{style:'currency',currency:'USD',signDisplay:'exceptZero',maximumSignificantDigits:4}}]});
  expect(host(tree,'history-a').props.accessibilityLabel).toBe('Amazon, Long, +$0.00001234');
  expect(tree.findByType(ScrollView).props.stickyHeaderIndices).toEqual([0]);expect(flat(host(tree,'history-sticky-header')).backgroundColor).toBe('transparent');
 });
});
it('shows the host empty text without trades and a host header action',()=>{
 const tree=mount({trades:[],headerAction:h(View,{testID:'filter'})});
 expect(text(all(tree,'history-empty').find(node=>typeof node.type==='string'))).toBe('No closed trades yet');expect(host(tree,'history-rows')).toBeUndefined();expect(all(tree,'filter').length).toBeGreaterThan(0);
});
