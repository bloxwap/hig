/** What a native burst costs React and the view tree, counted: views, animated styles, clocks, commits and piece renders. Reanimated is an inert stand-in, so this counts what the component asks for, not what a device spends on it. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const mockTimings=[],mockClocks=[],mockStyles=[],mockCancel=jest.fn();
let mockPieceRenders=0;
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 return {__esModule:true,default:{View:RN.View},cancelAnimation:value=>mockCancel(value),Easing:{linear:'linear'},ReduceMotion:{Never:'never',System:'system'},runOnJS:fn=>fn,
  useSharedValue:initial=>{const ref=React.useRef(null);if(ref.current===null){ref.current={value:initial};mockClocks.push(ref.current);}return ref.current;},
  // Called once each time a piece renders; the updater is kept so a test can run it as the UI thread does every frame.
  useAnimatedStyle:updater=>{mockPieceRenders++;const ref=React.useRef(null);if(ref.current===null){ref.current=updater;mockStyles.push(updater);}return updater();},
  withTiming:(to,config,done)=>{mockTimings.push({to,config,done});return 1;}};
});
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Confetti,confetti}=require('../../packages/hig/native/src/confetti');
const h=React.createElement;
let root,commits=0;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;commits=0;mockPieceRenders=0;mockTimings.length=0;mockClocks.length=0;mockStyles.length=0;mockCancel.mockClear();});
const tick=async()=>{await act(async()=>{for(let turn=0;turn<6;turn++)await Promise.resolve();});};
/** Mounts the layer under a profiler that counts every commit of the tree, and waits until it can fire. */
const mount=async()=>{act(()=>{root=create(h(React.Profiler,{id:'confetti',onRender:()=>{commits++;}},h(HIGProvider,null,h(Confetti,{testID:'confetti'}))));});await tick();commits=0;return root.root;};
const layer=view=>view.findAll(node=>node.props.testID==='confetti'&&typeof node.type==='string')[0];
/** Every native view under the layer. */
const views=view=>layer(view).findAll(node=>typeof node.type==='string'&&node.props.testID!=='confetti');
const fire=options=>{let promise;act(()=>{promise=confetti(options);});return promise;};
const settled=async promise=>{let done=false;promise.then(()=>{done=true;});for(let turn=0;turn<4;turn++)await Promise.resolve();return done;};

it('a burst of N squares and circles is N views, N animated styles, one clock and one animation',async()=>{
 const view=await mount();
 for(const [count,total] of [[100,100],[300,400]]){
  fire({particleCount:count});
  expect(views(view)).toHaveLength(total);expect(mockStyles).toHaveLength(total);expect(mockPieceRenders).toBe(total);
 }
 // One shared value and one timing animation a burst, whatever its size.
 expect(mockClocks).toHaveLength(2);expect(mockTimings).toHaveLength(2);
});

it('a star is six views, one of them animated',async()=>{
 const view=await mount();fire({particleCount:60,shapes:['star']});
 expect(views(view)).toHaveLength(360);expect(mockStyles).toHaveLength(60);expect(mockClocks).toHaveLength(1);
});

it('React commits once when a burst starts and once when it ends, and never while it flies',async()=>{
 const view=await mount();const promise=fire({particleCount:100,ticks:200});
 expect(commits).toBe(1);expect(mockPieceRenders).toBe(100);
 // Every frame of the flight as the UI thread runs it: the clock moves and each piece's style is worked out again.
 for(let frame=1;frame<200;frame++){mockClocks[0].value=frame;for(const style of mockStyles)style();}
 await tick();
 expect(commits).toBe(1);expect(mockPieceRenders).toBe(100);expect(views(view)).toHaveLength(100);
 act(()=>mockTimings[0].done(true));
 expect(commits).toBe(2);expect(mockPieceRenders).toBe(100);expect(views(view)).toHaveLength(0);expect(await settled(promise)).toBe(true);
});

it('a burst that starts or ends renders no piece of another burst again',async()=>{
 const view=await mount();fire({particleCount:100});
 fire({particleCount:50});
 // Only the 50 new pieces rendered.
 expect(mockPieceRenders).toBe(150);expect(commits).toBe(2);
 act(()=>mockTimings[0].done(true));
 expect(mockPieceRenders).toBe(150);expect(commits).toBe(3);expect(views(view)).toHaveLength(50);
});

it('five overlapping bursts of 100 are 500 views on five clocks, and nothing is left when the last has gone',async()=>{
 const view=await mount();const promises=[0,1,2,3,4].map(()=>fire({particleCount:100}));
 expect(views(view)).toHaveLength(500);expect(mockStyles).toHaveLength(500);expect(mockClocks).toHaveLength(5);expect(mockTimings).toHaveLength(5);expect(commits).toBe(5);
 for(const timing of mockTimings)act(()=>timing.done(true));
 expect(views(view)).toHaveLength(0);expect(commits).toBe(10);expect(mockPieceRenders).toBe(500);
 // Each burst's clock is cancelled as its views go, so no animation outlives them.
 expect(mockCancel).toHaveBeenCalledTimes(5);for(const clock of mockClocks)expect(mockCancel).toHaveBeenCalledWith(clock);
 for(const promise of promises)expect(await settled(promise)).toBe(true);
});
