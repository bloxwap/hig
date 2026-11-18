/**
 * The device load in fixtures/native/perf/number-flow.tsx, run under jest so that it is known to mount, run both scenarios with
 * no touch and say when it starts and ends. Timers and frames are jest's, so the frame counts it logs mean nothing here; the
 * commits do: one for each change, however many figures changed.
 */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,PixelRatio}=require('react-native');
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{const ref=React.useRef(null);if(ref.current===null){let current=initial;ref.current={get value(){return current;},set value(next){current=next&&next.__mockAnimation?next.toValue??current:next;}};}return ref.current;};
 return {__esModule:true,default:{View:RN.View,Text:RN.Text},cancelAnimation:()=>{},defineAnimation:starting=>({__mockAnimation:true,toValue:starting}),withTiming:toValue=>({__mockAnimation:true,toValue}),
  useSharedValue:shared,useAnimatedStyle:updater=>updater(),useFrameCallback:()=>React.useRef({setActive:()=>{}}).current,Easing:{bezier:(...points)=>({bezier:points})},ReduceMotion:{Never:'never',System:'system',Always:'always'}};
});
// The fixture workspace installs the React its Expo SDK pins; under jest it has to be the React the test renderer runs.
// (Where the workspace shares the root's React there is no second copy and nothing to point elsewhere.)
for(const entry of ['','/jsx-runtime','/jsx-dev-runtime']){
 const own=`../../fixtures/native/node_modules/react${entry}`;
 try{require.resolve(own);}catch{continue;}
 jest.doMock(own,()=>jest.requireActual(`react${entry}`));
}
const NumberFlowPerf=require('../../fixtures/native/perf/number-flow').default;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.useRealTimers();jest.restoreAllMocks();});

it('runs the tickers and then the interrupted figure by itself, and logs its start and its end',async()=>{
 jest.useFakeTimers();jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(1);
 const lines=[],done=jest.fn();jest.spyOn(console,'log').mockImplementation(line=>{if(String(line).startsWith('[perf]'))lines.push(String(line));});
 await act(async()=>{root=create(React.createElement(NumberFlowPerf,{onDone:done}));});
 const measure=()=>act(()=>{for(const probe of root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function'))probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width:12,height:24}}});});
 // Forty figures share one set of ten measured digits. Nothing is logged before the run starts.
 expect(root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function')).toHaveLength(10);measure();
 expect(lines).toEqual([]);
 for(let step=0;step<600&&!done.mock.calls.length;step++)await act(async()=>{await jest.advanceTimersByTimeAsync(50);});
 expect(done).toHaveBeenCalledTimes(1);expect(lines).toHaveLength(6);
 expect(lines[0]).toBe('[perf] number-flow start');expect(lines[3]).toMatch(/number-flow first-tick figures=40 ticks=1 /);
 expect(lines[4]).toMatch(/number-flow steady figures=40 ticks=10 /);
 expect(lines[5]).toBe('[perf] number-flow done');
 // Fifty ticks of forty figures are fifty commits. (React Native's jest frame is a zero timeout, so the interrupted figure gets
 // a value every millisecond here and React batches them by the 50 ms this test advances at a time; on a device it is one a frame.)
 expect(lines[1]).toMatch(/^\[perf\] number-flow tickers figures=40 ticks=50 updates=2000 commits=50 jsFrames=\d+ jsSlow=\d+ jsWorstMs=[\d.]+ uiFrames=\d+ uiSlow=\d+ uiWorstMs=[\d.]+$/);
 const interrupt=/^\[perf\] number-flow interrupt figures=1 updates=(\d+) commits=(\d+) jsFrames=(\d+) /.exec(lines[2]);
 expect(interrupt).not.toBeNull();expect(Number(interrupt[1])).toBeGreaterThan(150);expect(Number(interrupt[2])).toBeGreaterThan(30);expect(Number(interrupt[2])).toBeLessThanOrEqual(Number(interrupt[1]));expect(Number(interrupt[3])).toBe(Number(interrupt[1])-1);
 expect(root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function')).toHaveLength(10);
},60000);

it('stops when it is unmounted mid-run',async()=>{
 jest.useFakeTimers();const lines=[];jest.spyOn(console,'log').mockImplementation(line=>{if(String(line).startsWith('[perf]'))lines.push(String(line));});
 await act(async()=>{root=create(React.createElement(NumberFlowPerf));});
 for(let step=0;step<32;step++)await act(async()=>{await jest.advanceTimersByTimeAsync(50);});
 expect(lines).toEqual(['[perf] number-flow start']);act(()=>root.unmount());root=null;
 for(let step=0;step<320;step++)await jest.advanceTimersByTimeAsync(50);
 expect(lines).toEqual(['[perf] number-flow start']);
},60000);
