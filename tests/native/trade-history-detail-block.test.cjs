/** Native TradeHistoryDetailBlock: header, the asset with its side, the net result, the host's rows, then the host's actions side by side. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {TradeHistoryDetailBlock}=require('../../packages/hig/native/src/trade-history-detail-block');
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
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(TradeHistoryDetailBlock,{...base,...props})));});return root.root;}
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
 expect(blocks.TradeHistoryDetailBlock).toBe(TradeHistoryDetailBlock);
});
it('shows the asset with an arrow and the host side word in the direction colour, then the leverage',()=>{
 let view=mount();const row=host(view,'trade-asset');
 expect(row.props.accessibilityLabel).toBe('Amazon, Short, 20×');
 // One centred line on the screen, not a capsule.
 expect(flat(row)).toMatchObject({flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:16});expect(flat(row).backgroundColor).toBeUndefined();expect(flat(row).borderRadius).toBeUndefined();
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
it('reads the net result as the figure, toned for a gain or a loss, named by the host caption without drawing it or a card',()=>{
 let view=mount();const card=host(view,'trade-pnl');
 expect(flat(card)).toMatchObject({alignItems:'center',gap:4});expect(flat(card).backgroundColor).toBeUndefined();expect(flat(card).paddingVertical).toBeUndefined();
 expect(card.findAll(node=>node.type==='Text'&&text(node)==='Net PnL')).toHaveLength(0);expect(figure(view).props.label).toBe('Net PnL');
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
it('lists the host figures three to a line, a label over its value: a number is a live readout with its format and affixes, a string is drawn as given',()=>{
 let view=mount();const card=host(view,'trade-details');expect(flat(card)).toMatchObject({flexDirection:'row',flexWrap:'wrap',rowGap:16,marginTop:20});expect(flat(card).backgroundColor).toBeUndefined();
 const live=card.findAllByType(AnimatedNumberReadout);expect(live.map(flow=>flow.props.value)).toEqual([267.6,3.734]);
 expect(live[0].props).toMatchObject({options:{style:'currency',currency:'USD'},tone:'text'});expect(live[1].props).toMatchObject({suffix:' AMZN',options:{maximumFractionDigits:6}});
 expect(host(view,'trade-detail-Held').findAllByType(AnimatedNumberReadout)).toHaveLength(0);
 expect(host(view,'trade-detail-Held').findAll(node=>node.type==='Text').map(text)).toEqual(['Held','38m 20s']);
 expect(host(view,'trade-detail-Entry').findAll(node=>node.type==='Text'&&text(node)==='Entry').map(node=>flat(node).color)).toEqual([nativeSrgb.muted]);
 expect(flat(host(view,'trade-detail-Entry'))).toMatchObject({width:'50%',gap:2});
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
it('draws one bar from entry to exit without a card in place of two rows, and none without both prices',()=>{
 const {BarPnl}=require('../../packages/hig/native/src/bar-pnl');
 let view=mount();expect(view.findAllByType(BarPnl)).toHaveLength(0);
 view=mount({entry:267.6});expect(view.findAllByType(BarPnl)).toHaveLength(0);
 view=mount({labels:{...labels,entry:'Entry',exit:'Exit'},entry:267.6,exit:267.18,priceOptions:{style:'currency',currency:'USD'}});
 expect(view.findByType(BarPnl).props).toEqual({testID:'trade-bar',surface:false,fit:true,side:'short',entry:267.6,mark:267.18,labels:{entry:'Entry',mark:'Exit',liquidation:''},priceOptions:{style:'currency',currency:'USD'}});
});
describe('host slots (Unreleased)',()=>{
 it('draws a badge beside the title, read with it, and leaves the plain title without one',()=>{
  let view=mount({badge:'Demo'});
  const heading=all(view,'trade-header')[0].findAll(node=>node.props.accessibilityRole==='header'&&typeof node.type==='string')[0];
  expect(heading.props.accessibilityLabel).toBe('Trade, Demo');expect(text(host(view,'trade-badge'))).toBe('Demo');expect(host(view,'trade-title').props.accessible).toBe(false);
  view=mount();expect(host(view,'trade-badge')).toBeUndefined();expect(host(view,'trade-title').props.accessibilityRole).toBe('header');
 });
 it('takes host formats for the headline and the return; the headline follows the provider money presentation',()=>{
  const view=mount({pnlOptions:{style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:2},percentOptions:{style:'percent',maximumFractionDigits:1,signDisplay:'exceptZero'}},{locale:'fr-FR',numberFormat:{currencyDisplay:'narrowSymbol'}});
  expect(figure(view).props.options).toEqual({style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:2});
  expect(host(view,'trade-pnl-value').props.accessibilityLabel.replace(/\s/g,' ')).toBe('Net PnL: +1,42 $');
  expect(host(view,'trade-pnl-percent').props.accessibilityLabel.replace(/\s/g,' ')).toBe('+2,8 % on margin');
 });
 it('draws a note under the details, a leverage note, a symbol fallback and a capture ref around the summary',()=>{
  const ref=React.createRef();
  const view=mount({testID:'block',note:'Part of this record is missing.',leverageNote:'current',symbol:'AMZN',summaryRef:ref,actions:[{id:'share',label:'Share',onSelect(){}}]});
  expect(text(host(view,'trade-note'))).toBe('Part of this record is missing.');expect(flat(host(view,'trade-note'))).toMatchObject({marginTop:16,color:nativeSrgb.muted});
  expect(text(host(view,'trade-leverage-note'))).toBe('current');expect(host(view,'trade-asset').props.accessibilityLabel).toBe('Amazon, Short, 20×, current');
  expect(host(view,'trade-asset').findAll(node=>node.type==='Text').map(text)).toContain('AMZN');
  const summary=host(view,'trade-summary');expect(summary.props.collapsable).toBe(false);expect(summary.children.map(child=>child.props.testID)).toEqual(['trade-asset','trade-pnl']);expect(ref.current).toBeTruthy();
  const order=host(view,'block').children.map(child=>child.props.testID);expect(order).toEqual(['trade','trade-summary','trade-details','trade-note','trade-actions']);expect(has(view,'trade-header')).toBe(true);
  expect(host(mount(),'trade-summary')).toBeUndefined();
 });
 it('fills the captured summary with summaryBackground, draws host-formatted details and pins the header (Unreleased)',()=>{
  const {ScrollView}=require('react-native');const ref=React.createRef();
  let view=mount({summaryRef:ref});expect(flat(host(view,'trade-summary')).backgroundColor).toBeUndefined();
  view=mount({summaryRef:ref,summaryBackground:true});expect(flat(host(view,'trade-summary')).backgroundColor).toBe(nativeSrgb.background);
  view=mount({summaryRef:ref,summaryBackground:'#111111',details:[{label:'Size',value:3.734,formattedValue:'3,734',suffix:' AMZN'}]});
  expect(flat(host(view,'trade-summary')).backgroundColor).toBe('#111111');expect(flows(view,'trade-detail-Size')[0].props).toMatchObject({formattedValue:'3,734',animateFormatted:true});
  view=mount({stickyHeader:true});const scroll=view.findByType(ScrollView);expect(scroll.props.stickyHeaderIndices).toEqual([0]);
  expect(flat(host(view,'trade-sticky-header')).backgroundColor).toBe('transparent');
  act(()=>{scroll.props.onScroll({nativeEvent:{contentOffset:{y:10}}});});expect(flat(host(view,'trade-sticky-header')).backgroundColor).toBe(nativeSrgb.background);
 });
});
