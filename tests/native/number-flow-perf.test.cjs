/**
 * What a change costs the JS thread on native, counted: React commits (React.Profiler), HIG `Text` components drawn again and
 * `Intl.NumberFormat` objects built. Reanimated is the stand-in tests/native/number-flow.test.cjs uses, which runs the real
 * animation objects against a clock the test moves, so "while a roll runs" here is the frames a device's UI thread would run.
 * These are counts under jest, not device timings: nothing here says how long a frame takes on a phone.
 */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,PixelRatio}=require('react-native');
const mockClock={now:0,values:[]},mockDrawn={text:0};
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{
  const ref=React.useRef(null);
  if(ref.current===null){
   let current=initial,animation=null;
   ref.current={get value(){return current;},set value(next){
    if(next&&next.__mockDefined){const created=next.factory(),previous=animation;animation=null;if(current===created.current)return;created.onStart(created,current,mockClock.now,previous);animation=created;this.frame(mockClock.now);return;}
    if(next&&next.__mockTiming){current=next.toValue;animation=null;return;}
    current=next;animation=null;
   },get animating(){return animation!==null;},stop(){animation=null;},frame(now){if(!animation)return;const finished=animation.onFrame(animation,now);current=animation.current;if(finished)animation=null;}};
   mockClock.values.push(ref.current);
  }
  return ref.current;
 };
 return {__esModule:true,default:{View:RN.View,Text:RN.Text},cancelAnimation:value=>value.stop(),defineAnimation:(starting,factory)=>({__mockDefined:true,factory}),withTiming:(toValue,config)=>({__mockTiming:true,toValue,config}),
  useSharedValue:shared,useAnimatedStyle:updater=>updater(),Easing:{bezier:(...points)=>({bezier:points})},ReduceMotion:{Never:'never',System:'system',Always:'always'}};
});
// Every HIG text a readout draws goes through this one component, so counting its renders counts the texts React drew again.
// It reads the provider as the text it wraps does, so it is drawn again whenever that one is.
jest.mock('../../packages/hig/native/src/surface',()=>{
 const React=require('react'),actual=jest.requireActual('../../packages/hig/native/src/surface'),{useHIG}=require('../../packages/hig/native/src/provider');
 return {...actual,Text:React.forwardRef(function CountedText(props,ref){useHIG();mockDrawn.text++;return React.createElement(actual.Text,{...props,ref});})};
});
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AnimatedNumberReadout,NumberFlow}=require('../../packages/hig/native/src/animated-number');
const {createNumberReelModel,formatNumberReadout}=require('../../packages/hig/native/src/animated-number-model');
const h=React.createElement;
const usd={style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2};
const formats=[usd,{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:'exceptZero'},usd,{style:'percent',maximumFractionDigits:1}];
let root,commits=0,formatters;
const counted=()=>{const Original=Intl.NumberFormat;formatters=jest.spyOn(Intl,'NumberFormat').mockImplementation(function(locale,options){return new Original(locale,options);});};
beforeEach(()=>{mockClock.now=0;mockClock.values.length=0;commits=0;jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(1);counted();});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
const figure=(Component,props)=>h(Component,{options:usd,...props});
const board=(Component,values)=>values.map((value,index)=>h(Component,{key:index,value,options:formats[index%formats.length]}));
// The figures sit under a parent that draws again with each value, inside a provider that does not, as a screen of prices does.
let setHost;
function Host({first}){const [content,set]=React.useState(first);setHost=set;return content;}
function mount(content){act(()=>{root=create(h(React.Profiler,{id:'figures',onRender:()=>{commits++;}},h(HIGProvider,null,h(Host,{first:content}))));});}
function update(content){act(()=>setHost(content));}
function measure(){const probes=root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function');act(()=>{for(const probe of probes)probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width:12,height:24}}});});}
const advance=ms=>{mockClock.now+=ms;for(const value of mockClock.values)value.frame(mockClock.now);};
/** Runs `change` and reports what it cost. */
function cost(change){const before={commits,text:mockDrawn.text,formatters:formatters.mock.calls.length};change();return {commits:commits-before.commits,texts:mockDrawn.text-before.text,formatters:formatters.mock.calls.length-before.formatters};}
const reading=()=>{const children=root.root.findAllByType(RNText).find(node=>node.props.accessible!==false&&!node.props.onLayout).props.children;return Array.isArray(children)?children.join(''):children;};

describe.each([['NumberFlow',NumberFlow],['AnimatedNumberReadout, sliding',AnimatedNumberReadout]])('%s under load on native',(name,Component)=>{
 const flowing=Component===NumberFlow;
 it('commits once for a change, and not at all while the roll runs',()=>{
  expect(cost(()=>mount(figure(Component,{value:1234.56})))).toMatchObject({commits:1});
  // The ten digits are measured once; the reels are drawn in the commit that follows.
  expect(cost(()=>measure())).toMatchObject({commits:1});
  expect(cost(()=>update(figure(Component,{value:1234.57})))).toMatchObject({commits:1});
  const turning=mockClock.values.filter(value=>value.animating);if(flowing)expect(turning).toHaveLength(1);
  // Sixty frames of the UI thread: the reel moves and lands, and React hears nothing of it.
  expect(cost(()=>{for(let frame=0;frame<60;frame++)act(()=>advance(16));})).toEqual({commits:0,texts:0,formatters:0});
  expect(turning.every(value=>!value.animating)).toBe(true);
 });
 it('formats nothing when its parent draws again with the same value',()=>{
  mount(figure(Component,{value:1234.56}));measure();update(figure(Component,{value:1234.57}));
  expect(cost(()=>update(figure(Component,{value:1234.57,options:{...usd}})))).toMatchObject({commits:1,formatters:0});
 });
 it('builds its formatters once for a format, not for every value or every figure',()=>{
  // The first figure in a format asks Intl for the formatter, the numbering system's digits and the parts.
  jest.restoreAllMocks();jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(1);counted();
  expect(cost(()=>mount(figure(Component,{value:1234.56}))).formatters).toBe(3);
  // It was five for every render of every readout, and ten where a flowing figure worked out its turns.
  expect(cost(()=>measure()).formatters).toBe(0);
  for(const value of [1234.57,1240.11,98.5,123456.78])expect(cost(()=>update(figure(Component,{value}))).formatters).toBe(0);
  act(()=>root.unmount());root=null;
  // More figures in that format build nothing; one that composes its sign builds what `formatNumber` builds for a value, and only that.
  expect(cost(()=>mount(board(Component,[1,2,3]))).formatters).toBe(4);
  expect(cost(()=>update(board(Component,[11,0.25,13]))).formatters).toBe(1);
  expect(cost(()=>update(board(Component,[11,0.25,13]))).formatters).toBe(0);
 });
 it('reads what it read before, sign and all',()=>{
  mount(figure(Component,{value:-1234.56,options:formats[1]}));measure();
  expect(reading()).toBe('-123,456.00%');
  update(figure(Component,{value:0.0789,options:formats[1]}));expect(reading()).toBe('+7.89%');
  update(figure(Component,{value:0.0789,options:formats[3]}));expect(reading()).toBe('7.9%');
  update(figure(Component,{value:0.0789,options:formats[3],prefix:'~',suffix:' APR'}));expect(reading()).toBe('~7.9% APR');
 });
});

describe('the reel model under load',()=>{
 it('keeps what Intl says about a format and gives the same reels as asking again',()=>{
  const first=createNumberReelModel(1234.56,'de-DE',usd,undefined,'ltr'),built=formatters.mock.calls.length;
  const second=createNumberReelModel(9876.54,'de-DE',usd,undefined,'ltr');
  expect(formatters.mock.calls.length-built).toBe(0);
  expect(second.tokens.map(token=>token.value).join('')).toBe(new Intl.NumberFormat('de-DE',usd).format(9876.54));expect(second.digits).toBe(first.digits);
  // The reading the readout already has is used as it is.
  expect(createNumberReelModel(9876.54,'de-DE',usd,undefined,'ltr',false,formatNumberReadout(9876.54,'de-DE',usd).core)).toEqual(second);
 });
 it('starts over when Intl.NumberFormat is replaced, as a polyfill installed later would',()=>{
  expect(createNumberReelModel(1.5,'en-US',{},undefined,'ltr').tokens.map(token=>token.key)).toEqual(['integer:0','part:1:decimal','fraction:0']);
  jest.restoreAllMocks();const Original=Intl.NumberFormat;
  // Hermes on iOS has no `formatToParts`; this one also writes its decimal mark differently, so a kept answer would show.
  jest.spyOn(Intl,'NumberFormat').mockImplementation(function(locale,options){const formatter=new Original(locale,options);return {format:value=>formatter.format(value).replace('.',','),resolvedOptions:()=>formatter.resolvedOptions()};});
  expect(formatNumberReadout(1.5,'en-US',{}).core).toBe('1,5');
  expect(createNumberReelModel(1.5,'en-US',{},undefined,'ltr').tokens.map(token=>token.value)).toEqual(['1',',','5']);
  jest.restoreAllMocks();
  expect(formatNumberReadout(1.5,'en-US',{}).core).toBe('1.5');expect(createNumberReelModel(1.5,'en-US',{},undefined,'ltr').tokens.map(token=>token.value)).toEqual(['1','.','5']);
 });
});

// Set HIG_PERF_REPORT=1 to print what forty figures cost the JS thread under jest (V8, not Hermes). It compares two checkouts
// on one machine; it is not a device number.
(process.env.HIG_PERF_REPORT?it:it.skip)('reports the JS time of forty figures ticking',()=>{
 const report={};
 const random=seed=>()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
 for(const [name,Component] of [['flow',NumberFlow],['slide',AnimatedNumberReadout]]){
  const next=random(20260117),steps=[2.5,0.006,180,0.02];let values=Array.from({length:40},(_,index)=>[997.25,0.0042,64250.1,0.482][index%4]*(1+Math.floor(index/4)*0.01));
  mount(board(Component,values));measure();
  const ticks=[],same=[],before={text:mockDrawn.text,formatters:formatters.mock.calls.length};
  for(let tick=0;tick<60;tick++){values=values.map((value,index)=>value+(next()*2-1)*steps[index%4]);const started=performance.now();update(board(Component,values));ticks.push(performance.now()-started);}
  const changed={texts:(mockDrawn.text-before.text)/60,formatters:(formatters.mock.calls.length-before.formatters)/60};
  for(let tick=0;tick<60;tick++){const started=performance.now();update(board(Component,[...values]));same.push(performance.now()-started);}
  const least=list=>Math.round(Math.min(...list.slice(10))*100)/100,median=list=>Math.round(list.slice(10).sort((a,b)=>a-b)[25]*100)/100;
  report[name]={msPerTickOf40:{least:least(ticks),median:median(ticks)},msPerUnchangedRenderOf40:{least:least(same),median:median(same)},textsPerTick:changed.texts,formattersPerTick:changed.formatters};
  act(()=>root.unmount());root=null;
 }
 process.stdout.write(`\n[number-flow-perf] ${JSON.stringify(report)}\n`);
});
