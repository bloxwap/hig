/**
 * NumberFlow on native: the roll's arithmetic as the UI thread runs it, and what the renderer mounts and starts. Reanimated is
 * replaced by a stand-in that runs the real animation objects against a clock the test moves, so a reel's position here is the
 * position a device would compute. What a device draws from it (smoothness, pixels) is not covered.
 */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,View:RNView,PixelRatio,StyleSheet}=require('react-native');
const mockClock={now:0,values:[],fades:[]};
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{
  const ref=React.useRef(null);
  if(ref.current===null){
   let current=initial,animation=null,fading=false;
   ref.current={get value(){return current;},set value(next){
    // As Reanimated's valueSetter does: an animation already "at" the value is dropped before it starts, and one that starts gets its first frame at once.
    if(next&&next.__mockDefined){const created=next.factory(),previous=animation;animation=null;if(current===created.current)return;created.onStart(created,current,mockClock.now,previous);animation=created;this.frame(mockClock.now);return;}
    if(next&&next.__mockTiming){mockClock.fades.push({value:this,toValue:next.toValue,config:next.config});current=next.toValue;animation=null;fading=true;return;}
    current=next;animation=null;fading=false;
   },get animating(){return animation!==null;},get fading(){return fading;},stop(){animation=null;fading=false;},frame(now){if(!animation)return;const finished=animation.onFrame(animation,now);current=animation.current;if(finished)animation=null;}};
   mockClock.values.push(ref.current);
  }
  return ref.current;
 };
 return {__esModule:true,default:{View:RN.View,Text:RN.Text},cancelAnimation:value=>value.stop(),defineAnimation:(starting,factory)=>({__mockDefined:true,factory}),withTiming:(toValue,config)=>({__mockTiming:true,toValue,config}),
  useSharedValue:shared,useAnimatedStyle:updater=>updater(),Easing:{bezier:(...points)=>({bezier:points})},ReduceMotion:{Never:'never',System:'system',Always:'always'}};
});
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AnimatedNumberReadout,NumberFlow,NumberFlowGroup}=require('../../packages/hig/native/src/animated-number');
const {createNumberFlowRoll,createNumberReelModel,numberFlowReelOffset,numberReelPlaces,sampleReelEasing}=require('../../packages/hig/native/src/animated-number-model');
const {numberFlowCurve,numberFlowEasingSamples,sampleNumberFlowEasing}=require('../../packages/hig/contracts/dist/number-flow.js');
const h=React.createElement;
let root;
beforeEach(()=>{mockClock.now=0;mockClock.values.length=0;mockClock.fades.length=0;jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(1);});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
const flow=(props={},provider={})=>h(HIGProvider,provider,h(NumberFlow,{value:1,label:'Price',testID:'price',...props}));
function mount(element){act(()=>{root=create(element);});return root.root;}
function update(element){act(()=>root.update(element));}
function measure(width=12,height=24){const probes=root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function');expect(probes).toHaveLength(10);act(()=>{for(const probe of probes)probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width,height}}});});}
const reading=()=>root.root.findAllByType(RNText).find(node=>node.props.testID==='price');
/** The boxes that hold one place each, in order, and the glyph rows inside each. */
const cells=()=>root.root.findAllByType(RNView).filter(node=>{const style=StyleSheet.flatten(node.props.style);return style?.overflow==='hidden'&&style.height===24;});
const rows=cell=>cell.findAllByType(RNText).map(node=>node.props.children).join('');
/** Moves the clock and runs one frame of everything in flight. */
const advance=ms=>{mockClock.now+=ms;for(const value of mockClock.values)value.frame(mockClock.now);};
/** The reels in flight or landed: the shared values holding a position (every strip makes a position, then an opacity). */
const positions=()=>mockClock.values.filter((_,index)=>index%2===0);

describe('the roll, as the UI thread runs it',()=>{
 const linear=numberFlowEasingSamples('linear');
 const start=(roll,value,now,previous)=>{roll.onStart(roll,value,now,previous);return roll;};
 it('turns a reel from where it rests to its digit and then reports finished',()=>{
  const roll=start(createNumberFlowRoll(5,1000,linear),2,0,null);
  expect(roll.toValue).toBe(7);expect(roll.current).toBe(2);expect(roll.reduceMotion).toBe(false);
  // Before it starts it is "at" no value, so Reanimated never mistakes a reel resting on 0 for one already there.
  expect(createNumberFlowRoll(5,1000,linear).current).toBeNaN();
  expect(roll.onFrame(roll,500)).toBe(false);expect(roll.current).toBeCloseTo(4.5,5);
  expect(roll.onFrame(roll,1000)).toBe(true);expect(roll.current).toBe(7);
 });
 it('adds a new turn to the turns in flight without a jump, a restart or a wrong landing',()=>{
  const first=start(createNumberFlowRoll(4,1000,linear),0,0,null);first.onFrame(first,500);expect(first.current).toBeCloseTo(2,5);
  // Half way to 4 the reel is asked for 6: it is still at 2, it keeps the first turn's speed and adds the second's.
  const second=start(createNumberFlowRoll(2,1000,linear),first.current,500,first);
  expect(second.toValue).toBe(6);expect(second.current).toBeCloseTo(2,5);expect(second.turns).toHaveLength(2);
  second.onFrame(second,750);expect(second.current).toBeCloseTo(2+1+0.5,5);
  second.onFrame(second,1000);expect(second.current).toBeCloseTo(4+1,5);expect(second.turns).toHaveLength(1);
  expect(second.onFrame(second,1500)).toBe(true);expect(second.current).toBe(6);
  // Turning back mid-flight nets out the same way.
  const up=start(createNumberFlowRoll(3,1000,linear),0,0,null);up.onFrame(up,500);const down=start(createNumberFlowRoll(-3,1000,linear),up.current,500,up);
  expect(down.toValue).toBe(0);down.onFrame(down,1000);expect(down.current).toBeCloseTo(1.5,5);expect(down.onFrame(down,1500)).toBe(true);expect(down.current).toBe(0);
 });
 it('starts from the nearest whole digit after anything else moved the reel, and lands at once with no duration',()=>{
  const roll=start(createNumberFlowRoll(1,1000,linear),8.6,0,{type:'timing',toValue:9});expect(roll.toValue).toBe(10);
  const snap=start(createNumberFlowRoll(3,0,linear),4,0,null);expect(snap.current).toBe(7);expect(snap.onFrame(snap,1)).toBe(true);expect(snap.current).toBe(7);
 });
 it('follows NumberFlow’s curve exactly as the shared model samples it',()=>{
  for(const progress of [0,0.013,0.2,0.5,0.777,1])expect(sampleReelEasing(numberFlowCurve,progress)).toBeCloseTo(sampleNumberFlowEasing(numberFlowCurve,progress),10);
  const roll=start(createNumberFlowRoll(10,900,numberFlowCurve),0,0,null);roll.onFrame(roll,450);expect(roll.current).toBeCloseTo(10*sampleNumberFlowEasing(numberFlowCurve,0.5),8);
 });
 it('places the strip for any position, wrapping where the last row repeats the first',()=>{
  expect(numberFlowReelOffset(0,10,24)).toBe(-0);expect(numberFlowReelOffset(3.5,10,24)).toBe(-84);expect(numberFlowReelOffset(9.5,10,24)).toBe(-228);
  // 10 is the same picture as 0, and one step down from 0 is 9.
  expect(numberFlowReelOffset(10,10,24)).toBe(-0);expect(numberFlowReelOffset(27,10,24)).toBe(-168);expect(numberFlowReelOffset(-1,10,24)).toBe(-216);expect(numberFlowReelOffset(-0.5,6,24)).toBe(-132);
 });
 it('names each reel’s place: integers from the ones up, fractions from the tenths down, exponents none',()=>{
  expect(numberReelPlaces(createNumberReelModel(1234.56,'en-US',{},undefined,'ltr')).map(place=>[place.key,place.place,place.digit])).toEqual([['integer:3',3,1],['integer:2',2,2],['integer:1',1,3],['integer:0',0,4],['fraction:0',-1,5],['fraction:1',-2,6]]);
  expect(numberReelPlaces(createNumberReelModel(1.5e10,'en-US',{notation:'scientific'},undefined,'ltr')).filter(place=>place.place===null)).toHaveLength(2);
 });
});

describe('NumberFlow on native',()=>{
 it('draws one glyph per place at rest and mounts no reel until a place turns',()=>{
  mount(flow({value:1234.5,prefix:'$'}));measure();
  expect(cells().map(rows)).toEqual(['1','2','3','4','5']);expect(mockClock.values).toHaveLength(0);
  expect(reading().props.accessibilityLabel).toBe('Price: $1,234.5');expect(reading().props.accessibilityLiveRegion).toBeUndefined();
  // Sliding places also stay as one glyph until their first animated change.
  act(()=>root.unmount());mount(h(HIGProvider,null,h(AnimatedNumberReadout,{value:1234.5,testID:'price'})));measure();expect(cells().map(rows)).toEqual(['1','2','3','4','5']);expect(mockClock.values).toHaveLength(0);
 });
 it('rolls only the places that changed, through the digits between, on NumberFlow’s timing',()=>{
  mount(flow({value:1234}));measure();update(flow({value:1237}));
  // The ones gets its strip in the same commit, showing the digit it replaces; the other places are untouched.
  expect(cells().map(rows)).toEqual(['1','2','3','01234567890']);expect(positions()).toHaveLength(1);
  const [position]=positions();expect(position.value).toBe(4);expect(position.animating).toBe(true);
  advance(450);expect(position.value).toBeCloseTo(4+3*sampleNumberFlowEasing(numberFlowCurve,0.5),6);expect(position.value).toBeGreaterThan(4);expect(position.value).toBeLessThan(7);
  advance(450);expect(position.value).toBe(7);expect(position.animating).toBe(false);
  expect(reading().props.accessibilityLabel).toBe('Price: 1,237');
 });
 it('wraps with the trend and joins a new value to the roll in flight',()=>{
  mount(flow({value:9,trend:1}));measure();update(flow({value:10,trend:1}));
  // The ones goes 9 to 0 one step up; the new tens arrives turning from zero and fading in.
  const [tens,ones]=positions();expect(cells().map(rows)).toEqual(['01234567890','01234567890']);
  // A strip starts one turn before its digit, wherever that is: -1 is the 9 above 0, the same picture as 9.
  expect(tens.value).toBe(0);expect(ones.value).toBe(-1);expect(numberFlowReelOffset(ones.value,10,24)).toBe(-216);expect(mockClock.fades).toHaveLength(1);expect(mockClock.fades[0].config).toMatchObject({duration:450,reduceMotion:'never'});
  advance(300);const mid=ones.value;expect(mid).toBeGreaterThan(-1);expect(mid).toBeLessThan(0);
  update(flow({value:12,trend:1}));expect(ones.value).toBeCloseTo(mid,10);
  advance(900);expect(ones.value).toBe(2);expect(numberFlowReelOffset(ones.value,10,24)).toBe(-48);expect(tens.value).toBe(1);
  // Unmounting stops whatever is still moving.
  update(flow({value:19,trend:1}));expect(ones.animating).toBe(true);act(()=>root.unmount());root=null;expect(ones.animating).toBe(false);
 });
 it('takes each digit’s own short way without a trend',()=>{
  mount(flow({value:19,trend:0}));measure();update(flow({value:20,trend:0}));
  const [tens,ones]=positions();advance(900);expect(tens.value).toBe(2);expect(ones.value).toBe(0);
  // A reel resting on 0 turns like any other.
  update(flow({value:23,trend:0}));expect(ones.animating).toBe(true);advance(900);expect(ones.value).toBe(3);
 });
 it('wraps a limited place at its limit and loops lower places when continuous',()=>{
  const seconds=value=>flow({value,trend:-1,digits:{1:{max:5}},options:{minimumIntegerDigits:2}});
  mount(seconds(0));measure();update(seconds(59));
  const [tens,ones]=positions();expect(cells().map(rows)).toEqual(['0123450','01234567890']);
  // One step down each: the tens from the 0 that follows 5 on its six-glyph reel, never through 9, 8, 7 and 6.
  expect(tens.value).toBe(6);expect(ones.value).toBe(10);
  advance(900);expect(tens.value).toBe(5);expect(numberFlowReelOffset(tens.value,6,24)).toBe(-120);expect(ones.value).toBe(9);
  act(()=>root.unmount());mockClock.values.length=0;
  mount(flow({value:120,trend:1,continuous:true}));measure();update(flow({value:130,trend:1,continuous:true}));
  // The ones shows 0 before and after, and goes once round on the way.
  const [loopTens,loopOnes]=positions();expect(loopOnes.value).toBe(-10);advance(300);expect(loopOnes.value).toBeGreaterThan(-9);expect(loopOnes.value).toBeLessThan(-1);
  advance(600);expect(loopTens.value).toBe(3);expect(loopOnes.value).toBe(0);
 });
 it('takes its timing from `duration`, `transformTiming` and `spinTiming`',()=>{
  mount(flow({value:1,duration:320}));measure();update(flow({value:2,duration:320}));
  let [position]=positions();advance(319);expect(position.animating).toBe(true);advance(1);expect(position.value).toBe(2);
  act(()=>root.unmount());mockClock.values.length=0;
  const timed={transformTiming:{duration:700},spinTiming:{duration:200,easing:'linear'}};mount(flow({value:1,...timed}));measure();update(flow({value:3,...timed}));
  [position]=positions();advance(100);expect(position.value).toBeCloseTo(2,3);advance(100);expect(position.value).toBe(3);
 });
 it('draws every new value at once under reduced motion or with `animated` off, and lands a reel already turning',()=>{
  mount(flow({value:1},{reducedMotion:true}));measure();update(flow({value:2},{reducedMotion:true}));
  expect(positions()).toHaveLength(0);expect(cells().map(rows)).toEqual(['2']);
  update(flow({value:3,animated:false}));expect(positions()).toHaveLength(0);expect(cells().map(rows)).toEqual(['3']);
  update(flow({value:4,duration:0}));expect(positions()).toHaveLength(0);expect(cells().map(rows)).toEqual(['4']);
  update(flow({value:8}));const [position]=positions();advance(100);expect(position.animating).toBe(true);
  update(flow({value:5},{reducedMotion:true}));expect(position.animating).toBe(false);expect(position.value).toBe(5);
  update(flow({value:6,animated:false}));expect(position.value).toBe(6);
  // Turning motion off with no new value lands a reel in flight too.
  update(flow({value:9}));advance(100);expect(position.animating).toBe(true);update(flow({value:9},{reducedMotion:true}));expect(position.animating).toBe(false);expect(position.value).toBe(9);
 });
 it('treats a reading it could not lay out, or an unknown value, as a new start rather than a change',()=>{
  mount(flow({value:12}));measure();update(flow({value:null}));expect(cells()).toHaveLength(0);expect(reading().props.accessibilityLabel).toBe('Price: —');
  update(flow({value:34}));expect(positions()).toHaveLength(0);expect(cells().map(rows)).toEqual(['3','4']);
  act(()=>root.unmount());mount(flow({value:12},{direction:'rtl'}));expect(root.root.findAllByType(RNText)).toHaveLength(1);
 });
 it('shows the digit it reads after a limited place held a digit past its limit',()=>{
  const seconds=value=>flow({value,trend:1,digits:{1:{max:5}},options:{minimumIntegerDigits:2}});
  /** The glyph the tens reel shows: the row its position puts in the window. */
  const tensShows=()=>{const [tens]=positions(),glyphs=rows(cells()[0]);return glyphs[Math.round(-numberFlowReelOffset(tens.value,glyphs.length-1,24)/24)];};
  mount(seconds(30));measure();update(seconds(75));
  // 7 does not fit a reel of six, so the tens turn on all ten glyphs, there and back.
  expect(rows(cells()[0])).toBe('01234567890');advance(900);expect(tensShows()).toBe('7');
  update(seconds(12));expect(rows(cells()[0])).toBe('01234567890');expect(tensShows()).toBe('7');advance(900);expect(tensShows()).toBe('1');
  // Back inside its limit the place takes its short reel again, starting from the digit it shows.
  update(seconds(23));expect(rows(cells()[0])).toBe('0123450');expect(tensShows()).toBe('1');advance(900);expect(tensShows()).toBe('2');
  // With motion off the reel still fits whatever digit it is given.
  update(flow({value:81,trend:1,digits:{1:{max:5}},options:{minimumIntegerDigits:2}},{reducedMotion:true}));expect(rows(cells()[0])).toBe('01234567890');expect(tensShows()).toBe('8');
 });
 it('treats a new locale or format as a new reading, not a change to roll',()=>{
  mount(flow({value:1234}));measure();update(flow({value:1234,options:{style:'percent'}}));
  expect(positions()).toHaveLength(0);expect(reading().props.accessibilityLabel).toBe('Price: 123,400%');
  update(flow({value:2345,options:{style:'percent'}},{locale:'de-DE'}));expect(positions()).toHaveLength(0);
  // The next change of value in the same format rolls as usual.
  update(flow({value:2346,options:{style:'percent'}},{locale:'de-DE'}));expect(positions().filter(position=>position.animating)).toHaveLength(1);
  // A reel already turning lands when the format changes under it.
  update(flow({value:2346,options:{style:'percent',minimumFractionDigits:1}},{locale:'de-DE'}));expect(positions().some(position=>position.animating)).toBe(false);
 });
 it('lands a place that is still fading in when motion is turned off',()=>{
  mount(flow({value:9,trend:1}));measure();update(flow({value:10,trend:1}));
  const opacity=mockClock.fades[0].value;expect(opacity.fading).toBe(true);
  update(flow({value:10,trend:1},{reducedMotion:true}));expect(opacity.fading).toBe(false);expect(opacity.value).toBe(1);
 });
 it('keeps one accessible reading and hides the moving copy',()=>{
  mount(flow({value:1234.5,prefix:'$',suffix:' USD',stale:true}));measure();update(flow({value:1234.6,prefix:'$',suffix:' USD',stale:true}));
  expect(root.root.findAllByType(RNText).filter(node=>node.props.testID==='price')).toHaveLength(1);expect(reading().props.accessibilityLabel).toBe('Price: $1,234.6 USD (stale)');
  const visual=root.root.findAllByType(RNView).find(node=>node.props.accessibilityElementsHidden===true&&StyleSheet.flatten(node.props.style)?.direction==='ltr');
  expect(visual.props.importantForAccessibility).toBe('no-hide-descendants');expect(visual.findAllByType(RNText).every(node=>node.props.accessible===false)).toBe(true);
 });
});

describe('one component under two names',()=>{
 it('NumberFlow flows and AnimatedNumberReadout slides by default, and `motion` chooses either way',()=>{
  const turned=(Component,props)=>{mount(h(HIGProvider,null,h(Component,{value:1,testID:'price',...props})));measure();update(h(HIGProvider,null,h(Component,{value:2,testID:'price',...props})));const result={rolls:positions().some(value=>value.animating),fades:mockClock.fades.length};act(()=>root.unmount());root=null;mockClock.values.length=0;mockClock.fades.length=0;return result;};
  // The stand-in records a slide as a timing and a flow as a roll.
  expect(turned(NumberFlow,{})).toEqual({rolls:true,fades:0});expect(turned(AnimatedNumberReadout,{})).toEqual({rolls:false,fades:1});
  expect(turned(AnimatedNumberReadout,{motion:'flow'})).toEqual({rolls:true,fades:0});expect(turned(NumberFlow,{motion:'slide'})).toEqual({rolls:false,fades:1});
 });
 it('NumberFlowGroup draws its children and nothing else',()=>{
  mount(h(HIGProvider,null,h(NumberFlowGroup,null,h(NumberFlow,{value:1,testID:'price'}),h(NumberFlow,{value:2,testID:'other'}))));
  expect(root.root.findAllByType(RNText).filter(node=>node.props.testID).map(node=>node.props.testID)).toEqual(['price','other']);
 });
});

it('preserves decorations and lets larger digits use their natural line height',()=>{
 const style={fontSize:32,textDecorationLine:'line-through',textDecorationColor:'red',textDecorationStyle:'solid'};
 mount(flow({style}));
 expect(StyleSheet.flatten(reading().props.style)).toMatchObject({...style,lineHeight:undefined});
 update(flow({style:{...style,lineHeight:40}}));
 expect(StyleSheet.flatten(reading().props.style).lineHeight).toBe(40);
});

describe('shared native digit measurements',()=>{
 const group=items=>h(HIGProvider,null,items.map(([id,props])=>h(NumberFlow,{key:id,testID:id,value:1,...props})));
 const probes=()=>root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function');
 const widths=()=>root.root.findAllByType(RNView).map(node=>StyleSheet.flatten(node.props.style)).filter(style=>style?.overflow==='hidden').map(style=>style.width);
 const event=width=>({nativeEvent:{layout:{x:0,y:0,width,height:24}}});
 it('measures matching readouts together and transfers the probes when their owner leaves',()=>{
  mount(group([['a',{}],['b',{}],['c',{tone:'muted'}]]));
  const late=probes().map(node=>node.props.onLayout);
  measure(12,24);expect(widths()).toEqual([12,12,12]);
  update(group([['b',{}],['c',{tone:'muted'}]]));
  expect(widths()).toEqual([12,12]);expect(probes()).toHaveLength(10);
  act(()=>late.forEach(layout=>layout(event(100))));
  expect(widths()).toEqual([12,12]);
  measure(13,24);expect(widths()).toEqual([13,13]);
 });
 it('keeps a new face independent of queued measurements from the old one',()=>{
  mount(group([['a',{}],['b',{}]]));
  const late=probes().map(node=>node.props.onLayout);
  act(()=>late.slice(0,5).forEach(layout=>layout(event(100))));
  update(group([['a',{style:{fontSize:32}}],['b',{}]]));
  expect(probes()).toHaveLength(20);
  act(()=>late.slice(5).forEach(layout=>layout(event(100))));
  expect(widths()).toEqual([]);
  act(()=>probes().forEach(probe=>probe.props.onLayout(event(StyleSheet.flatten(probe.props.style).fontSize===32?30:12))));
  expect(widths()).toEqual([30,12]);
 });
 it('remeasures a changed font scale and keeps numbering systems separate',()=>{
  const items=[['a',{}],['b',{options:{numberingSystem:'beng'}}]];
  mount(group(items));expect(probes()).toHaveLength(20);
  act(()=>probes().forEach(probe=>probe.props.onLayout(event(12))));
  PixelRatio.getFontScale.mockReturnValue(2);
  update(group(items));expect(widths()).toEqual([]);
  act(()=>probes().forEach(probe=>probe.props.onLayout(event(24))));
  expect(widths()).toEqual([24,24]);
 });
});
