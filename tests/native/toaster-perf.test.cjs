/**
 * What one `toast()` costs the native host in React work, counted rather than timed: commits of the Toaster (React.Profiler),
 * renders of a notice's card and of the capsule inside it, gestures built, and commits of a 200-row list beside the host,
 * which must never render for a toast. Reanimated and Gesture Handler are the same stand-ins as in toaster.test.cjs, with
 * counters. HIG_PERF_REPORT=1 also logs the counts and the time React spends per call under jest (V8, development React):
 * read that against itself before and after a change, never as a device's time. The run on a device is
 * fixtures/native/perf/toast.tsx.
 */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,View:RNView}=require('react-native');
const mockSeen={reactions:[],cards:0,gestures:0,capsules:0};
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{const ref=React.useRef(null);if(ref.current===null){let current=initial;ref.current={get value(){return current;},set value(next){current=next&&next.__animation?next.to:next;}};}return ref.current;};
 const animation=to=>({__animation:true,to});
 return {__esModule:true,default:{View:RN.View},cancelAnimation:()=>{},Easing:{bezier:(...points)=>points},ReduceMotion:{Always:'always',System:'system',Never:'never'},runOnJS:fn=>fn,
  useSharedValue:shared,useAnimatedStyle:updater=>({__style:updater}),withTiming:animation,withSpring:animation,
  useAnimatedReaction:(prepare,react)=>{const ref=React.useRef({previous:null});ref.current.prepare=prepare;ref.current.react=react;React.useEffect(()=>{const reaction=ref.current;mockSeen.reactions.push(reaction);return()=>{mockSeen.reactions.splice(mockSeen.reactions.indexOf(reaction),1);};},[]);}};
});
jest.mock('react-native-gesture-handler',()=>{
 const pan=()=>{mockSeen.gestures++;const gesture={config:{},handlers:{}};for(const name of ['enabled','activeOffsetX','activeOffsetY'])gesture[name]=value=>{gesture.config[name]=value;return gesture;};for(const name of ['onBegin','onStart','onChange','onEnd','onFinalize'])gesture[name]=handler=>{gesture.handlers[name]=handler;return gesture;};return gesture;};
 // Every render of a card renders its detector, so this counts them.
 return {Gesture:{Pan:pan},GestureDetector:function GestureDetector({children}){mockSeen.cards++;return children;}};
});
// The capsule draws its severity symbol once per render, so this counts renders of the capsule wherever it is memoised.
jest.mock('../../packages/hig/native/src/icons',()=>{
 const React=require('react'),actual=jest.requireActual('../../packages/hig/native/src/icons');
 return {...actual,SeverityIcon:function SeverityIcon(props){mockSeen.capsules++;return React.createElement(actual.SeverityIcon,props);}};
});
const {Toaster,toast,dismissToast}=require('../../packages/hig/native/src/toast');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
const commits={host:0,rows:0,hostMs:0};
const onRender=(id,phase,actual)=>{commits[id]++;if(id==='host')commits.hostMs+=actual;};
const ROWS=Array.from({length:200},(_,index)=>index);
function Rows(){return h(RNView,null,ROWS.map(index=>h(RNText,{key:index},`Row ${index}`)));}
let root;
const mount=(props={})=>{act(()=>{root=create(h(HIGProvider,null,h(React.Profiler,{id:'rows',onRender},h(Rows)),h(React.Profiler,{id:'host',onRender},h(Toaster,{testID:'toasts',...props}))));});};
afterEach(()=>{if(root)act(()=>root.unmount());root=null;act(()=>dismissToast());mockSeen.reactions.length=0;jest.useRealTimers();});
const flush=()=>act(()=>{for(let pass=0;pass<3;pass++)for(const reaction of [...mockSeen.reactions]){const next=reaction.prepare();reaction.react(next,reaction.previous);reaction.previous=next;}});
const cards=()=>root.root.findAll(node=>node.props.testID==='toasts-toast'&&typeof node.type==='string');
// A device lays a view out once, when it mounts: only cards that have not reported a height do.
const laid=new WeakSet();
const layout=(height=44)=>{act(()=>{for(const card of cards()){if(laid.has(card.props.onLayout))continue;laid.add(card.props.onLayout);card.props.onLayout({nativeEvent:{layout:{width:240,height}}});}});flush();};
/** What React did since the last call: commits of the host and of the rows, card and capsule renders, gestures built. */
let last={host:0,rows:0,cards:0,capsules:0,gestures:0};
const spent=()=>{const now={host:commits.host,rows:commits.rows,cards:mockSeen.cards,capsules:mockSeen.capsules,gestures:mockSeen.gestures},delta=Object.fromEntries(Object.keys(now).map(key=>[key,now[key]-last[key]]));last=now;return delta;};
const report=(name,value)=>{if(process.env.HIG_PERF_REPORT==='1')console.log(`[toaster-perf] ${name} ${JSON.stringify(value)}`);};

it('raising a notice commits the host once and never the rows beside it',()=>{
 mount();spent();
 const raised=[];
 for(let index=0;index<12;index++){act(()=>{toast(`Notice ${index+1}`,{severity:['info','success','warning','error'][index%4]});});layout();raised.push(spent());}
 report('raise 12, per notice',raised);
 // One commit per notice: the height it reports and the restack go to the UI thread without a render.
 expect(raised.map(step=>step.host)).toEqual(Array(12).fill(1));
 expect(raised.map(step=>step.rows)).toEqual(Array(12).fill(0));
 // The new card, the old front, and from the fourth on the card that goes out of sight; the cards between keep their props and are skipped.
 expect(raised.map(step=>step.cards)).toEqual([1,2,2,3,3,3,3,3,3,3,3,3]);
 // Three visible and one spare, however many are waiting.
 expect(cards()).toHaveLength(4);
});

it('replacing a notice by id commits the host once and renders only that notice',()=>{
 mount({expand:true});
 act(()=>{toast('One',{duration:Infinity});toast('Sending',{id:'job',duration:Infinity});toast('Three',{duration:Infinity});});layout();spent();
 const replaced=[];
 for(let index=0;index<40;index++){act(()=>{toast(`Sending ${index+1}`,{id:'job',duration:Infinity});});flush();replaced.push(spent());}
 report('replace 40, per call',replaced[0]);
 for(const step of replaced)expect(step).toEqual({host:1,rows:0,cards:1,capsules:1,gestures:0});
 expect(cards()).toHaveLength(3);
});

it('dismissing every notice mounts no card for the ones waiting behind the stack, and leaves no card, timer or reaction',()=>{
 jest.useFakeTimers();
 mount();spent();
 // Every notice was the front when it was raised, so every one has been drawn and laid out; four still are.
 for(let index=0;index<12;index++){act(()=>{toast(`Notice ${index+1}`);});layout();}
 spent();const reactions=mockSeen.reactions.length;
 act(()=>{dismissToast();});flush();const leaving=spent();
 // The four that are drawn play their exit. The eight behind them have nothing on screen: no card is mounted to take them away.
 expect(cards()).toHaveLength(4);expect(leaving.cards).toBe(4);expect(mockSeen.reactions).toHaveLength(reactions);
 // Only the front stops taking touches, so only its gesture is built again.
 expect(leaving.gestures).toBe(1);
 // One commit marks them as leaving, and one drops the ones that were not drawn.
 expect(leaving.host).toBe(2);
 act(()=>{jest.advanceTimersByTime(250);});const dropped=spent();
 report('dismiss all of 12',{leaving,dropped,timers:jest.getTimerCount(),reactions:mockSeen.reactions.length});
 // The drawn ones go together once their exit has played.
 expect(dropped).toEqual({host:1,rows:0,cards:0,capsules:0,gestures:0});
 expect(root.toJSON().children.filter(child=>child.props.testID==='toasts')).toHaveLength(0);
 expect(jest.getTimerCount()).toBe(0);expect(mockSeen.reactions).toHaveLength(0);expect(leaving.rows).toBe(0);
});

it('dismissing one notice that waits behind the stack drops it at once and tells its owner',()=>{
 jest.useFakeTimers();
 mount();const dismissed=jest.fn();
 act(()=>{toast('Waiting',{id:'waiting',onDismiss:dismissed});});layout();
 for(let index=0;index<5;index++){act(()=>{toast(`Notice ${index+1}`);});layout();}
 spent();
 act(()=>{dismissToast('waiting');});flush();const left=spent();
 expect(dismissed).toHaveBeenCalledTimes(1);
 // Nothing is mounted or drawn for it, and no timer waits to drop it.
 expect(left.cards).toBe(0);expect(left.gestures).toBe(0);expect(cards()).toHaveLength(4);
 const timers=jest.getTimerCount();act(()=>{toast('After');});layout();
 // It is gone from the store: the next notice does not bring it back, and the stack still runs.
 expect(root.root.findAllByType(RNText).map(node=>node.props.children)).not.toContain('Waiting');expect(jest.getTimerCount()).toBeGreaterThanOrEqual(timers);
});

it('lets a notice run out without rendering the rows, and leaves no timer when the last one has gone',()=>{
 jest.useFakeTimers();
 mount();spent();
 for(let index=0;index<5;index++){act(()=>{toast(`Notice ${index+1}`);});layout();}
 spent();
 // Each front leaves after its four seconds and uncovers the next, which is laid out by then.
 for(let pass=0;pass<12&&cards().length>0;pass++){act(()=>{jest.advanceTimersByTime(4000);});flush();act(()=>{jest.advanceTimersByTime(250);});layout();}
 const ran=spent();report('five run out',{...ran,timers:jest.getTimerCount()});
 expect(cards()).toHaveLength(0);expect(jest.getTimerCount()).toBe(0);expect(ran.rows).toBe(0);
});

// Not a test of behaviour: the time React spends per call under jest, for a before and after. Skipped unless asked for.
(process.env.HIG_PERF_REPORT==='1'?it:it.skip)('reports the time per call under jest',()=>{
 const time=run=>{const start=process.hrtime.bigint();run();return Number(process.hrtime.bigint()-start)/1e6;};
 const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
 mount();
 const rounds=[];
 for(let round=0;round<7;round++){
  commits.hostMs=0;const raise=time(()=>{for(let index=0;index<200;index++){act(()=>{toast(`Notice ${index+1}`,{duration:Infinity});});layout();}})/200,raiseRender=commits.hostMs/200;
  commits.hostMs=0;const replace=time(()=>{for(let index=0;index<200;index++)act(()=>{toast(`Sending ${index+1}`,{id:'job',duration:Infinity});});})/200,replaceRender=commits.hostMs/200;
  // The store is full by now: sixteen notices and the replaced one, four of them drawn.
  commits.hostMs=0;const dismissAll=time(()=>{act(()=>{dismissToast();});}),dismissAllRender=commits.hostMs;
  flush();act(()=>root.unmount());root=null;act(()=>dismissToast());mockSeen.reactions.length=0;mount();
  rounds.push({raise,raiseRender,replace,replaceRender,dismissAll,dismissAllRender});
 }
 report('ms per call under jest (median of 7 rounds: 200 raised, 200 replaced, one dismissal of a full store)',Object.fromEntries(Object.keys(rounds[0]).map(key=>[key,Number(median(rounds.map(round=>round[key])).toFixed(4))])));
});
