/** Native TradeHistoryDetailCard: header, the asset with its side, the net result, the host's rows, then the host's actions side by side. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {TradeHistoryDetailCard}=require('../../packages/hig/native/src/trade-history-detail-card');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
// The host owns every trading word.
const labels={title:'Trade',netPnl:'Net PnL',onMargin:percent=>`${percent} on margin`,long:'Long',short:'Short'};
const details=[{label:'Entry',value:267.6,options:{style:'currency',currency:'USD'}},{label:'Size',value:3.734,suffix:' AMZN',options:{maximumFractionDigits:6}},{label:'Held',value:'38m 20s'}];
const base={labels,name:'Amazon',side:'short',leverage:20,pnl:1.418,pnlPercent:0.0284,details};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(TradeHistoryDetailCard,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const flows=(view,id)=>all(view,id)[0].findAllByType(AnimatedNumberReadout);
const figure=view=>view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='trade-pnl-value');
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('shows the host title as the heading, Back only with onBack, and the host action on the trailing edge',()=>{
 let view=mount();expect(text(host(view,'trade-title'))).toBe('Trade');expect(host(view,'trade-title').props.accessibilityRole).toBe('header');expect(has(view,'trade-back')).toBe(false);
 const back=jest.fn();view=mount({onBack:back,headerAction:h(View,{testID:'share'})});
 const control=view.findAll(node=>node.props.testID==='trade-back'&&typeof node.props.onPress==='function')[0];expect(control.props.label??control.props.accessibilityLabel).toBe('Back');
 act(()=>control.props.onPress());expect(back).toHaveBeenCalledTimes(1);expect(has(host(view,'trade-header'),'share')).toBe(true);
 expect(blocks.TradeHistoryDetailCard).toBe(TradeHistoryDetailCard);
});
it('shows the asset with an arrow and the host side word in the direction colour, then the leverage',()=>{
 let view=mount();const row=host(view,'trade-asset');
 expect(row.props.accessibilityLabel).toBe('Amazon, Short, 20×');expect(flat(row)).toMatchObject({minHeight:56,borderRadius:28,paddingStart:8,paddingEnd:16,backgroundColor:nativeSrgb.surface});
 expect(text(host(view,'trade-side-arrow'))).toBe('↓');expect(flat(host(view,'trade-side-arrow')).color).toBe(nativeSrgb.sell);
 expect(text(host(view,'trade-side'))).toBe('Short');expect(flat(host(view,'trade-side'))).toMatchObject({color:nativeSrgb.sell,fontWeight:'600',textTransform:'uppercase'});
 expect(text(host(view,'trade-leverage'))).toBe('20×');expect(flat(host(view,'trade-leverage')).color).toBe(nativeSrgb.muted);
 // Without artwork the avatar shows the first letters of the name.
 expect(row.findAll(node=>node.type==='Text'&&text(node)==='Ama')).toHaveLength(1);
 view=mount({side:'long',leverage:undefined,icon:'https://example.com/amzn.png'});
 expect(host(view,'trade-asset').props.accessibilityLabel).toBe('Amazon, Long');expect(text(host(view,'trade-side-arrow'))).toBe('↑');expect(flat(host(view,'trade-side')).color).toBe(nativeSrgb.buy);expect(has(view,'trade-leverage')).toBe(false);
 expect(host(view,'trade-asset').findAll(node=>node.type==='Image')[0].props.source).toEqual({uri:'https://example.com/amzn.png'});
 view=mount({icon:h(View,{testID:'art'})});expect(has(host(view,'trade-asset'),'art')).toBe(true);
});
it('reads the net result as the figure, toned for a gain or a loss, under the host caption',()=>{
 let view=mount();const card=host(view,'trade-pnl');
 expect(flat(card)).toMatchObject({alignItems:'center',paddingVertical:24,gap:8,backgroundColor:nativeSrgb.surface});
 const caption=card.findAll(node=>node.type==='Text'&&text(node)==='Net PnL')[0];expect(flat(caption)).toMatchObject({fontSize:12,lineHeight:18,fontWeight:'600',color:nativeSrgb.muted,textTransform:'uppercase',letterSpacing:0.5});
 expect(figure(view).props).toMatchObject({value:1.418,tone:'up',options:{style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4}});expect(flat(figure(view))).toMatchObject({fontSize:40,lineHeight:48,fontWeight:'700'});
 view=mount({pnl:-4.2});expect(figure(view).props.tone).toBe('down');
 view=mount({pnl:0});expect(figure(view).props.tone).toBe('text');
 view=mount({pnl:null});expect(figure(view).props).toMatchObject({value:null,tone:'text'});
});
it('keeps the host wording of the return on margin around a live number, in the tone of the figure',()=>{
 let view=mount();const sentence=host(view,'trade-pnl-percent');
 expect(sentence.props.accessibilityLabel).toBe('+2.84% on margin');expect(flows(view,'trade-pnl-percent')).toHaveLength(1);
 expect(flows(view,'trade-pnl-percent')[0].props).toMatchObject({value:0.0284,tone:'up',options:{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'}});
 expect(sentence.findAll(node=>node.type==='Text'&&node.props.children===' on margin')).toHaveLength(1);
 // Another word order, and a loss.
 view=mount({pnl:-1,pnlPercent:-0.02,labels:{...labels,onMargin:percent=>`Sur marge : ${percent}`}});
 expect(host(view,'trade-pnl-percent').props.accessibilityLabel).toBe('Sur marge : -2.00%');expect(flows(view,'trade-pnl-percent')[0].props.tone).toBe('down');
 // Unknown is a plain sentence with the dash; not given, there is no line.
 view=mount({pnlPercent:null});expect(flows(view,'trade-pnl-percent')).toHaveLength(0);expect(text(host(view,'trade-pnl-percent'))).toBe('— on margin');
 view=mount({pnlPercent:undefined});expect(has(view,'trade-pnl-percent')).toBe(false);
});
it('lists the host rows: a number is a live readout with its format and affixes, a string is drawn as given',()=>{
 let view=mount();const card=host(view,'trade-details');expect(flat(card)).toMatchObject({gap:12,backgroundColor:nativeSrgb.surface});
 const live=card.findAllByType(AnimatedNumberReadout);expect(live.map(flow=>flow.props.value)).toEqual([267.6,3.734]);
 expect(live[0].props).toMatchObject({options:{style:'currency',currency:'USD'},tone:'text'});expect(live[1].props).toMatchObject({suffix:' AMZN',options:{maximumFractionDigits:6}});
 expect(host(view,'trade-detail-Held').findAllByType(AnimatedNumberReadout)).toHaveLength(0);
 expect(host(view,'trade-detail-Held').findAll(node=>node.type==='Text').map(text)).toEqual(['Held','38m 20s']);
 expect(host(view,'trade-detail-Entry').findAll(node=>node.type==='Text'&&text(node)==='Entry').map(node=>flat(node).color)).toEqual([nativeSrgb.muted]);
 expect(flat(host(view,'trade-detail-Entry'))).toMatchObject({flexDirection:'row',justifyContent:'space-between'});
 view=mount({details:[]});expect(has(view,'trade-details')).toBe(false);
});
it('puts the host actions side by side in order, secondary unless told otherwise, and leaves the row out without any',()=>{
 let view=mount();expect(has(view,'trade-actions')).toBe(false);
 const save=jest.fn(),share=jest.fn();
 view=mount({actions:[{id:'save',label:'Save image',onSelect:save},{id:'share',label:'Share',onSelect:share,intent:'primary'},{id:'export',label:'Export',onSelect:()=>{},disabled:true,busy:true}]});
 const row=host(view,'trade-actions');expect(flat(row)).toMatchObject({flexDirection:'row',gap:8,marginTop:16});
 const buttons=row.findAllByType(Button);expect(buttons.map(node=>[node.props.testID,node.props.intent,node.props.children])).toEqual([['trade-action-save','secondary','Save image'],['trade-action-share','primary','Share'],['trade-action-export','secondary','Export']]);
 expect(buttons.every(node=>node.props.fullWidth===true)).toBe(true);expect(buttons.map(node=>flat(node.parent).flex)).toEqual([1,1,1]);
 expect(button(view,'trade-action-export').props).toMatchObject({disabled:true,busy:true});
 act(()=>button(view,'trade-action-save').props.onPress());act(()=>button(view,'trade-action-share').props.onPress());expect(save).toHaveBeenCalledTimes(1);expect(share).toHaveBeenCalledTimes(1);
});
