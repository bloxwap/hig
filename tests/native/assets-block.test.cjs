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

test('draws host trailing content before the disc, read through trailingLabel, and clears the query when clearable',()=>{
 const onQuery=jest.fn();const {Text:RNText}=require('react-native');
 let view=mount({assets:[{...assets[0],trailing:h(RNText,{testID:'pnl'},'+$12.50'),trailingLabel:'open position'},assets[1]],query:'b',onQueryChange:onQuery});
 const btc=all(view,'assets-BTC').find(n=>n.props.accessibilityRole==='button');
 expect(btc.props.accessibilityLabel).toBe('Bitcoin, BTC · 40×, open position, Watch');
 const trailing=host(view,'assets-BTC-trailing');
 expect(trailing.props.accessible).toBe(false);expect(trailing.props.importantForAccessibility).toBe('no-hide-descendants');
 expect(text(host(view,'pnl'))).toBe('+$12.50');expect(flat(trailing).flexShrink).toBe(0);
 // The trailing content sits before the signal disc.
 const row=host(view,'assets-BTC'),order=row.children.map(child=>child.props?.testID).filter(Boolean);
 expect(order).toEqual(['assets-BTC-trailing','assets-BTC-signal']);
 expect(has(view,'assets-ETH-trailing')).toBe(false);
 // Without clearable the field has no clear button; with it, the button empties the query.
 expect(has(view,'assets-search-clear')).toBe(false);
 view=mount({clearable:true,query:'b',onQueryChange:onQuery});
 const clear=all(view,'assets-search-clear').find(n=>n.props.onPress);
 expect(clear.props.accessibilityLabel).toBe('Clear search');
 act(()=>clear.props.onPress());expect(onQuery).toHaveBeenCalledWith('');
 view=mount({clearable:true,query:''});expect(has(view,'assets-search-clear')).toBe(false);
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

test('rows are one line each, headingId names the title, and stickyHeader pins the header in the block\'s own scroll view',()=>{
 const {ScrollView}=require('react-native');
 let view=mount({assets:[{id:'LONG',name:'A market with a name far too long for one line',symbol:'LONGSYMBOL',detail:'40×',category:'crypto'}],headingId:'assets-title'});
 const lines=host(view,'assets-LONG').findAll(node=>typeof node.type==='string'&&node.props.numberOfLines!==undefined);
 expect(lines.map(node=>[node.props.numberOfLines,text(node)])).toEqual([[1,'A market with a name far too long for one line'],[1,'LONGSYMBOL · 40×']]);
 expect(view.findAll(node=>node.props.nativeID==='assets-title'&&node.props.accessibilityRole==='header').length).toBeGreaterThan(0);
 // Without stickyHeader the host owns the scrolling.
 // (The category capsules' own horizontal scroller aside.)
 const vertical=tree=>tree.findAllByType(ScrollView).filter(node=>!node.props.horizontal);
 expect(vertical(view)).toHaveLength(0);expect(has(view,'assets-sticky-header')).toBe(false);
 view=mount({stickyHeader:true,stickyHeaderBackground:'#123456'});
 expect(vertical(view)).toHaveLength(1);const scroll=vertical(view)[0];expect(scroll.props.stickyHeaderIndices).toEqual([0]);
 expect(flat(host(view,'assets-sticky-header'))).toMatchObject({paddingTop:16,paddingHorizontal:16,backgroundColor:'transparent'});
 expect(host(view,'assets-sticky-header').findAll(node=>node.props.testID==='assets-header').length).toBeGreaterThan(0);
 act(()=>scroll.props.onScroll({nativeEvent:{contentOffset:{y:40}}}));expect(flat(host(view,'assets-sticky-header')).backgroundColor).toBe('#123456');
 // The search and the list scroll under the pinned header.
 expect(host(view,'assets-sticky-header').findAll(node=>node.props.testID==='assets-search')).toHaveLength(0);expect(has(view,'assets-list')).toBe(true);
 // A host scroll view, such as a sheet library's, takes ScrollView's place.
 const Sheet=props=>h(ScrollView,{...props,testID:'sheet-scroll'});view=mount({stickyHeader:true,scrollComponent:Sheet});expect(has(view,'sheet-scroll')).toBe(true);
 // Without a test ID the pinned header is `assets-sticky-header`.
 act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true},h(AssetsBlock,{assets,categories,onSelect:()=>{},stickyHeader:true})));});expect(has(root.root,'assets-sticky-header')).toBe(true);
});

test('reads the host clock, freezes while paused, and runs no timer while no countdown section is shown',()=>{
 jest.useFakeTimers();const spy=jest.spyOn(global,'setInterval');
 let clock=1_000_000;const now=()=>clock;const opensAt=clock+65_000;
 const cats=[categories[0],{id:'commodities',label:'Commodities',status:{label:'OPEN'},opensAt}];
 const tree=props=>h(HIGProvider,{reducedMotion:true},h(AssetsBlock,{testID:'assets',assets,categories:cats,onSelect:()=>{},now,...props}));
 act(()=>{root=render(tree({category:'crypto'}));});
 expect(spy).not.toHaveBeenCalled();
 act(()=>root.update(tree({category:''})));
 const badge=()=>text(host(root.root,'assets-status-commodities'));
 expect(badge()).toBe('Opens in 0:01:05');expect(spy).toHaveBeenCalledTimes(1);
 act(()=>{clock+=1000;jest.advanceTimersByTime(1000);});expect(badge()).toBe('Opens in 0:01:04');
 act(()=>root.update(tree({paused:true})));
 act(()=>{clock+=5000;jest.advanceTimersByTime(5000);});expect(badge()).toBe('Opens in 0:01:04');expect(spy).toHaveBeenCalledTimes(1);
 act(()=>root.update(tree({})));expect(badge()).toBe('Opens in 0:00:59');
 // Paused past the opening, a host re-render (new assets) keeps the frozen text; unpausing shows the status.
 act(()=>root.update(tree({paused:true})));clock+=120_000;
 act(()=>root.update(tree({paused:true,assets:[...assets]})));expect(badge()).toBe('Opens in 0:00:59');
 act(()=>root.update(tree({})));expect(badge()).toBe('OPEN');
 spy.mockRestore();jest.useRealTimers();
});

test('draws emptyAction under the empty text only while the list is empty and not loading',()=>{
 const press=jest.fn();const action={label:'Browse all markets',onPress:press};
 let view=mount({view:'positions',category:'commodities',emptyAction:action});
 const button=all(view,'assets-empty-action').find(n=>n.props.accessibilityRole==='button');
 expect(button.props.accessibilityState.disabled).toBe(false);expect(text(host(view,'assets-empty-action'))).toBe('Browse all markets');
 act(()=>button.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));expect(press).toHaveBeenCalledTimes(1);
 view=mount({view:'positions',category:'commodities',emptyAction:{...action,testID:'browse-all'}});expect(has(view,'browse-all')).toBe(true);
 view=mount({assets:[],loading:true,emptyAction:action});expect(has(view,'assets-empty-action')).toBe(false);
 view=mount({emptyAction:action});expect(has(view,'assets-empty-action')).toBe(false);
});

test('the empty disc steps up to the raised fill on the selected or pressed row',()=>{
 let view=mount({selectedId:'XRP'});
 const raised=flat(host(view,'assets-XRP-signal')).backgroundColor;
 expect(raised).not.toBe(colors.surface);expect(raised).not.toBe(flat(host(view,'assets-XRP')).backgroundColor);
 view=mount();expect(flat(host(view,'assets-XRP-signal')).backgroundColor).toBe(colors.surface);
});

test('autoFocusSearch focuses the search field on mount',()=>{
 const {TextInput}=require('react-native');
 let view=mount();expect(view.findByType(TextInput).props.autoFocus).toBeFalsy();
 view=mount({autoFocusSearch:true});expect(view.findByType(TextInput).props.autoFocus).toBe(true);
});

test('scrolls the selected category capsule fully into view on mount and on change, through a host filterScrollComponent',()=>{
 const {ScrollView}=require('react-native');const scrollTo=jest.fn();
 const Host=React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>({scrollTo}));return h(ScrollView,{...props,testID:'host-filter'});});
 const view=mount({filterScrollComponent:Host,defaultCategory:'stocks'});
 const scroller=host(view,'host-filter');
 const chips=view.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onLayout==='function'&&typeof n.props.onPress==='function');
 const layout=(node,x,width)=>act(()=>node.props.onLayout({nativeEvent:{layout:{x,y:0,width,height:40}}}));
 // All, Crypto, Commodities, Stocks at 100 wide with 8 between, in a 260-wide row: Stocks (324 to 424) ends the view.
 chips.forEach((chip,index)=>layout(chip,index*108,100));
 act(()=>scroller.props.onLayout({nativeEvent:{layout:{x:0,y:0,width:260,height:40}}}));
 expect(scrollTo).toHaveBeenLastCalledWith({x:164,animated:false});
 // Choosing a capsule left of the view scrolls back to it.
 act(()=>chips[1].props.onPress());expect(scrollTo).toHaveBeenLastCalledWith({x:108,animated:false});
 // A capsule already whole on screen does not scroll.
 scrollTo.mockClear();act(()=>chips[2].props.onPress());expect(scrollTo).not.toHaveBeenCalled();
});
