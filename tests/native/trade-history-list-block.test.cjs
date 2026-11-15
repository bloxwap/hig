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
it('shows the host empty text without trades and a host header action',()=>{
 const tree=mount({trades:[],headerAction:h(View,{testID:'filter'})});
 expect(text(all(tree,'history-empty').find(node=>typeof node.type==='string'))).toBe('No closed trades yet');expect(host(tree,'history-rows')).toBeUndefined();expect(all(tree,'filter').length).toBeGreaterThan(0);
});
