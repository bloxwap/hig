/** Native ManagePosition: header, margin and notional under the share left before liquidation, the price corridor, the actions, then the position row. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ManagePosition,positionCorridor}=require('../../packages/hig/native/src/manage-position');
const blocks=require('../../packages/hig/native/src/blocks');
const {BarMark}=require('../../packages/hig/native/src/bar-mark');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
// The host owns every trading word.
const labels={title:'Manage Position',margin:'Margin',notional:'Notional',liquidation:'Liquidation',toLiquidation:percent=>`${percent} to liquidation`,mark:'Mark',entry:'Entry',long:'Long',short:'Short'};
const base={labels,side:'long',entry:64700,mark:64696,liquidation:63082,margin:10,notional:399.98,actions:[]};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(ManagePosition,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const bars=view=>view.findAllByType(BarMark);
const flows=(view,id)=>all(view,id)[0].findAllByType(AnimatedNumberReadout);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('measures the distance left before liquidation for long and short positions',()=>{
 // Long in drawdown: 4 of the 1618 between entry and liquidation are gone.
 expect(positionCorridor({side:'long',entry:64700,mark:64696,liquidation:63082})).toEqual({total:1618,buffer:1614,drawdown:4,share:1614/1618});
 // Short in drawdown: the mark rose towards a liquidation above entry.
 expect(positionCorridor({side:'short',entry:100,mark:105,liquidation:120})).toEqual({total:20,buffer:15,drawdown:5,share:0.75});
 // In profit the whole span remains.
 expect(positionCorridor({side:'long',entry:100,mark:130,liquidation:80})).toEqual({total:20,buffer:20,drawdown:0,share:1});
 expect(positionCorridor({side:'short',entry:100,mark:70,liquidation:120})).toEqual({total:20,buffer:20,drawdown:0,share:1});
 // Past liquidation nothing remains.
 expect(positionCorridor({side:'long',entry:100,mark:70,liquidation:80})).toEqual({total:20,buffer:0,drawdown:20,share:0});
 // Unknown prices, and a liquidation on the wrong side of entry, have no corridor.
 const none={total:0,buffer:0,drawdown:0,share:null};
 expect(positionCorridor({side:'long',entry:100,mark:null,liquidation:80})).toEqual(none);expect(positionCorridor({side:'long',entry:100,mark:99})).toEqual(none);
 expect(positionCorridor({side:'long',entry:100,mark:99,liquidation:Number.NaN})).toEqual(none);
 expect(positionCorridor({side:'long',entry:100,mark:99,liquidation:120})).toEqual(none);expect(positionCorridor({side:'short',entry:100,mark:101,liquidation:80})).toEqual(none);
});

it('shows the host title as the heading, Back only with onBack, and the host action on the trailing edge',()=>{
 let view=mount();
 expect(text(host(view,'manage-title'))).toBe('Manage Position');expect(host(view,'manage-title').props.accessibilityRole).toBe('header');expect(has(view,'manage-back')).toBe(false);
 const back=jest.fn();view=mount({onBack:back,headerAction:h(View,{testID:'share'})});
 expect(has(view,'share')).toBe(true);const button=all(view,'manage-back')[0];expect(button.props.label??button.props.accessibilityLabel).toBe('Back');
 act(()=>{all(view,'manage-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 expect(blocks.ManagePosition).toBe(ManagePosition);expect(blocks.positionCorridor).toBe(positionCorridor);
});

it('titles the first card with the mode, splits its bar between margin and notional, and reads the share left before liquidation',()=>{
 let view=mount({mode:'Demo'});
 expect(bars(view).map(bar=>bar.props.testID)).toEqual(['manage-margin','manage-liquidation']);
 expect(bars(view)[0].props.title).toBe('Demo');expect(bars(view)[0].props.total).toBeUndefined();
 expect(bars(view)[0].props.elements).toEqual([{id:'margin',label:'Margin',value:10,detail:'$10.00',tone:'info'},{id:'notional',label:'Notional',value:expect.closeTo(389.98,6),detail:'$399.98',tone:'positive'}]);
 expect(has(view,'manage-margin-segment-margin')).toBe(true);expect(has(view,'manage-margin-segment-notional')).toBe(true);
 // The host sentence keeps its words; only the percent is a live number, and the sentence is the accessible reading.
 const sentence=host(view,'manage-to-liquidation');expect(sentence.props.accessibilityLabel).toBe('99.8% to liquidation');
 expect(bars(view)[0].findAll(node=>node.props.testID==='manage-to-liquidation').length).toBeGreaterThan(0);
 expect(flows(view,'manage-to-liquidation')).toHaveLength(1);expect(flows(view,'manage-to-liquidation')[0].props).toMatchObject({suffix:'%',options:{maximumFractionDigits:1}});expect(flows(view,'manage-to-liquidation')[0].props.value).toBeCloseTo(99.75,1);
 expect(sentence.findAll(node=>node.type==='Text'&&node.props.children===' to liquidation')).toHaveLength(1);
 // Word order belongs to the host: the percent can come last.
 view=mount({labels:{...labels,toLiquidation:percent=>`Avant liquidation ${percent}`}});expect(host(view,'manage-to-liquidation').props.accessibilityLabel).toBe('Avant liquidation 99.8%');
 // Without a mode the card takes the margin label; a margin above the notional leaves the notional part empty, and an unknown notional reads as a dash.
 view=mount();expect(bars(view)[0].props.title).toBe('Margin');
 view=mount({margin:500});expect(bars(view)[0].props.elements[1]).toMatchObject({value:0,detail:'$399.98'});
 view=mount({notional:Number.NaN});expect(bars(view)[0].props.elements[1]).toMatchObject({value:0,detail:'—'});
});

it('draws the corridor from liquidation to entry with the three prices, and turns negative under a quarter left',()=>{
 let view=mount();
 expect(bars(view)[1].props).toMatchObject({title:'Liquidation',total:1618,elements:[
  {id:'liquidation',label:'Liquidation',value:0,detail:'$63,082',tone:'negative'},
  {id:'mark',label:'Mark',value:1614,detail:'$64,696',tone:'positive'},
  {id:'entry',label:'Entry',value:4,detail:'$64,700',tone:'muted'},
 ]});
 expect(bars(view)[1].props.description).toBeUndefined();expect(host(view,'manage-to-liquidation').props.accessibilityLabel).toBe('99.8% to liquidation');
 // Exactly a quarter left is still positive; below it the remaining distance is negative.
 view=mount({entry:100,mark:85,liquidation:80});expect(bars(view)[1].props.elements[1]).toMatchObject({value:5,tone:'positive'});expect(host(view,'manage-to-liquidation').props.accessibilityLabel).toBe('25% to liquidation');
 view=mount({entry:100,mark:84,liquidation:80});expect(bars(view)[1].props.elements[1]).toMatchObject({value:4,tone:'negative'});expect(bars(view)[1].props.elements[2]).toMatchObject({value:16});
 // A short reads the same way from the other side, and the host can format prices.
 view=mount({side:'short',entry:0.5,mark:0.55,liquidation:0.7,priceOptions:{style:'currency',currency:'USD',maximumFractionDigits:4}});
 expect(bars(view)[1].props.elements.map(element=>element.detail)).toEqual(['$0.70','$0.55','$0.50']);expect(bars(view)[1].props.elements[1].value).toBeCloseTo(0.15,10);
 // Unknown prices: no corridor, a dash for the price and for the sentence, and no number rolling in from zero.
 view=mount({mark:null,liquidation:null});
 expect(bars(view)[1].props.total).toBeUndefined();expect(bars(view)[1].props.elements.map(element=>[element.value,element.detail])).toEqual([[0,'—'],[0,'—'],[0,'$64,700']]);
 expect(flows(view,'manage-to-liquidation')).toHaveLength(0);expect(text(host(view,'manage-to-liquidation'))).toBe('— to liquidation');
});

it('keeps the same live numbers when the figures change',()=>{
 mount();const view=root.root,left=flows(view,'manage-to-liquidation')[0];
 act(()=>{root.update(h(HIGProvider,{reducedMotion:true},h(ManagePosition,{...base,mark:64000,notional:410})));});
 expect(flows(root.root,'manage-to-liquidation')[0]).toBe(left);expect(bars(root.root)[0].props.elements[1]).toMatchObject({value:400,detail:'$410.00'});
 expect(host(root.root,'manage-to-liquidation').props.accessibilityLabel).toBe('56.7% to liquidation');
});

it('lists the host actions in order as capsule rows that report a press, and leaves them out when there are none',()=>{
 expect(has(mount(),'manage-actions')).toBe(false);
 const stop=jest.fn(),take=jest.fn(),close=jest.fn();
 const view=mount({actions:[{id:'stop',label:'Stop Loss',onSelect:stop},{id:'take',label:'Take Profit',onSelect:take,disabled:true},{id:'close',label:'Close',onSelect:close}]});
 const rows=host(view,'manage-actions').findAll(node=>typeof node.type==='string'&&String(node.props.testID).startsWith('manage-action-'));
 expect(rows.map(row=>[row.props.testID,text(row.findAll(node=>node.type==='Text')[0])])).toEqual([['manage-action-stop','Stop Loss'],['manage-action-take','Take Profit'],['manage-action-close','Close']]);
 expect(rows.map(row=>row.props.accessibilityRole)).toEqual(['button','button','button']);
 expect(flat(rows[0])).toMatchObject({flexDirection:'row',minHeight:48,borderRadius:9999,paddingHorizontal:16,backgroundColor:nativeSrgb.surface});expect(flat(host(view,'manage-actions'))).toMatchObject({gap:8,marginTop:16});
 const press=id=>{const pressable=all(view,`manage-action-${id}`).find(node=>'onPress' in node.props);if(!pressable.props.disabled)act(()=>{pressable.props.onPress({});});return pressable;};
 press('stop');press('close');expect(stop).toHaveBeenCalledTimes(1);expect(close).toHaveBeenCalledTimes(1);
 expect(press('take').props.disabled).toBe(true);expect(take).not.toHaveBeenCalled();expect(rows[1].props.accessibilityState).toMatchObject({disabled:true});
});

it('shows the position row: direction, leverage and size, with profit and loss toned by its sign',()=>{
 expect(has(mount(),'manage-position-row')).toBe(false);
 // Long with a loss: the arrow points up in the up colour, the loss is in the down colour.
 let view=mount({position:{name:'Bitcoin',leverage:40,size:0.006182,pnl:-0.0247,pnlPercent:-0.0025}});
 const row=()=>host(view,'manage-position-row');
 expect(row().props.accessibilityLabel).toBe('Bitcoin, Long, 40×, 0.006182, -$0.0247, -0.25%');
 expect(text(host(view,'manage-position-side'))).toBe('↑');expect(flat(host(view,'manage-position-side')).color).toBe(nativeSrgb.buy);expect(text(host(view,'manage-position-leverage'))).toBe('40×');
 expect(flows(view,'manage-position-size')[0]??all(view,'manage-position-size')[0]).toBeDefined();
 const pnl=view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='manage-position-pnl'),share=view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='manage-position-pnl-percent');
 expect(pnl.props).toMatchObject({value:-0.0247,tone:'down'});expect(share.props).toMatchObject({value:-0.0025,tone:'muted'});
 expect(flat(row())).toMatchObject({minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:nativeSrgb.surface,marginTop:16});
 // Without artwork the avatar shows the first letters of the name.
 expect(row().findAll(node=>node.type==='Text'&&node.props.children==='Bit')).toHaveLength(1);
 // Short with a gain: the arrow points down in the down colour, the gain is in the up colour.
 view=mount({side:'short',entry:100,mark:90,liquidation:120,position:{name:'Ether',icon:h(View,{testID:'eth-art'}),leverage:5,size:2,pnl:20,pnlPercent:0.1}});
 expect(row().props.accessibilityLabel).toBe('Ether, Short, 5×, 2, +$20.00, +10.00%');expect(has(view,'eth-art')).toBe(true);
 expect(text(host(view,'manage-position-side'))).toBe('↓');expect(flat(host(view,'manage-position-side')).color).toBe(nativeSrgb.sell);
 expect(view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='manage-position-pnl').props.tone).toBe('up');
 // A flat or unknown result is not toned, and optional figures can be left out.
 view=mount({position:{name:'Solana',pnl:0}});expect(view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='manage-position-pnl').props.tone).toBe('text');
 expect(row().props.accessibilityLabel).toBe('Solana, Long, $0.00');expect(has(view,'manage-position-leverage')).toBe(false);expect(has(view,'manage-position-pnl-percent')).toBe(false);
});
