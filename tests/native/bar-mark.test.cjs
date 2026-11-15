/** Native BarMark: one horizontally stacked bar on a card, with a title row and a legend. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,View}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {BarMark,barMarkShares,barMarkTones}=require('../../packages/hig/native/src/bar-mark');
const h=React.createElement;
let root;
function mount(props,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,provider,h(BarMark,{title:'iPhone',testID:'storage',...props})));});return root.root;}
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const storage=[{id:'apps',label:'Apps',value:20},{id:'photos',label:'Photos',value:12},{id:'ios',label:'iOS',value:8}];
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('colours segments in the default tone order, and a tone or a host colour overrides it',()=>{
 expect(barMarkTones).toEqual(['positive','info','warning','negative','muted','faint']);
 const seven=Array.from({length:7},(_,index)=>({label:`L${index}`,value:1}));
 let tree=mount({elements:seven});
 expect(seven.map((_,index)=>flat(host(tree,`storage-segment-${index}`)).backgroundColor)).toEqual([colors.positive,colors.info,colors.warning,colors.negative,colors.muted,colors.faint,colors.positive]);
 tree=mount({elements:[{id:'a',label:'A',value:1,tone:'negative'},{id:'b',label:'B',value:1,color:'#123456',tone:'info'},{id:'c',label:'C',value:1}]});
 expect(['a','b','c'].map(id=>flat(host(tree,`storage-segment-${id}`)).backgroundColor)).toEqual([colors.negative,'#123456',colors.warning]);
 // The legend dot matches its segment.
 expect(host(tree,'storage-legend-b').findAll(node=>node.type==='View'&&flat(node).width===8).map(dot=>flat(dot))).toEqual([expect.objectContaining({height:8,borderRadius:4,backgroundColor:'#123456'})]);
});

it('sizes segments by share of the sum, and leaves the rest of a larger total as the empty track',()=>{
 let tree=mount({elements:storage});
 expect(storage.map(element=>flat(host(tree,`storage-segment-${element.id}`)).flexGrow)).toEqual([20,12,8]);expect(host(tree,'storage-track')).toBeUndefined();
 expect(flat(host(tree,'storage-bar'))).toMatchObject({flexDirection:'row',height:24,borderRadius:8,overflow:'hidden',gap:2});
 tree=mount({elements:storage,total:64});
 expect(flat(host(tree,'storage-track'))).toMatchObject({flexGrow:24,backgroundColor:colors.border});
 expect(barMarkShares(storage,64).shares).toEqual([20/64,12/64,8/64]);
 // A total smaller than the sum is ignored: the bar is full.
 expect(barMarkShares(storage,10)).toMatchObject({shares:[0.5,0.3,0.2],rest:0});
});

it('counts negative and non-finite values as zero, keeps a sliver at 3dp, and shows only the track when nothing is used',()=>{
 let tree=mount({elements:[{id:'a',label:'A',value:-5},{id:'b',label:'B',value:Number.NaN},{id:'c',label:'C',value:Infinity},{id:'d',label:'D',value:0.001},{id:'e',label:'E',value:100}]});
 expect(['a','b','c'].map(id=>host(tree,`storage-segment-${id}`))).toEqual([undefined,undefined,undefined]);
 expect(flat(host(tree,'storage-segment-d'))).toMatchObject({minWidth:3,flexGrow:0.001});
 expect(barMarkShares([{label:'A',value:-5},{label:'B',value:5}]).shares).toEqual([0,1]);
 tree=mount({elements:[{id:'a',label:'A',value:0}]});
 expect(host(tree,'storage-segment-a')).toBeUndefined();expect(flat(host(tree,'storage-track')).flexGrow).toBe(1);
 tree=mount({elements:[]});expect(host(tree,'storage-track')).toBeDefined();
});

it('reads each legend item as label, detail and percent share; the bar is hidden from accessibility',()=>{
 let tree=mount({elements:[{id:'apps',label:'Apps',value:20,detail:'20 GB'},{id:'photos',label:'Photos',value:12},{id:'ios',label:'iOS',value:1}],total:64});
 expect(host(tree,'storage-bar').props).toMatchObject({accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants'});
 expect(['apps','photos','ios'].map(id=>host(tree,`storage-legend-${id}`).props.accessibilityLabel)).toEqual(['Apps, 20 GB, 31.3%','Photos, 18.8%','iOS, 1.6%']);
 expect(host(tree,'storage-legend-apps').props.accessible).toBe(true);expect(text(host(tree,'storage-legend-apps'))).toBe('Apps20 GB');
 expect(host(tree,'storage').props.accessibilityLabel).toBeUndefined();
 // The share follows the provider locale.
 tree=mount({elements:storage,total:64},{locale:'de-DE'});
 expect(host(tree,'storage-legend-apps').props.accessibilityLabel).toBe(`Apps, ${new Intl.NumberFormat('de-DE',{style:'percent',maximumFractionDigits:1}).format(20/64)}`);
});

it('without a legend the card carries one label with the title and every reading',()=>{
 const tree=mount({elements:storage,legend:false});
 expect(host(tree,'storage-legend-apps')).toBeUndefined();expect(host(tree,'storage-bar')).toBeDefined();
 expect(host(tree,'storage').props).toMatchObject({accessible:true,accessibilityLabel:'iPhone, Apps, 50%, Photos, 30%, iOS, 20%'});
});

it('draws a string description muted beside the title and renders an element as given',()=>{
 let tree=mount({elements:storage,description:'40 GB of 64 GB'});
 const texts=()=>tree.findAll(node=>node.type==='Text');
 expect(text(texts()[0])).toBe('iPhone');expect(flat(texts()[0]).fontWeight).toBe('600');
 expect(text(texts()[1])).toBe('40 GB of 64 GB');expect(flat(texts()[1]).color).toBe(colors.muted);
 tree=mount({elements:storage,description:h(View,{testID:'custom'})});
 expect(host(tree,'custom')).toBeDefined();expect(text(texts()[1])).toBe('Apps');
 tree=mount({elements:storage});expect(text(texts()[1])).toBe('Apps');
});
it('draws a 12 unit bar when small, and 24 by default',()=>{
 let tree=mount({elements:storage,size:'small'});expect(flat(host(tree,'storage-bar'))).toMatchObject({height:12,borderRadius:6,gap:2});
 tree=mount({elements:storage,size:'default'});expect(flat(host(tree,'storage-bar'))).toMatchObject({height:24,borderRadius:8});
 tree=mount({elements:storage});expect(flat(host(tree,'storage-bar'))).toMatchObject({height:24,borderRadius:8});
});

it('draws no card with surface={false}: a plain view with the same gap, and a track one step above the page',()=>{
 let tree=mount({elements:storage,total:64});
 expect(flat(host(tree,'storage'))).toMatchObject({backgroundColor:colors.surface,gap:12});expect(flat(host(tree,'storage-track')).backgroundColor).toBe(colors.border);
 tree=mount({elements:storage,total:64,surface:false});
 const bare=flat(host(tree,'storage'));expect(bare.gap).toBe(12);expect(bare.minWidth).toBe(0);expect(bare.backgroundColor).toBeUndefined();expect(bare.padding).toBeUndefined();expect(bare.borderRadius).toBeUndefined();
 // Outside the Surface the track reads the page's raised fill, so it stays visible on the page.
 expect(flat(host(tree,'storage-track')).backgroundColor).toBe(colors.nested);
 expect(storage.map(element=>flat(host(tree,`storage-segment-${element.id}`)).flexGrow)).toEqual([20,12,8]);expect(host(tree,'storage-legend-apps').props.accessibilityLabel).toBe('Apps, 31.3%');
 // Without a legend the bare view is still the one accessible element.
 tree=mount({elements:storage,legend:false,surface:false});expect(host(tree,'storage').props.accessible).toBe(true);expect(host(tree,'storage').props.accessibilityLabel).toBe('iPhone, Apps, 50%, Photos, 30%, iOS, 20%');
});
it('takes a live figure as a detail: formatted without an animation engine, or drawn by a renderer from the context',()=>{
 const {BarMarkFigureContext}=require('../../packages/hig/native/src/bar-mark');
 const elements=[{id:'apps',label:'Apps',value:20,detail:{value:12.5,options:{style:'currency',currency:'USD'},suffix:' net'}},{id:'photos',label:'Photos',value:12,detail:'12 GB'},{id:'ios',label:'iOS',value:8,detail:{value:null}}];
 let tree=mount({elements});
 expect(text(host(tree,'storage-detail-apps'))).toBe('$12.50 net');expect(flat(host(tree,'storage-detail-apps')).color).toBe(colors.faint);
 expect(host(tree,'storage-legend-apps').props.accessibilityLabel).toBe('Apps, $12.50 net, 50%');expect(host(tree,'storage-legend-photos').props.accessibilityLabel).toBe('Photos, 12 GB, 30%');expect(host(tree,'storage-legend-ios').props.accessibilityLabel).toBe('iOS, —, 20%');
 tree=mount({elements},{locale:'fr-FR',numberFormat:{currencyDisplay:'narrowSymbol'}});expect(host(tree,'storage-legend-apps').props.accessibilityLabel).toBe('Apps, 12,50 $ net, 50 %');
 const seen=[];const renderer=(figure,props)=>{seen.push([figure.value,props.testID]);return h(View,{testID:'custom'});};
 if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{},h(BarMarkFigureContext.Provider,{value:renderer},h(BarMark,{title:'iPhone',testID:'storage',elements}))));});
 expect(seen).toEqual([[12.5,'storage-detail-apps'],[null,'storage-detail-ios']]);expect(root.root.findAll(node=>node.props.testID==='custom'&&typeof node.type==='string')).toHaveLength(2);
});
