/** Native confetti: what it renders and when, with Reanimated replaced by an inert stand-in whose clock the test moves by hand. The flight itself is covered by tests/confetti-model.test.ts; frame rate is a device matter. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const mockTimings=[],mockClocks=[],mockStyles=[],mockCancel=jest.fn();
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 return {__esModule:true,default:{View:RN.View},cancelAnimation:value=>mockCancel(value),Easing:{linear:'linear'},ReduceMotion:{Never:'never',System:'system'},runOnJS:fn=>fn,
  useSharedValue:initial=>{const ref=React.useRef(null);if(ref.current===null){ref.current={value:initial};mockClocks.push(ref.current);}return ref.current;},
  // The updater is kept so a test can read a piece's style at any tick.
  useAnimatedStyle:updater=>{const ref=React.useRef(null);if(ref.current===null){ref.current=updater;mockStyles.push(updater);}return updater();},
  // The clock stays where it was: the test moves it.
  withTiming:(to,config,done)=>{mockTimings.push({to,config,done});return 1;}};
});
const {nativeSrgb,nativeDisplayP3}=require('@bloxwap/hig/tokens');
const {confettiDuration,createConfettiBurst}=require('@bloxwap/hig/contracts/confetti');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Confetti,confetti,mirrorConfetti}=require('../../packages/hig/native/src/confetti');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;mockTimings.length=0;mockClocks.length=0;mockStyles.length=0;mockCancel.mockClear();});
function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{return run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
const tree=(props={},provider={})=>h(HIGProvider,provider,h(Confetti,{testID:'confetti',...props}));
const mount=(props,provider)=>{act(()=>{root=create(tree(props,provider));});return root.root;};
const flat=node=>RN.StyleSheet.flatten(node.props.style);
const layer=view=>view.findAll(node=>node.props.testID==='confetti'&&typeof node.type==='string')[0];
const pieces=view=>layer(view).findAll(node=>typeof node.type==='string'&&node.props.testID!=='confetti');
const settled=async promise=>{let done=false;promise.then(()=>{done=true;});await Promise.resolve();await Promise.resolve();return done;};
const fire=options=>{let promise;act(()=>{promise=confetti(options);});return promise;};

it('without a mounted Confetti a call resolves and draws nothing',async()=>{
 expect(await settled(confetti({particleCount:10}))).toBe(true);expect(mockTimings).toHaveLength(0);expect(()=>confetti.reset()).not.toThrow();
});

it('the layer fills its parent, takes no touches, is hidden from assistive technology, stays left-to-right and is empty at rest',()=>{
 const view=mount({style:{zIndex:5}});
 expect(layer(view).props.pointerEvents).toBe('none');expect(layer(view).props.accessibilityElementsHidden).toBe(true);expect(layer(view).props.importantForAccessibility).toBe('no-hide-descendants');
 expect(flat(layer(view))).toEqual({position:'absolute',left:0,right:0,top:0,bottom:0,direction:'ltr',zIndex:5});
 expect(pieces(view)).toHaveLength(0);expect(mockTimings).toHaveLength(0);
});

it('a burst mounts one plain view a piece in the provider\'s colours and starts one linear clock for all of them',()=>{
 let renders=0;function Screen(){renders++;return h(Confetti,{testID:'confetti'});}
 act(()=>{root=create(h(HIGProvider,null,h(Screen)));});const view=root.root;
 fire({particleCount:12,ticks:120});
 expect(pieces(view)).toHaveLength(12);
 // Dealt in turn: action, info, down (sell), warning, up (buy).
 const roles=[nativeSrgb.action,nativeSrgb.info,nativeSrgb.sell,nativeSrgb.warning,nativeSrgb.buy];
 expect(pieces(view).map(piece=>flat(piece).backgroundColor)).toEqual(Array.from({length:12},(_,index)=>roles[(11-index)%5]));
 for(const piece of pieces(view)){expect(piece.children).toHaveLength(0);expect(flat(piece)).toMatchObject({position:'absolute',left:0,top:0});}
 // One clock and one animation for the burst, from tick 1 to its last tick in real time, whatever the system's motion setting.
 expect(mockClocks).toHaveLength(1);expect(mockTimings).toHaveLength(1);
 expect(mockTimings[0].to).toBe(120);expect(mockTimings[0].config).toEqual({duration:confettiDuration({ticks:120}),easing:'linear',reduceMotion:'never'});expect(mockTimings[0].config.duration).toBeCloseTo(119*1000/60);
 // The screen that holds the layer did not render again for the burst.
 expect(renders).toBe(1);
});

it('paints the Display P3 table on an iOS host that paints P3, and named colours as given',()=>{
 withOS('ios',()=>{
  const view=mount({},{colorSpace:'display-p3'});fire({particleCount:5});
  expect(pieces(view).map(piece=>flat(piece).backgroundColor).reverse()).toEqual([nativeDisplayP3.action,nativeDisplayP3.info,nativeDisplayP3.sell,nativeDisplayP3.warning,nativeDisplayP3.buy]);
 });
 act(()=>root.unmount());
 const view=mount({},{marketColors:{up:'crimson',down:'navy'}});fire({particleCount:5});
 expect(pieces(view).map(piece=>flat(piece).backgroundColor).reverse()).toEqual([nativeSrgb.action,nativeSrgb.info,'navy',nativeSrgb.warning,'crimson']);
 fire({particleCount:3,colors:['gold','teal']});
 expect(pieces(view).slice(5).map(piece=>flat(piece).backgroundColor)).toEqual(['gold','teal','gold']);
});

it('a piece changes only its transform and opacity, from the burst\'s origin in the measured layer',()=>{
 const view=mount();act(()=>{layer(view).props.onLayout({nativeEvent:{layout:{width:400,height:800}}});});
 fire({particleCount:1,origin:{x:0.25,y:0.5},startVelocity:0,gravity:0,flat:true,shapes:['square'],ticks:100});
 const [piece]=pieces(view),style=flat(piece);
 expect(style).toMatchObject({width:10,height:10,borderRadius:0});
 // A flat, still square sits on the origin: a quarter of the way across and half way down, its corner where canvas-confetti starts it.
 expect(style.transform).toEqual([{translateX:100},{translateY:400},{rotate:'0rad'},{scaleX:1},{scaleY:1}]);expect(style.opacity).toBeCloseTo(0.99);
 // Half way through the burst only the animated style has changed, and it holds nothing but opacity and transform.
 mockClocks[0].value=50;const later=mockStyles[0]();
 expect(Object.keys(later).sort()).toEqual(['opacity','transform']);expect(later.opacity).toBeCloseTo(0.5);expect(later.transform.map(part=>Object.keys(part)[0])).toEqual(['translateX','translateY','rotate','scaleX','scaleY']);
});

it('a moving piece follows the shared physics at the clock\'s tick',()=>{
 const view=mount();act(()=>{layer(view).props.onLayout({nativeEvent:{layout:{width:300,height:600}}});});
 fire({particleCount:1,shapes:['circle'],decay:1,startVelocity:10,spread:0,angle:0,gravity:1,drift:2,ticks:100});
 expect(flat(pieces(view)[0])).toMatchObject({width:12,height:12,borderRadius:6});
 const at=tick=>{mockClocks[0].value=tick;const style=mockStyles[0]();return {x:style.transform[0].translateX,y:style.transform[1].translateY,style};};
 const a=at(10),b=at(20);
 // Without decay the speed is constant: straight to the right at its launch speed plus the drift, and down by the gravity.
 const speed=(b.x-a.x)/10;expect(speed).toBeGreaterThanOrEqual(7-1e-9);expect(speed).toBeLessThan(17);expect((b.y-a.y)/10).toBeCloseTo(3);
 expect(a.x).toBeCloseTo(150-6+speed*10);expect(a.y).toBeCloseTo(300-6+30);
 // A circle turns as an ellipse: both scales stay within the full circle.
 expect(b.style.transform[3].scaleX).toBeLessThanOrEqual(1);expect(b.style.transform[4].scaleY).toBeLessThanOrEqual(1);expect(b.style.transform[2].rotate).toMatch(/^-?[\d.e-]+rad$/);
});

it('a star flies as a square',()=>{
 const view=mount();fire({particleCount:6,shapes:['star']});
 for(const piece of pieces(view))expect(flat(piece)).toMatchObject({width:10,height:10,borderRadius:0});
 // The shared model itself keeps the star for a renderer that can draw one.
 expect(createConfettiBurst({particleCount:1,shapes:['star']},['red']).particles[0].shape).toBe('star');
});

it('when the clock finishes the burst unmounts and its promise resolves; other bursts keep flying',async()=>{
 const view=mount();const first=fire({particleCount:4}),second=fire({particleCount:3});
 expect(pieces(view)).toHaveLength(7);expect(mockTimings).toHaveLength(2);
 // A cancelled animation ends nothing.
 act(()=>mockTimings[0].done(false));expect(pieces(view)).toHaveLength(7);expect(await settled(first)).toBe(false);
 act(()=>mockTimings[0].done(true));
 expect(pieces(view)).toHaveLength(3);expect(await settled(first)).toBe(true);expect(await settled(second)).toBe(false);
 // The first burst's clock was cancelled as its views went.
 expect(mockCancel).toHaveBeenCalledWith(mockClocks[0]);
 act(()=>mockTimings[1].done(true));expect(pieces(view)).toHaveLength(0);expect(await settled(second)).toBe(true);
});

it('draws nothing under reduced motion unless the call opts out',async()=>{
 const view=mount({},{reducedMotion:true});
 expect(await settled(fire({particleCount:20}))).toBe(true);expect(pieces(view)).toHaveLength(0);expect(mockTimings).toHaveLength(0);
 fire({particleCount:20,disableForReducedMotion:false});expect(pieces(view)).toHaveLength(20);expect(mockTimings[0].config.reduceMotion).toBe('never');
});

it('a burst with no pieces resolves at once',async()=>{
 const view=mount();expect(await settled(fire({particleCount:0}))).toBe(true);expect(pieces(view)).toHaveLength(0);
});

it('reset and unmounting both stop every burst and resolve the promises',async()=>{
 let view=mount();const first=fire({particleCount:4}),second=fire({particleCount:4});
 act(()=>confetti.reset());
 expect(pieces(view)).toHaveLength(0);expect(await settled(first)).toBe(true);expect(await settled(second)).toBe(true);
 const third=fire({particleCount:4});expect(pieces(view)).toHaveLength(4);
 act(()=>root.unmount());root=null;expect(await settled(third)).toBe(true);
 // The host is out of the registry.
 expect(await settled(confetti({particleCount:4}))).toBe(true);
 view=mount();expect(pieces(view)).toHaveLength(0);
});

it('fires its options for a truthy trigger, on mount and on each change, once each',()=>{
 let view=mount({trigger:0,options:{particleCount:2}});expect(pieces(view)).toHaveLength(0);
 act(()=>root.update(tree({trigger:1,options:[{particleCount:2},{particleCount:3}]})));expect(pieces(root.root)).toHaveLength(5);expect(mockTimings).toHaveLength(2);
 act(()=>root.update(tree({trigger:1,options:{particleCount:7}})));expect(pieces(root.root)).toHaveLength(5);
 act(()=>root.update(tree({trigger:null,options:{particleCount:7}})));expect(pieces(root.root)).toHaveLength(5);
 act(()=>root.update(tree({trigger:2,options:{particleCount:7}})));expect(pieces(root.root)).toHaveLength(12);
 act(()=>root.unmount());
 view=mount({trigger:'order-1'});expect(pieces(view)).toHaveLength(50);
});

it('exports the mirror helper for right-to-left cannons',()=>{
 expect(mirrorConfetti({angle:60,origin:{x:0}})).toMatchObject({angle:120,origin:{x:1}});
});
