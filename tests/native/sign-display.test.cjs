/**
 * Signed figures without Intl's `signDisplay` or `formatToParts`. Hermes on iOS (seen on an iPhone 17 Pro) ignores `signDisplay`
 * and has no `formatToParts`, so `exceptZero` drew `12.34%`, `$1.542` and `$12.50` where Android drew `+12.34%`, `+$1.542` and
 * `+$12.50`. Native HIG composes the sign itself; these tests run it against a stubbed Intl with neither feature and require the
 * string an Intl that honours them draws (Node's ICU here).
 */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {Text:RNText}=require('react-native');
const {formatSignedNumber}=require('../../packages/hig/contracts/dist/index.js');
const {formatNumber}=require('../../packages/hig/native/src/number-format');
const {createNumberReelModel,formatNumberReadout}=require('../../packages/hig/native/src/animated-number-model');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {TradeHistoryDetailBlock}=require('../../packages/hig/native/src/trade-history-detail-block');
const {TradeHistoryListBlock}=require('../../packages/hig/native/src/trade-history-list-block');
const {ManagePositionBlock}=require('../../packages/hig/native/src/manage-position-block');
const h=React.createElement;

const RealNumberFormat=Intl.NumberFormat;
/** Intl as Hermes on iOS has it: `signDisplay` is ignored and there is no `formatToParts`. `numberingSystem: false` also drops that from resolvedOptions. */
function stubIntl({numberingSystem=true}={}){
 return jest.spyOn(Intl,'NumberFormat').mockImplementation(function HermesIOSNumberFormat(locale,options={}){
  const {signDisplay:_ignored,...rest}=options??{},formatter=new RealNumberFormat(locale,rest);
  return {format:value=>formatter.format(value),resolvedOptions:()=>{const resolved={...formatter.resolvedOptions()};if(!numberingSystem)delete resolved.numberingSystem;return resolved;}};
 });
}
/** What an Intl that honours `signDisplay` draws. */
const intl=(value,locale,options)=>new RealNumberFormat(locale,options).format(value);
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;jest.restoreAllMocks();});

const usd={style:'currency',currency:'USD'};
const pnlUsd={...usd,signDisplay:'exceptZero',maximumFractionDigits:4};
const pnlShare={style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'};

it('the stub really is the iOS defect: no sign, no formatToParts',()=>{
 stubIntl();
 const formatter=new Intl.NumberFormat('en-US',pnlShare);
 expect(formatter.format(0.1234)).toBe('12.34%');expect(formatter.formatToParts).toBeUndefined();
});

describe.each([['the iOS stub',()=>stubIntl()],['a full Intl',()=>undefined]])('native formatNumber under %s',(_name,setup)=>{
 beforeEach(()=>setup());
 it('currency: plus before the dollar sign, minus too, as the locale writes it',()=>{
  expect(formatNumber(12.5,'en-US',{...usd,signDisplay:'exceptZero'})).toBe('+$12.50');
  expect(formatNumber(1.542,'en-US',pnlUsd)).toBe('+$1.542');
  expect(formatNumber(-12.5,'en-US',{...usd,signDisplay:'exceptZero'})).toBe('-$12.50');
  expect(formatNumber(12.5,'en-US',{...usd,signDisplay:'always'})).toBe('+$12.50');
  expect(formatNumber(12.5,'fr-FR',{...usd,signDisplay:'exceptZero'})).toBe('+12,50 $US');
  expect(formatNumber(-12.5,'fr-FR',{...usd,signDisplay:'exceptZero'})).toBe('-12,50 $US');
  // Swiss German puts the sign between the symbol and the digits.
  expect(formatNumber(12.5,'de-CH',{...usd,signDisplay:'exceptZero'})).toBe('$+12.50');
  expect(formatNumber(-12.5,'de-CH',{...usd,signDisplay:'exceptZero'})).toBe('$-12.50');
 });
 it('percent and plain numbers',()=>{
  expect(formatNumber(0.1234,'en-US',pnlShare)).toBe('+12.34%');
  expect(formatNumber(-0.0025,'en-US',pnlShare)).toBe('-0.25%');
  expect(formatNumber(0.1234,'de-DE',pnlShare)).toBe('+12,34 %');
  expect(formatNumber(1234.5,'en-US',{signDisplay:'exceptZero'})).toBe('+1,234.5');
  expect(formatNumber(-1234.5,'en-US',{signDisplay:'exceptZero'})).toBe('-1,234.5');
  // Swedish writes U+2212 MINUS SIGN; its plus is still +.
  expect(formatNumber(-3,'sv-SE',{signDisplay:'exceptZero'})).toBe('−3');expect(formatNumber(3,'sv-SE',{signDisplay:'exceptZero'})).toBe('+3');
 });
 it('zero: exceptZero draws no sign for zero, negative zero, or a value that rounds to zero; always draws one',()=>{
  expect(formatNumber(0,'en-US',pnlShare)).toBe('0.00%');expect(formatNumber(-0,'en-US',pnlShare)).toBe('0.00%');
  expect(formatNumber(0.00001,'en-US',pnlShare)).toBe('0.00%');expect(formatNumber(-0.00001,'en-US',pnlShare)).toBe('0.00%');
  expect(formatNumber(0,'en-US',pnlUsd)).toBe('$0.00');expect(formatNumber(0,'en-US',{signDisplay:'exceptZero'})).toBe('0');
  expect(formatNumber(0,'en-US',{signDisplay:'always'})).toBe('+0');expect(formatNumber(-0,'en-US',{signDisplay:'always'})).toBe('-0');
  expect(formatNumber(-5,'en-US',{signDisplay:'never'})).toBe('5');
  expect(formatNumber(-5,'en-US',{signDisplay:'negative'})).toBe('-5');expect(formatNumber(5,'en-US',{signDisplay:'negative'})).toBe('5');expect(formatNumber(-0.001,'en-US',{signDisplay:'negative',maximumFractionDigits:2})).toBe('0');
 });
 it('RTL locales and non-Latin digits keep their bidi marks and digits around the composed plus',()=>{
  for(const [locale,options] of [['ar-EG',{signDisplay:'exceptZero'}],['ar-EG',pnlShare],['ar-EG',{...usd,signDisplay:'exceptZero'}],['he-IL',{...usd,signDisplay:'exceptZero'}],['fa-IR',{signDisplay:'always'}],['fa-IR',pnlShare],['hi-IN-u-nu-deva',pnlUsd],['bn-BD',pnlShare],['ur-PK',{signDisplay:'exceptZero'}]])
   for(const value of [12.34,-12.34,0,0.001])expect([locale,value,formatNumber(value,locale,options)]).toEqual([locale,value,intl(value,locale,options)]);
  expect(formatNumber(12,'ar-EG',{signDisplay:'exceptZero'})).toBe('؜+١٢');
 });
 it('readouts carry the same text, and leave unknown values as a dash',()=>{
  expect(formatNumberReadout(0.1234,'en-US',pnlShare).text).toBe('+12.34%');
  expect(formatNumberReadout(12.5,'en-US',{...usd,signDisplay:'exceptZero'},undefined,undefined,' on margin').text).toBe('+$12.50 on margin');
  expect(formatNumber(null,'en-US',pnlShare)).toBe('—');expect(formatNumber(NaN,'en-US',pnlShare)).toBe('—');expect(formatNumberReadout(Infinity,'en-US',pnlShare).text).toBe('—');
 });
});

describe('composed signs match an Intl that draws them (feature test)',()=>{
 const locales=['en-US','en-GB','en-IN','fr-FR','fr-CH','de-DE','de-CH','es-ES','es-MX','it-IT','nl-NL','pt-BR','pt-PT','sv-SE','nb-NO','fi-FI','da-DK','pl-PL','cs-CZ','ru-RU','uk-UA','tr-TR','el-GR','he-IL','ar-EG','ar-SA','ar-MA','fa-IR','ur-PK','hi-IN','bn-BD','ta-IN','th-TH','ja-JP','ko-KR','zh-CN','zh-TW','vi-VN','id-ID','my-MM','lo-LA','km-KH','sw-KE','zu-ZA','en-US-u-nu-arab','hi-IN-u-nu-deva'];
 const formats=[{},{maximumFractionDigits:2},usd,pnlUsd,{...usd,currencyDisplay:'narrowSymbol'},{style:'currency',currency:'EUR',currencyDisplay:'code'},{...usd,currencySign:'accounting'},{...usd,minimumSignificantDigits:4,maximumSignificantDigits:4},{style:'percent',maximumFractionDigits:2},pnlShare,{style:'unit',unit:'kilometer'},{notation:'compact'},{notation:'scientific'},{...usd,notation:'compact'}];
 const values=[12.34,-12.34,0,-0,0.001,-0.001,1.542,1234567.891,0.1234,-0.0049];
 it.each(['always','exceptZero','never','negative','auto'])('signDisplay %s across locales, styles and values',signDisplay=>{
  const differences=[];
  for(const locale of locales)for(const format of formats){
   const options={...format,signDisplay};
   for(const value of values){const want=intl(value,locale,options),got=formatSignedNumber(value,locale,options);if(got!==want)differences.push({locale,options,value,want,got});}
  }
  expect(differences).toEqual([]);
 });
});

describe('the shared contracts formatNumber',()=>{
 it('keeps Intl where it draws the sign (web and Android unchanged) and composes it where Intl ignores it',()=>{
  jest.isolateModules(()=>{
   const contracts=require('../../packages/hig/contracts/dist/index.js');
   expect(contracts.intlSignDisplaySupported('exceptZero')).toBe(true);
   const spy=jest.spyOn(Intl,'NumberFormat');
   expect(contracts.formatNumber(0.1234,'en-US',pnlShare)).toBe('+12.34%');
   // One Intl call with the caller's options, signDisplay included: the same path as before this change.
   expect(spy).toHaveBeenCalledTimes(1);expect(spy.mock.calls[0][1]).toBe(pnlShare);
  });
  jest.restoreAllMocks();
  jest.isolateModules(()=>{
   stubIntl();
   const contracts=require('../../packages/hig/contracts/dist/index.js');
   for(const mode of ['always','exceptZero','never','negative'])expect(contracts.intlSignDisplaySupported(mode)).toBe(false);
   expect(contracts.formatNumber(0.1234,'en-US',pnlShare)).toBe('+12.34%');expect(contracts.formatNumber(12.5,'en-US',{...usd,signDisplay:'exceptZero'})).toBe('+$12.50');
   expect(contracts.formatNumber(0,'en-US',pnlShare)).toBe('0.00%');expect(contracts.formatNumber(-12.5,'en-US',{...usd,signDisplay:'exceptZero'})).toBe('-$12.50');
   expect(contracts.formatNumber(12.5,'en-US',usd)).toBe('$12.50');
  });
 });
});

describe('animated reels without formatToParts',()=>{
 // Adjacent static tokens read as one run: Intl splits `+$` into a plusSign and a currency part where the text reads one run; the drawn text is the same.
 const shape=model=>model&&model.tokens.map(token=>token.kind==='digit'?`${token.key}=${token.value}`:`[${token.value}]`).join(' ').replace(/\] \[/g,'');
 const digitKeys=model=>model.tokens.filter(token=>token.kind==='digit').map(token=>`${token.key}=${token.value}`);
 const cases=[
  ['en-US',0.1234,pnlShare,'[+] integer:1=1 integer:0=2 [.] fraction:0=3 fraction:1=4 [%]'],
  ['en-US',1.542,pnlUsd,'[+$] integer:0=1 [.] fraction:0=5 fraction:1=4 fraction:2=2'],
  ['en-US',-12.5,{...usd,signDisplay:'exceptZero'},'[-$] integer:1=1 integer:0=2 [.] fraction:0=5 fraction:1=0'],
  ['en-US',0,pnlUsd,'[$] integer:0=0 [.] fraction:0=0 fraction:1=0'],
  ['en-US',1234.5,{signDisplay:'always'},'[+] integer:3=1 [,] integer:2=2 integer:1=3 integer:0=4 [.] fraction:0=5'],
  ['de-DE',1234.5,{...usd,signDisplay:'exceptZero'},'[+] integer:3=1 [.] integer:2=2 integer:1=3 integer:0=4 [,] fraction:0=5 fraction:1=0 [ $]'],
  ['fr-FR',-0.0025,pnlShare,'[-] integer:0=0 [,] fraction:0=2 fraction:1=5 [ %]'],
 ];
 it.each(cases)('%s %d: the same reels and keys as Intl parts, with the composed sign',(locale,value,options,expected)=>{
  const full=createNumberReelModel(value,locale,options,undefined,'ltr');
  expect(shape(full)).toBe(expected);
  stubIntl();
  const model=createNumberReelModel(value,locale,options,undefined,'ltr');
  expect(model).not.toBeNull();expect(model.canonical).toBe(full.canonical);expect(model.tokens.map(token=>token.value).join('')).toBe(full.canonical);
  expect(digitKeys(model)).toEqual(digitKeys(full));expect(model.digits).toEqual(full.digits);
  expect(shape(model)).toBe(expected);
 });
 it('rolls non-Latin digits, and falls back to the text when Intl does not name its numbering system',()=>{
  for(const locale of ['bn-BD','my-MM','mr-IN','en-US-u-nu-thai']){
   const full=createNumberReelModel(0.1234,locale,pnlShare,undefined,'ltr');stubIntl();
   const model=createNumberReelModel(0.1234,locale,pnlShare,undefined,'ltr');jest.restoreAllMocks();
   expect(model).not.toBeNull();expect(model.canonical).toBe(full.canonical);expect(model.digits).toEqual(full.digits);expect(digitKeys(model)).toEqual(digitKeys(full));
  }
  stubIntl({numberingSystem:false});
  const model=createNumberReelModel(12.5,'en-US',{...usd,signDisplay:'exceptZero'},undefined,'ltr');
  expect(shape(model)).toBe('[+$] integer:1=1 integer:0=2 [.] fraction:0=5 fraction:1=0');
 });
 it('still falls back to static text for RTL layouts, bidi marks and scientific notation',()=>{
  stubIntl();
  expect(createNumberReelModel(12,'ar-EG',{signDisplay:'exceptZero'},undefined,'ltr')).toBeNull();
  expect(createNumberReelModel(12,'en-US',{signDisplay:'exceptZero'},undefined,'rtl')).toBeNull();
  expect(createNumberReelModel(-1234.5,'en-US',{notation:'scientific',signDisplay:'always'},undefined,'ltr')).toBeNull();
 });
});

describe('blocks and readouts on the iOS stub',()=>{
 const strings=view=>view.findAll(node=>typeof node.type==='string').flatMap(node=>[node.props.accessibilityLabel,...node.children.filter(child=>typeof child==='string')]).filter(Boolean).join('\n');
 function mount(element,provider={}){act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
 it('AnimatedNumberReadout reads and rolls the plus sign',()=>{
  stubIntl();
  const view=mount(h(AnimatedNumberReadout,{value:0.1234,options:pnlShare,label:'Return',testID:'share'}));
  const reading=view.findAllByType(RNText).find(node=>node.props.testID==='share');
  expect(reading.props.accessibilityLabel).toBe('Return: +12.34%');expect(reading.props.children[0]).toBe('+12.34%');
  // The ten measuring glyphs mean the reel model exists; before, no formatToParts meant no model and no reels.
  const probes=view.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function');expect(probes).toHaveLength(10);
  act(()=>{for(const probe of probes)probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width:10,height:20}}});});
  const drawn=view.findAllByType(RNText).filter(node=>node.props.accessible===false&&typeof node.props.children==='string').map(node=>node.props.children);
  expect(drawn).toContain('+');expect(drawn).toContain('%');
 });
 it('trade detail, history and manage position draw +$ and +% as Android does',()=>{
  stubIntl();
  let view=mount(h(TradeHistoryDetailBlock,{labels:{title:'Trade',netPnl:'Net PnL',onMargin:percent=>`${percent} on margin`,long:'Long',short:'Short'},name:'Amazon',side:'short',leverage:20,pnl:12.5,pnlPercent:0.1234,details:[]}));
  let all=strings(view);expect(all).toContain('+$12.50');expect(all).toContain('+12.34% on margin');
  act(()=>root.unmount());
  view=mount(h(TradeHistoryListBlock,{testID:'history',labels:{title:'H',long:'Up',short:'Down',empty:'None'},trades:[{id:'t',name:'Amazon',side:'short',pnl:1.542}],onSelect:()=>{}}));
  expect(strings(view)).toContain('+$1.542');
  act(()=>root.unmount());
  view=mount(h(ManagePositionBlock,{labels:{title:'P',margin:'Margin',notional:'Notional',liquidation:'L',mark:'M',entry:'E',long:'Long',short:'Short',toLiquidation:p=>p},side:'long',entry:100,mark:110,liquidation:90,margin:10,notional:400,actions:[],position:{name:'Ether',leverage:5,size:2,pnl:20,pnlPercent:0.1}}));
  all=strings(view);expect(all).toContain('+$20.00');expect(all).toContain('+10.00%');
 });
});
