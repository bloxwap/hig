const React=require('react');
const {create,act}=require('react-test-renderer');
const {AppState,Platform}=require('react-native');
const {Stop,Path,Text:SvgText}=require('react-native-svg');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {AltimeterChart}=require('../../packages/hig/native/src/chart');
const {NumberFlow}=require('../../packages/hig/native/src/animated-number');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
let root,callback,appChange;
function tree(props,motion=false){return h(HIGProvider,{reducedMotion:motion},h(AltimeterChart,{summary:'Market',...props}));}
function chartView(){return root.root.findAll(n=>n.props.accessibilityRole==='image'&&n.props.onLayout)[0];}
function mount(props,motion=false){
 act(()=>{root=create(tree(props,motion));});
 act(()=>appChange('active'));
 act(()=>chartView().props.onLayout({nativeEvent:{layout:{width:390}}}));
}
function frame(now){act(()=>callback(now));}
beforeEach(()=>{
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(fn=>{callback=fn;return 1;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(()=>{});
 jest.spyOn(AppState,'addEventListener').mockImplementation((event,fn)=>{if(event==='change')appChange=fn;return {remove:jest.fn()};});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});

it('reads percentage profit and independently paints the short trail and net-loss capsule',()=>{
 mount({price:99,position:{side:'short',breakEvenPrice:100,pnl:-2,capsule:{returnRatio:-.02}},targets:[{id:'entry',price:100,label:'Entry'}]},true);
 frame(1000);
 expect(chartView().props.accessibilityLabel).toMatch(/-2.00%.*Entry.*100/);
 expect(root.root.findAllByType(Stop).some(s=>s.props.stopColor===nativeSrgb.positive)).toBe(true);
 // The pill is a native rounded box in the loss tone.
 expect(Object.assign({},...[root.root.findAll(n=>n.props.testID==='altimeter-pill'&&typeof n.type==='string')[0].props.style].flat(Infinity).filter(Boolean))).toMatchObject({borderColor:nativeSrgb.negative,borderRadius:18});
});
const burstLayer=()=>root.root.findAll(n=>n.props.testID==='altimeter-burst'&&typeof n.type==='string');
// The burst's progress is the one shared value a timing to 1 over two base motions is started on.
const burstsStarted=()=>global.__numberReanimated.animations.filter(animation=>animation.toValue===1&&animation.config.duration===520);
it('plays a burst only on a crossing, on the UI thread, and drops the effect when reduced motion is enabled',()=>{
 const {Profiler}=React;let commits=0;
 const props={price:100,targets:[{id:'entry',price:100.01,color:'#ff00aa'}],degen:true};
 // One root for the whole test: replacing it would mount a second chart and leave the first one's driver behind.
 const view=(change,motion)=>h(Profiler,{id:'chart',onRender:()=>{commits++;}},tree({...props,...change},motion));
 global.__numberReanimated.animations.length=0;
 act(()=>{root=create(view({}));});
 act(()=>appChange('active'));
 act(()=>chartView().props.onLayout({nativeEvent:{layout:{width:390}}}));
 frame(1000);
 // The ring and its 24 sparks are native views, mounted with DEGEN and still until a crossing: no canvas is drawn for a burst.
 expect(burstLayer()).toHaveLength(1);
 expect(burstLayer()[0].children).toHaveLength(25);
 expect(burstsStarted()).toHaveLength(0);
 act(()=>root.update(view({price:100.02})));frame(1200);frame(1500);
 // The price crossed the target: one burst starts, from 0, in the target's colour.
 expect(burstsStarted()).toHaveLength(1);
 expect(burstsStarted()[0].value.value).toBe(0);
 const ring=burstLayer()[0].children[0];
 expect(Object.assign({},...[ring.props.style].flat(Infinity).filter(Boolean))).toMatchObject({borderColor:'#ff00aa',borderWidth:2});
 // It plays without React: the frames while it runs draw nothing.
 commits=0;
 for(let now=1533;now<1700;now+=33)frame(now);
 expect(commits).toBe(0);
 act(()=>root.update(view({price:100.02},true)));
 expect(burstLayer()).toHaveLength(0);
});
it('shows stale data and disconnects and reconnects the feed with the app lifecycle',()=>{
 const stop=jest.fn();let push,expire;
 const feed=jest.fn((next,stale)=>{push=next;expire=stale;return stop;});
 mount({feed});act(()=>push(123));frame(1000);
 expect(chartView().props.accessibilityLabel).toMatch(/123/);
 act(()=>expire());frame(1300);expect(chartView().props.accessibilityLabel).not.toMatch(/123/);
 act(()=>appChange('background'));expect(stop).toHaveBeenCalledTimes(1);
 act(()=>appChange('active'));expect(feed).toHaveBeenCalledTimes(2);
 act(()=>root.unmount());root=null;expect(stop).toHaveBeenCalledTimes(2);
});

it('parks while empty, wakes on a price and parks again when the price clears',()=>{
 mount({price:null});
 global.requestAnimationFrame.mockClear();frame(1000);
 expect(global.requestAnimationFrame).not.toHaveBeenCalled();
 act(()=>root.update(tree({price:123})));
 expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
 frame(1200);
 expect(chartView().props.accessibilityLabel).toMatch(/123/);
 act(()=>root.update(tree({price:null})));
 global.requestAnimationFrame.mockClear();frame(1300);
 expect(chartView().props.accessibilityLabel).not.toMatch(/123/);
 expect(global.requestAnimationFrame).not.toHaveBeenCalled();
});

it('samples a steady price on its heartbeat while accepting feed changes immediately',()=>{
 jest.useFakeTimers({doNotFake:['requestAnimationFrame','cancelAnimationFrame']});
 try{
  let push;
  mount({feed:next=>{push=next;return ()=>{};}});
  act(()=>push(100));frame(1000);global.requestAnimationFrame.mockClear();
  act(()=>jest.advanceTimersByTime(199));
  expect(global.requestAnimationFrame).not.toHaveBeenCalled();
  act(()=>jest.advanceTimersByTime(1));
  expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
  frame(1200);global.requestAnimationFrame.mockClear();
  act(()=>push(101));
  expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
  frame(1240);
  expect(chartView().props.accessibilityLabel).toMatch(/101/);
 }finally{
  if(root){act(()=>root.unmount());root=null;}
  jest.useRealTimers();
 }
});

const strokes=()=>root.root.findAllByType(Path).filter(path=>path.props.strokeWidth===2.5);
// Test instances are compared by identity: a deep comparison of two different instances walks the whole fiber tree.
const same=(first,second)=>first.length===second.length&&first.every((node,index)=>node===second[index]);
const ladderRows=()=>root.root.findAllByType(SvgText).filter(text=>text.props.fontSize===13&&text.props.fillOpacity===.75);
const moved=node=>Object.assign({},...[node.props.style].flat(Infinity).filter(Boolean).flatMap(style=>style.transform??[]));
const trailSpaces=()=>root.root.findAll(node=>node.props.testID==='altimeter-trail'&&typeof node.type==='string')[0].children.filter(child=>typeof child!=='string'&&[child.props.style].flat(Infinity).some(style=>style?.transform?.some(part=>'translateX' in part)));

it.each(['ios','android'])('draws the trail once, as tiles and one patch beside the pill, and nothing in it per frame on %s',os=>{
 jest.replaceProperty(Platform,'OS',os);
 mount({price:100});
 frame(1000);
 const before=strokes(),drawn=before.map(path=>path.props.d);
 // A level trail is one wide tile and the patch that is still changing beside the pill.
 expect(before).toHaveLength(2);
 expect(drawn[0]).toMatch(/^M-4 2H\d+$/);
 // No path is animated: the UI thread moves what is drawn and draws nothing.
 expect(root.root.findAllByType(Path).every(path=>path.props.animatedProps===undefined)).toBe(true);
 // A new price draws the patch beside the pill again, with the tween it will follow, and no tile.
 act(()=>root.update(tree({price:100.03})));frame(1033);
 const after=strokes().map(path=>path.props.d),redrawn=after.filter((d,index)=>d!==drawn[index]);
 expect(after).toHaveLength(drawn.length);
 expect(redrawn).toHaveLength(1);
 expect(redrawn[0]).toMatch(/C[-\d. ]+H[-\d.]+$/);
 // While the price glides to it nothing is drawn at all.
 const gliding=strokes();
 frame(1066);frame(1100);frame(1133);
 expect(same(strokes(),gliding)).toBe(true);
 expect(strokes().map(path=>path.props.d)).toEqual(after);
 // The path it followed becomes tiles when the patch is next topped up; the wide tile the trail began with is never drawn again.
 for(let now=1166;now<=4200;now+=33)frame(now);
 expect(strokes().length).toBeGreaterThan(3);
 expect(strokes()[0]).toBe(before[0]);
 expect(strokes()[0].props.d).toBe(drawn[0]);
});

it('fades the trail under a veil that covers only the band the trail is in',()=>{
 const Svg=require('react-native-svg').default;
 mount({price:100});
 frame(1000);
 // The veil is one 4px strip stretched over a band of the chart.
 const band=()=>{
  const flat=svg=>Object.assign({},...[svg.props.style].flat(Infinity).filter(Boolean));
  const style=flat(root.root.findAllByType(Svg).find(svg=>flat(svg).transform?.some(part=>'scaleY' in part)));
  const stretch=style.transform[0].scaleY;
  return {top:style.top+2-stretch*2,bottom:style.top+2+stretch*2};
 };
 // A level trail at the middle of a 320px chart: the 4px its line is drawn in, and 16px either side.
 expect(band()).toEqual({top:142,bottom:178});
 // A price three rows up: the band takes in the rise the patch already holds and the 132px the trail will sink as the pill climbs it.
 act(()=>root.update(tree({price:100.03})));frame(1033);
 expect(band().top).toBeLessThanOrEqual(12);expect(band().top).toBeGreaterThanOrEqual(0);
 expect(band().bottom).toBeGreaterThanOrEqual(306);expect(band().bottom).toBeLessThanOrEqual(320);
});

it('keeps every tile in its place among the views when one leaves and another takes its key',()=>{
 mount({price:100});
 frame(1000);
 let before=strokes();
 // Twelve seconds of a quiet price: the wide tile the trail began with leaves, and the tiles after it come and go.
 let draws=0,drawn=before.map(path=>path.props.d).join();
 for(let now=1033;now<=13_000;now+=33){
  frame(now);
  const after=strokes(),paths=after.map(path=>path.props.d).join();
  if(paths!==drawn){draws++;drawn=paths;}
  // The views that are in both draws keep their order, so the mounting layer never takes one out to put it back.
  const kept=after.filter(path=>before.includes(path)),was=before.filter(path=>after.includes(path));
  expect(same(kept,was)).toBe(true);
  before=after;
 }
 expect(strokes().length).toBeGreaterThan(3);
 // A quiet price is drawn about every second and a half, to top up the patch beside the pill.
 expect(draws).toBeGreaterThan(4);expect(draws).toBeLessThan(12);
});

it('draws the ladder as native text on Android, where vector text loads its font for every label',()=>{
 jest.replaceProperty(Platform,'OS','android');
 mount({price:100,targets:[{id:'entry',price:100.02,label:'Entry'}]});
 frame(1000);
 const {Text:RNText}=require('react-native');
 const native=()=>root.root.findAllByType(RNText).filter(text=>typeof text.props.children==='string'&&/^\$\d/.test(text.props.children)&&[text.props.style].flat(Infinity).some(style=>style?.textAlign==='right'));
 const rows=native();
 expect(rows.length).toBeGreaterThan(8);
 expect(ladderRows()).toHaveLength(0);
 const style=Object.assign({},...[rows[0].props.style].flat(Infinity).filter(Boolean));
 // Right-aligned where the vector text ends, in a box centred on the row, at the ladder's size whatever the system font scale.
 expect(style).toMatchObject({left:390-32-160,width:160,height:18,lineHeight:18,fontSize:13,textAlign:'right',includeFontPadding:false,color:nativeSrgb.muted});
 expect(rows[0].props.allowFontScaling).toBe(false);
 expect(rows.some(text=>text.props.children==='$100.00')).toBe(true);
 // A row under a target's label is hidden, the rest are drawn at the ladder's strength.
 const strength=text=>Object.assign({},...[text.props.style].flat(Infinity).filter(Boolean)).opacity;
 expect(new Set(rows.map(strength))).toEqual(new Set([0,.75]));
});

it('keeps each ladder row it has drawn and draws only the rows that arrive',()=>{
 mount({price:100});
 frame(1000);
 const first=ladderRows(),labels=first.map(text=>text.props.children);
 expect(labels.length).toBeGreaterThan(8);
 // One canvas a row, so a row that stays is never drawn again.
 expect(new Set(first.map(text=>text.parent)).size).toBe(first.length);
 act(()=>root.update(tree({price:100.03})));
 // The price glides three rows up. Until it has gone that far the ladder has every row it needs.
 frame(1033);frame(1066);frame(1100);
 expect(same(ladderRows(),first)).toBe(true);
 // It is drawn with its samples, so the rows for the price's resting place arrive with the sample after the tween ends.
 for(let now=1133;now<=1466;now+=33)frame(now);
 const next=ladderRows(),moved=next.map(text=>text.props.children);
 // Three rows arrived at the top and three left the bottom; the rows between are the very same ones.
 expect(moved.slice(3)).toEqual(labels.slice(0,-3));
 expect(moved.slice(0,3).some(label=>labels.includes(label))).toBe(false);
 expect(same(next.slice(3),first.slice(0,-3))).toBe(true);
});

it('keeps the ladder it drew across a pause and starts only the trail again',()=>{
 mount({price:100});
 for(let now=1000;now<=3000;now+=33)frame(now);
 const rows=ladderRows(),labels=rows.map(text=>text.props.children);
 expect(strokes().length).toBeGreaterThan(2);
 // An opaque sheet covers the chart for five seconds; the price has moved a row when it comes back.
 act(()=>root.update(tree({price:100,paused:true})));
 expect(same(ladderRows(),rows)).toBe(true);
 act(()=>root.update(tree({price:100.01,paused:false})));
 frame(8000);
 // The ladder is on the same scale, in the same place among the views: the one row that arrived is drawn, and every
 // row that stayed is the row it was.
 const resumed=ladderRows();
 expect(resumed.map(text=>text.props.children).slice(1)).toEqual(labels.slice(0,-1));
 expect(same(resumed.slice(1),rows.slice(0,-1))).toBe(true);
 // The trail starts again from a level line: one wide tile and the patch beside the pill.
 expect(strokes()).toHaveLength(2);
 expect(strokes()[0].props.d).toMatch(/^M-4 2H\d+$/);
 // A price that came back far from the scale it left gets a new one.
 act(()=>root.update(tree({price:100.01,paused:true})));
 act(()=>root.update(tree({price:101,paused:false})));
 frame(20_000);
 expect(ladderRows().map(text=>text.props.children)).not.toEqual(labels);
 expect(ladderRows().some(text=>text.props.children==='$101.00')).toBe(true);
});

it('places the chart by transform: the driver before the first frame is drawn, the UI thread after',()=>{
 const reanimated=require('react-native-reanimated');
 let tick;const clock={setActive:jest.fn()};
 jest.spyOn(reanimated,'useFrameCallback').mockImplementation(callback=>{tick=callback;return clock;});
 jest.useFakeTimers({now:5_000_000,doNotFake:['requestAnimationFrame','cancelAnimationFrame']});
 try{
  mount({price:100});
  frame(1000);
  // The first space starts at the first frame: its origin, the pill's place, holds the newest price.
  expect(moved(trailSpaces()[0])).toEqual({translateX:0,translateY:0});
  // With a price on the chart the UI thread's clock runs.
  expect(clock.setActive).toHaveBeenLastCalledWith(true);
  // Half a second later on both clocks, the UI thread has carried the trail 25px left without a frame from the driver.
  jest.setSystemTime(5_000_500);
  act(()=>{tick({timestamp:90_500,timeSincePreviousFrame:8,timeSinceFirstFrame:500});});
  act(()=>root.update(tree({price:100})));
  expect(moved(trailSpaces()[0])).toEqual({translateX:-25,translateY:0});
  // A frame 8ms on moves it by the whole device pixels 8ms of travel covers.
  jest.setSystemTime(5_000_508);
  act(()=>{tick({timestamp:90_508,timeSincePreviousFrame:8,timeSinceFirstFrame:508});});
  act(()=>root.update(tree({price:100})));
  expect(moved(trailSpaces()[0]).translateX).toBeCloseTo(-25.5,5);
  // A new price reaches the UI thread as the tween's state; it works out the price in flight itself and moves the ladder with it.
  jest.setSystemTime(5_000_533);
  act(()=>root.update(tree({price:100.02})));frame(1533);
  jest.setSystemTime(5_000_683);
  act(()=>{tick({timestamp:90_683,timeSincePreviousFrame:8,timeSinceFirstFrame:683});});
  act(()=>root.update(tree({price:100.02})));
  // Half-way through the 300ms tween the price is half-way up its two rows.
  expect(moved(trailSpaces()[0]).translateY).toBeCloseTo(44,0);
  jest.setSystemTime(5_001_000);
  act(()=>{tick({timestamp:91_000,timeSincePreviousFrame:8,timeSinceFirstFrame:1000});});
  act(()=>root.update(tree({price:100.02})));
  expect(moved(trailSpaces()[0])).toEqual({translateX:-50,translateY:88});
 }finally{
  if(root){act(()=>root.unmount());root=null;}
  jest.useRealTimers();
 }
});

it('steps the chart from the driver under reduced motion, with the UI thread\'s clock off',()=>{
 const reanimated=require('react-native-reanimated');
 const clock={setActive:jest.fn()};
 jest.spyOn(reanimated,'useFrameCallback').mockImplementation(()=>clock);
 mount({price:100},true);
 frame(1000);
 expect(clock.setActive).not.toHaveBeenCalledWith(true);
 expect(moved(trailSpaces()[0])).toEqual({translateX:0,translateY:0});
 act(()=>root.update(tree({price:100.01},true)));frame(1200);
 // One sample on: 10px of travel and one row of rise, at once.
 expect(moved(trailSpaces()[0])).toEqual({translateX:-10,translateY:44});
});

it('keeps the capsule reading across steady chart samples and formats a changed price',()=>{
 const NativeFormat=Intl.NumberFormat;
 const reads=jest.fn();
 const formats=jest.spyOn(Intl,'NumberFormat').mockImplementation((locale,options)=>{
  const formatter=new NativeFormat(locale,options);
  return new Proxy(formatter,{get(target,key){
   if(key==='format')return value=>{reads(value);return target.format(value);};
   return Reflect.get(target,key,target);
  }});
 });
 mount({price:100});frame(1000);
 expect(formats.mock.calls.some(([,options])=>options?.signDisplay==='exceptZero')).toBe(false);
 reads.mockClear();
 for(let i=1;i<=5;i++)frame(1000+i*200);
 expect(reads).not.toHaveBeenCalled();
 act(()=>root.update(tree({price:101})));frame(2200);
 expect(reads).toHaveBeenCalledWith(101);
 expect(chartView().props.accessibilityLabel).toMatch(/101/);
});
it('reports a DEGEN crossing with its target and the direction the price moved',()=>{
 const onTargetCross=jest.fn(),props={price:100,targets:[{id:'entry',price:100.01}],degen:true,onTargetCross};
 mount(props);frame(1000);expect(onTargetCross).not.toHaveBeenCalled();
 act(()=>root.update(tree({...props,price:100.02})));frame(1200);frame(1500);
 expect(onTargetCross).toHaveBeenCalledTimes(1);expect(onTargetCross).toHaveBeenLastCalledWith(expect.objectContaining({id:'entry'}),'up');
});

it('rolls the pill figure with NumberFlow, as web does, in the pill tone and format',()=>{
 mount({price:100});frame(1000);
 const readout=()=>root.root.findAllByType(NumberFlow)[0];
 // Without a position the pill reads the mark in the action colour, as currency.
 expect(readout().props).toMatchObject({value:100,tone:'action',options:{style:'currency',currency:'USD'}});
 // The pill's SVG holds only its shape; no 16pt static reading is drawn under the rolling one.
 expect(root.root.findAllByType(SvgText).some(node=>node.props.fontSize===16)).toBe(false);
 // With a position it reads the return, signed, in the PnL tone.
 act(()=>root.update(tree({price:101,position:{side:'long',breakEvenPrice:100,pnl:1,capsule:{returnRatio:.01}}})));frame(2000);
 expect(readout().props).toMatchObject({value:.01,tone:'positive',options:{style:'percent',signDisplay:'exceptZero'}});
});

it('draws with React only when the price changes course, and now and then to top up a quiet trail',()=>{
 const {Profiler}=React;let commits=0;
 const view=props=>h(Profiler,{id:'chart',onRender:()=>{commits++;}},tree(props));
 act(()=>{root=create(view({price:100}));});
 act(()=>appChange('active'));
 act(()=>chartView().props.onLayout({nativeEvent:{layout:{width:390}}}));
 frame(1000);
 // The new price publishes once (the pill, the reading and the course the trail will follow); the driver works at most 30 Hz, so that is the frame at 1033.
 act(()=>root.update(view({price:100.02})));frame(1033);
 commits=0;
 // The tween runs for 300ms, and the pill then rests. The UI thread moves the trail, the ladder and the lines; React draws nothing,
 // through the tween and for more than a second after it.
 for(let now=1066;now<=2500;now+=33)frame(now);
 expect(commits).toBe(0);
 // Half a second before the pill reaches the end of what was drawn ahead of it, the patch is topped up: one draw.
 for(let now=2533;now<=2700;now+=33)frame(now);
 expect(commits).toBe(1);
});
