/** Native AssetsBlock: header, search, category capsules, views, then markets in sections by category with their signal discs. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AssetsBlock,filterAssets}=require('../../packages/hig/native/src/assets-block');
const blocks=require('../../packages/hig/native/src/blocks');
const h=React.createElement;
let root;
const categories=[{id:'crypto',label:'Crypto',status:{label:'OPEN'}},{id:'commodities',label:'Commodities',status:{label:'OPEN'}},{id:'stocks',label:'Stocks'}];
const assets=[
 {id:'BTC',name:'Bitcoin',symbol:'BTC',detail:'40×',category:'crypto',signal:'watch',position:true},
 {id:'ETH',name:'Ethereum',symbol:'ETH',detail:'25×',category:'crypto',signal:'up'},
 {id:'XRP',name:'Ripple',symbol:'XRP',category:'crypto',signal:null},
 {id:'NOSIG',name:'Quiet',symbol:'QT',category:'crypto'},
 {id:'GOLD',name:'Gold',symbol:'GOLD',category:'commodities',signal:null,keywords:'XAU'},
];
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(AssetsBlock,{testID:'assets',assets,categories,onSelect:()=>{},...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});

test('filterAssets groups by category and filters by view, category and query',()=>{
 const ids=sections=>sections.map(s=>[s.category.id,s.assets.map(a=>a.id)]);
 expect(ids(filterAssets(assets,categories))).toEqual([['crypto',['BTC','ETH','XRP','NOSIG']],['commodities',['GOLD']]]);
 expect(ids(filterAssets(assets,categories,{view:'positions'}))).toEqual([['crypto',['BTC']]]);
 expect(ids(filterAssets(assets,categories,{view:'trend'}))).toEqual([['crypto',['BTC','ETH']]]);
 expect(ids(filterAssets(assets,categories,{query:'xau'}))).toEqual([['commodities',['GOLD']]]);
});

test('draws sections with the status read in the heading, and rows named by market, symbol line and signal',()=>{
 const select=jest.fn(),close=jest.fn();
 const view=mount({onSelect:select,onClose:close,selectedId:'BTC'});
 expect(has(view,'assets-section-stocks')).toBe(false);
 const header=view.findAll(n=>n.props.accessibilityRole==='header'&&n.props.accessibilityLabel==='Crypto, OPEN');
 expect(header.length).toBeGreaterThan(0);
 expect(text(host(view,'assets-status-commodities'))).toBe('OPEN');
 const btc=all(view,'assets-BTC').find(n=>n.props.accessibilityRole==='button');
 expect(btc.props.accessibilityLabel).toBe('Bitcoin, BTC · 40×, Watch');
 expect(btc.props.accessibilityState).toEqual({selected:true,disabled:false});
 expect(all(view,'assets-ETH')[0].props.accessibilityLabel).toBe('Ethereum, ETH · 25×, Rising');
 act(()=>btc.props.onPress());expect(select).toHaveBeenCalledWith(assets[0]);
 expect(flat(host(view,'assets-BTC-signal')).backgroundColor).toBe(`${colors.warning}26`);
 expect(flat(host(view,'assets-ETH-signal')).backgroundColor).toBe(`${colors.positive}26`);
 expect(flat(host(view,'assets-XRP-signal')).backgroundColor).toBe(colors.surface);
 expect(has(view,'assets-NOSIG-signal')).toBe(false);
 act(()=>all(view,'assets-close').find(n=>n.props.onPress).props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));
 expect(close).toHaveBeenCalled();
});

test('views and search narrow the list and show the right empty text; controlled state and translations apply',()=>{
 const onView=jest.fn();
 let view=mount({onViewChange:onView});
 const segmented=all(view,'assets-view')[0];
 act(()=>segmented.props.onValueChange('positions'));
 expect(onView).toHaveBeenCalledWith('positions');
 expect(has(view,'assets-ETH')).toBe(false);
 view=mount({view:'trend',category:'commodities'});
 expect(text(host(view,'assets-empty'))).toBe('No trending markets');
 view=mount({query:'zzz'});
 expect(text(host(view,'assets-empty'))).toBe('No results');
 view=root.root;act(()=>root.update(h(HIGProvider,{reducedMotion:true,messages:{signalUp:'En hausse',assets:'Actifs'}},h(blocks.AssetsBlock,{testID:'assets',assets,categories,onSelect:()=>{},view:'trend'}))));
 expect(all(root.root,'assets-ETH')[0].props.accessibilityLabel).toBe('Ethereum, ETH · 25×, En hausse');
 expect(root.root.findAll(n=>typeof n.type==='string'&&n.props.accessibilityRole==='header').some(n=>text(n)==='Actifs')).toBe(true);
});

test('counts down to a legacy market reopening, reads it in words, then falls back to status',()=>{
 jest.useFakeTimers();jest.setSystemTime(new Date('2026-11-16T12:00:00Z'));
 const opensAt=Date.now()+((2*60+14)*60+33)*1000;
 const view=mount({categories:[categories[0],{id:'commodities',label:'Commodities',status:{label:'OPEN'},opensAt}]});
 expect(text(host(view,'assets-status-commodities'))).toBe('Opens in 2:14:33');
 expect(view.findAll(n=>n.props.accessibilityRole==='header'&&n.props.accessibilityLabel==='Commodities, Opens in 2 hours 14 minutes').length).toBeGreaterThan(0);
 act(()=>{jest.advanceTimersByTime(1000);});
 expect(text(host(root.root,'assets-status-commodities'))).toBe('Opens in 2:14:32');
 act(()=>{jest.setSystemTime(opensAt+1);jest.advanceTimersByTime(1000);});
 expect(text(host(root.root,'assets-status-commodities'))).toBe('OPEN');
 jest.useRealTimers();
});
