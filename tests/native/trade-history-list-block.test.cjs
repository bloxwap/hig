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
 it('keeps 32 above the empty and error lines and none below, so only the block\'s 16 inset sits under the text',()=>{
  const vertical=node=>{const style=flat(node);return [style.paddingTop??style.paddingVertical??0,style.paddingBottom??style.paddingVertical??0];};
  let tree=mount({trades:[]});expect(vertical(host(tree,'history-empty'))).toEqual([32,0]);
  tree=mount({trades:[],labels:{...labels,emptyDescription:'Closed trades appear here.'}});const empty=host(tree,'history-empty');expect(vertical(empty)).toEqual([32,0]);
  expect(empty.findAll(node=>node.type==='Text').map(vertical)).toEqual([[0,0],[0,0]]);
  tree=mount({error:'History is unavailable'});expect(vertical(host(tree,'history-error'))).toEqual([32,0]);
  expect(flat(host(tree,'history')).padding).toBe(16);
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

it('windows a large sticky history with its notice and footer inside the scroller',()=>{
 const history=Array.from({length:250},(_,i)=>({...trades[0],id:String(i)}));
 const select=jest.fn(),{Text,VirtualizedList}=require('react-native');
 const tree=mount({stickyHeader:true,trades:history,onSelect:select,notice:h(Text,null,'Saved history'),footer:h(Text,null,'End of history')});
 const list=tree.findByType(VirtualizedList);
 expect(list.props.data).toBe(history);
 expect(list.props.getItem(history,0)).toBe(null);
 expect(list.props.getItem(history,250)).toBe(history[249]);
 expect(list.props.stickyHeaderIndices).toEqual([0]);
 expect(host(tree,'history-notice')).toBeDefined();expect(host(tree,'history-footer')).toBeDefined();
 const rows=tree.findAll(n=>typeof n.type==='string'&&/^history-\d+$/.test(n.props.testID??''));
 expect(rows.length).toBeGreaterThan(0);expect(rows.length).toBeLessThan(30);expect(host(tree,'history-249')).toBeUndefined();
 act(()=>tree.findAll(n=>n.props.testID==='history-0'&&n.props.onPress)[0].props.onPress());
 expect(select.mock.calls[0][0]).toBe(history[0]);
});

it('reuses unchanged trade rows when the footer or one trade updates',()=>{
 const {Text}=require('react-native'),reads=Array(40).fill(0);
 const item=(index,pnl)=>({...trades[0],id:String(index),get pnl(){reads[index]++;return pnl;}});
 const history=reads.map((_,index)=>item(index,index)),select=jest.fn();
 const tree=(items,footer)=>h(HIGProvider,{reducedMotion:true},h(TradeHistoryListBlock,{labels:{...labels},trades:items,onSelect:select,footer:h(Text,null,footer)}));
 act(()=>{root=render(tree(history,'Loading'));});reads.fill(0);
 act(()=>root.update(tree(history,'Loaded')));expect(reads.every(count=>count===0)).toBe(true);
 const updated=history.slice();updated[12]=item(12,812);act(()=>root.update(tree(updated,'Loaded')));
 expect(reads.filter(Boolean)).toEqual([1]);expect(reads[12]).toBe(1);
});

it('keeps unchanged trade amounts idle when density changes',()=>{
 let optionReads=0,rowReads=0;
 const pnlOptions={style:'currency',currency:'USD',get maximumFractionDigits(){optionReads++;return 2;}};
 const rows=Array.from({length:50},(_,index)=>({...trades[0],id:String(index),get pnl(){rowReads++;return 1.412;}}));
 const child=h(TradeHistoryListBlock,{labels,trades:rows,pnlOptions,testID:'history'});
 const provider=(density,locale)=>h(HIGProvider,{density,locale,reducedMotion:true},child);
 act(()=>{root=render(provider('comfortable','en-US'));});
 expect(rowReads).toBeGreaterThan(0);
 expect(optionReads).toBeGreaterThan(0);
 rowReads=optionReads=0;
 act(()=>root.update(provider('compact','en-US')));
 expect({optionReads,rowReads}).toEqual({optionReads:0,rowReads:0});
 act(()=>root.update(provider('compact','de-DE')));
 expect(host(root.root,'history-0').props.accessibilityLabel).toContain('1,41');
});

it('updates the trade result when a refreshed row reuses edited format options',()=>{
 const options={maximumFractionDigits:1};
 const scene=(time,locale='en-US')=>h(HIGProvider,{locale,reducedMotion:true},h(TradeHistoryListBlock,{labels,testID:'history',trades:[{...trades[0],pnlOptions:options,time}]}));
 act(()=>{root=render(scene('2d'));});
 const reading=()=>text(host(root.root,'history-1-pnl'));
 expect(reading()).toBe('1.4');
 options.maximumFractionDigits=2;
 act(()=>root.update(scene('3d')));
 expect(reading()).toBe('1.41');
 const name=()=>host(root.root,'history-1').props.accessibilityLabel;
 expect(name()).toBe('Amazon, Short 20×, 1.41, 3d');
 act(()=>root.update(scene('4d','de-DE')));
 expect(name()).toBe('Amazon, Short 20×, 1,41, 4d');
});
