/** Native TradeHistoryCard: one closed trade as a BarPnl from entry to exit, with the net profit and loss on the title row. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {TradeHistoryCard,tradeHistoryTitle}=require('../../packages/hig/native/src/trade-history-card');
const blocks=require('../../packages/hig/native/src/blocks');
const {BarPnl}=require('../../packages/hig/native/src/bar-pnl');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
// The host owns every trading word.
const labels={entry:'Entry',exit:'Exit',long:'Long',short:'Short'};
const base={labels,symbol:'AMZN',side:'short',leverage:20,entry:267.6,exit:267.18,pnl:1.418,testID:'trade'};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(TradeHistoryCard,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const bar=view=>view.findByType(BarPnl);
const pressable=view=>view.findAll(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function')[0];
const result=view=>view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='trade-pnl');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('titles the card with the ticker, the host side word and the leverage',()=>{
 expect(tradeHistoryTitle({symbol:'AMZN',side:'short',leverage:20,labels})).toBe('AMZN · Short 20×');
 expect(tradeHistoryTitle({symbol:'BTC',side:'long',labels})).toBe('BTC · Long');
 expect(tradeHistoryTitle({symbol:'BTC',side:'long',leverage:2.5,labels:{long:'Achat',short:'Vente'}},'fr-FR')).toBe('BTC · Achat 2,5×');
 expect(blocks.TradeHistoryCard).toBe(TradeHistoryCard);expect(blocks.tradeHistoryTitle).toBe(tradeHistoryTitle);
});
it('draws the trade as a BarPnl from entry to exit filling the bar, with the host labels',()=>{
 let view=mount();
 expect(bar(view).props).toMatchObject({testID:'trade',surface:true,fit:true,side:'short',entry:267.6,mark:267.18,labels:{entry:'Entry',mark:'Exit',liquidation:''},title:'AMZN · Short 20×',priceOptions:undefined});
 expect(bar(view).props.liquidation).toBeUndefined();
 // Two prices only: no liquidation readout or tick for a finished trade.
 expect(all(view,'trade-liquidation')).toHaveLength(0);expect(all(view,'trade-liquidation-tick')).toHaveLength(0);
 expect(host(view,'trade-mark').props.accessibilityLabel).toBe('Exit, $267.18');expect(host(view,'trade-entry').props.accessibilityLabel).toBe('Entry, $267.60');
 expect(flat(host(view,'trade')).backgroundColor).toBe(nativeSrgb.surface);
 view=mount({surface:false,priceOptions:{style:'currency',currency:'EUR'}});
 expect(bar(view).props).toMatchObject({surface:false,priceOptions:{style:'currency',currency:'EUR'}});expect(flat(host(view,'trade')).backgroundColor).toBeUndefined();
});
it('reads the net profit and loss on the title row, toned for a gain, a loss or neither, and leaves it out when not given',()=>{
 let view=mount();
 expect(result(view).props).toMatchObject({value:1.418,tone:'up',options:{style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4}});expect(flat(result(view))).toMatchObject({fontSize:14,lineHeight:21});
 view=mount({pnl:-3.2});expect(result(view).props.tone).toBe('down');
 view=mount({pnl:0});expect(result(view).props.tone).toBe('muted');
 view=mount({pnl:null});expect(result(view).props).toMatchObject({value:null,tone:'muted'});
 view=mount({pnl:undefined});expect(result(view)).toBeUndefined();expect(bar(view).props.description).toBeUndefined();
 // The same readout follows a new value.
 view=mount();const first=result(view);act(()=>{root.update(h(HIGProvider,{reducedMotion:true},h(TradeHistoryCard,{...base,pnl:2.5})));});
 expect(result(root.root)).toBe(first);expect(first.props.value).toBe(2.5);
});
it('is a button only when it can be selected, named by the title and the result',()=>{
 let view=mount();expect(pressable(view)).toBeUndefined();expect(all(view,'trade-button')).toHaveLength(0);
 const select=jest.fn();view=mount({onSelect:select});
 const button=pressable(view);expect(button.props).toMatchObject({testID:'trade-button',accessibilityRole:'button',accessibilityLabel:'AMZN · Short 20×, +$1.418'});
 act(()=>button.props.onPress());expect(select).toHaveBeenCalledTimes(1);
 // The content inside the button is not separately focusable.
 expect(bar(view).parent.props).toMatchObject({accessible:false,importantForAccessibility:'no-hide-descendants'});
 view=mount({onSelect:select,pnl:undefined,leverage:undefined});expect(pressable(view).props.accessibilityLabel).toBe('AMZN · Short');
 view=mount({onSelect:select,pnl:null,testID:undefined});expect(pressable(view).props.accessibilityLabel).toBe('AMZN · Short 20×');expect(pressable(view).props.testID).toBeUndefined();
});
