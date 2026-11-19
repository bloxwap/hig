/** Native HIGProvider numberFormat: the host's money presentation under every currency format the blocks, rows, bars and readouts draw. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {HIGProvider,useNumberLocale,usePresentNumber}=require('../../packages/hig/native/src/provider');
const {NumberReadout,Usd,Percent}=require('../../packages/hig/native/src/data');
const {NumberFlow}=require('../../packages/hig/native/src/animated-number');
const {AccountBlock}=require('../../packages/hig/native/src/account-block');
const {AssetBalanceRow}=require('../../packages/hig/native/src/asset-balance-row');
const {TokenActionBlock}=require('../../packages/hig/native/src/token-action-block');
const {BarPnl}=require('../../packages/hig/native/src/bar-pnl');
const {TargetBlock}=require('../../packages/hig/native/src/target-block');
const {RewardBlock}=require('../../packages/hig/native/src/reward-block');
const {TradeHistoryListBlock}=require('../../packages/hig/native/src/trade-history-list-block');
const {ManagePositionBlock}=require('../../packages/hig/native/src/manage-position-block');
const h=React.createElement;
let root;
function mount(children,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,locale:'fr-FR',...provider},...children));});return root.root;}
const plain=value=>String(value??'').replace(/[  ]/g,' ');
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
/** Every string the tree reads out or draws, with no-break spaces made plain. */
const strings=view=>plain([...view.findAll(node=>typeof node.type==='string').flatMap(node=>[node.props.accessibilityLabel,...node.children.filter(child=>typeof child==='string')])].filter(Boolean).join('\n'));
const narrow={numberFormat:{currencyDisplay:'narrowSymbol'}};
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});
const scene=()=>[
 h(Usd,{key:'usd',value:12.5,testID:'usd'}),h(Usd,{key:'code',value:12.5,testID:'code',options:{currencyDisplay:'code'}}),h(Percent,{key:'percent',value:5,testID:'percent'}),
 h(NumberFlow,{motion:'slide',key:'eur',value:3,testID:'eur',options:{style:'currency',currency:'EUR'}}),
 h(AccountBlock,{key:'account',assets:[{id:'sol',name:'Solana',symbol:'SOL',value:203}],balance:1042.09}),
 h(AssetBalanceRow,{key:'row',name:'Hyperliquid',symbol:'HYPE',value:759,balance:13.2,testID:'hype'}),
 h(TokenActionBlock,{key:'token',symbol:'HYPE',name:'Hyperliquid',value:759,assets:[],chains:[],actions:[]}),
 h(BarPnl,{key:'bar',entry:100,mark:110,labels:{liquidation:'L',mark:'M',entry:'E'},testID:'bar'}),
];
it('updates numeric subscribers independently',()=>{
 const locales=[],displays=[];
 function Locale(){locales.push(useNumberLocale());return null;}
 function Display(){displays.push(usePresentNumber()({style:'currency',currency:'USD'}).currencyDisplay);return null;}
 const children=h(React.Fragment,null,h(Locale),h(Display));
 const provider=(locale,props)=>h(HIGProvider,{locale,reducedMotion:true,...props},children);
 act(()=>{root=render(provider('en-US'));});
 act(()=>root.update(provider('en-US',{messages:{stale:'Delayed'}})));
 expect(locales).toEqual(['en-US']);expect(displays).toEqual([undefined]);
 const numberFormat={currencyDisplay:'code'};
 act(()=>root.update(provider('en-US',{numberFormat})));
 expect(locales).toEqual(['en-US']);expect(displays).toEqual([undefined,'code']);
 act(()=>root.update(provider('fr-FR',{numberFormat})));
 expect(locales).toEqual(['en-US','fr-FR']);expect(displays).toEqual([undefined,'code']);
});
it('leaves the formats alone without the setting: French dollars read $US',()=>{
 const view=mount(scene());const all=strings(view);
 expect(all).toContain('12,50 $US');expect(all).toContain('Total balance: 1 042,09 $US');expect(all).toContain('759,00 $US');
});
it('reads dollars the host way in readouts, the account, rows, the token total and bars, and per-call options win',()=>{
 const view=mount(scene(),narrow);const all=strings(view);
 expect(all).not.toContain('$US');
 const reading=id=>plain(text(view.findAll(node=>node.props.testID===id&&typeof node.type==='string')[0]));
 expect(reading('usd')).toBe('12,50 $');expect(reading('code')).toBe('12,50 USD');expect(reading('percent')).toBe('5 %');expect(reading('eur')).toBe('3,00 €');
 expect(all).toContain('Total balance: 1 042,09 $');expect(all).toContain('Hyperliquid, HYPE, 759,00 $, 13,2');expect(reading('token-value')).toBe('759,00 $');expect(all).toContain('110,00 $');
});
it('reaches the figures the blocks write as text: legends, presets, captions and spoken rows',()=>{
 const view=mount([
  h(ManagePositionBlock,{key:'manage',labels:{title:'P',margin:'Margin',notional:'Notional',liquidation:'L',mark:'M',entry:'E',long:'Up',short:'Down',toLiquidation:p=>p},side:'long',entry:100,mark:101,liquidation:90,margin:10,notional:400,actions:[]}),
  h(TargetBlock,{key:'target',kind:'take-profit',labels:{title:'T',submit:'Set',entry:'E',trigger:'Tr',custom:'C',unit:'U',units:{dollar:'$',price:'P',percent:'%'}},position:'X',entry:100,unit:'dollar',value:1,presets:[1,2],onValueChange:()=>{},onSubmit:()=>{}}),
  h(RewardBlock,{key:'reward',title:'R',promo:{amount:4037,goal:250000,caption:goal=>`of ${goal}`},entries:[]}),
  h(TradeHistoryListBlock,{key:'history',testID:'history',labels:{title:'H',long:'Up',short:'Down',empty:'None'},trades:[{id:'t',name:'Amazon',side:'short',pnl:1.412}],onSelect:()=>{}}),
 ],narrow);
 const all=strings(view);
 expect(all).not.toContain('$US');
 expect(all).toContain('10,00 $');expect(all).toContain('400,00 $');expect(all).toContain('+1 $');expect(all).toContain('of 250 000 $');expect(all).toContain('+1,412 $');
});
it('is inherited by nested providers, and a nested setting replaces it',()=>{
 const view=mount([h(HIGProvider,{key:'a',locale:'fr-FR'},h(Usd,{value:1,testID:'inherited'})),h(HIGProvider,{key:'b',locale:'fr-FR',numberFormat:{currencyDisplay:'code'}},h(Usd,{value:1,testID:'own'}))],narrow);
 const reading=id=>plain(text(view.findAll(node=>node.props.testID===id&&typeof node.type==='string')[0]));
 expect(reading('inherited')).toBe('1,00 $');expect(reading('own')).toBe('1,00 USD');
});
describe('numberFormat.locale, formattedValue figures and market colours (Unreleased)',()=>{
 const {createFormattedReelModel,createNumberReelModel}=require('../../packages/hig/native/src/animated-number-model');
 const {useNumberLocale}=require('../../packages/hig/native/src/provider');
 const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
 it('formats numbers in numberFormat.locale while the interface keeps its locale',()=>{
  let seen;function Probe(){seen=useNumberLocale();return null;}
  let view=mount([h(Usd,{key:'usd',value:1234.5,testID:'usd'}),h(Probe,{key:'probe'})],{locale:'de-DE',numberFormat:{locale:'en-US'}});
  expect(plain(text(view.findAll(node=>node.props.testID==='usd'&&typeof node.type==='string')[0]))).toBe('$1,234.50');expect(seen).toBe('en-US');
  view=mount([h(Usd,{key:'usd',value:1234.5,testID:'usd'}),h(Probe,{key:'probe'})],{locale:'de-DE'});
  expect(plain(text(view.findAll(node=>node.props.testID==='usd'&&typeof node.type==='string')[0]))).toBe('1.234,50 $');expect(seen).toBe('de-DE');
 });
 it('builds reels from host-formatted text only when asked, keyed by place from the end',()=>{
  expect(createNumberReelModel(1234.5,'en-US',undefined,'1 234,50 $','ltr')).toBeNull();
  const model=createNumberReelModel(1234.5,'en-US',undefined,'1 234,50 $','ltr',true);
  expect(model.canonical).toBe('1 234,50 $');
  expect(model.tokens.map(token=>token.kind==='digit'?`${token.key}=${token.value}`:token.value)).toEqual(['digit:5=1',' ','digit:4=2','digit:3=3','digit:2=4',',','digit:1=5','digit:0=0',' $']);
  const mixed=createFormattedReelModel('📈 ١2٣4','ar-EG','ltr');
  expect(mixed.tokens.map(token=>[token.key,token.value])).toEqual([['static:0','📈 ١'],['digit:1','2'],['static:2','٣'],['digit:0','4']]);
  expect(createFormattedReelModel('—','en-US','ltr')).toBeNull();expect(createFormattedReelModel('12','en-US','rtl')).toBeNull();
  expect(createNumberReelModel(null,'en-US',undefined,'12','ltr',true)).toBeNull();
 });
 it('paints the BarPnl result with the market up and down colours',()=>{
  const {BarPnl:Bar}=require('../../packages/hig/native/src/bar-pnl');
  const labels={liquidation:'Liq',mark:'Mark',entry:'Entry'};
  let view=mount([h(Bar,{key:'bar',testID:'bar',entry:100,mark:110,labels})],{marketColors:{up:'#ff3b30',down:'#0a84ff'}});
  const move=()=>view.findAll(node=>node.props.testID==='bar-fill'&&typeof node.type==='string')[0];
  const style=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
  expect(style(move()).backgroundColor).toBe('#ff3b30');
  view=mount([h(Bar,{key:'bar',testID:'bar',entry:100,mark:90,labels})],{marketColors:{up:'#ff3b30',down:'#0a84ff'}});expect(style(move()).backgroundColor).toBe('#0a84ff');
  view=mount([h(Bar,{key:'bar',testID:'bar',entry:100,mark:110,labels})]);expect(style(move()).backgroundColor).toBe(nativeSrgb.positive);
 });
});

it('formats only changed readouts when a quote moves',()=>{
 const touched=new Set();
 const options=Array.from({length:24},(_,index)=>({get maximumFractionDigits(){touched.add(index);return 2;}}));
 const scene=first=>h(React.Fragment,null,...options.map((format,index)=>
  h([NumberReadout,Usd,Percent][index%3],{key:index,options:format,value:index===0?first:index,testID:'quote-'+index})));
 act(()=>{root=render(scene(10));});
 expect(touched.size).toBe(24);
 touched.clear();
 act(()=>root.update(scene(11)));
 expect([...touched]).toEqual([0]);
 expect(text(root.root.findByProps({testID:'quote-0'}))).toBe('11');
});

it('keeps numeric work scoped to readout settings across nested providers',()=>{
 const touched=new Set();
 const quotes=Array.from({length:24},(_,index)=>h(NumberReadout,{key:index,stale:true,value:1234.5,testID:'quote-'+index,options:{get maximumFractionDigits(){touched.add(index);return 2;}}}));
 const scene=(compact,locale,stale)=>h(HIGProvider,{density:compact?'compact':'comfortable',locale,messages:{stale}},h(HIGProvider,null,quotes));
 act(()=>{root=render(scene(false,'en-US','Old'));});
 expect(touched.size).toBe(24);
 touched.clear();
 act(()=>root.update(scene(true,'en-US','Old')));
 expect(touched.size).toBe(0);
 act(()=>root.update(scene(true,'de-DE','Alt')));
 expect(touched.size).toBe(24);
 expect(text(root.root.findByProps({testID:'quote-0'}))).toBe('1.234,5 Alt');
});
