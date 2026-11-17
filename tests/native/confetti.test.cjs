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
const {confettiDuration,confettiStarPoints,confettiStarWedge}=require('@bloxwap/hig/contracts/confetti');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Confetti,confetti,mirrorConfetti}=require('../../packages/hig/native/src/confetti');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;mockTimings.length=0;mockClocks.length=0;mockStyles.length=0;mockCancel.mockClear();RN.AccessibilityInfo.isReduceMotionEnabled.mockImplementation(()=>Promise.resolve(false));});
async function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{return await run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
const tree=(props={},provider={})=>h(HIGProvider,provider,h(Confetti,{testID:'confetti',...props}));
/** Lets the promises in flight run: the layer's question to the system about reduced motion, and what follows from its answer. */
const tick=async()=>{await act(async()=>{for(let turn=0;turn<6;turn++)await Promise.resolve();});};
/** Mounts the layer and waits until it can answer for reduced motion, as it can a moment after mounting in an app. */
const mount=async(props,provider)=>{act(()=>{root=create(tree(props,provider));});await tick();return root.root;};
const flat=node=>RN.StyleSheet.flatten(node.props.style);
const layer=view=>view.findAll(node=>node.props.testID==='confetti'&&typeof node.type==='string')[0];
/** The views that fly: each carries the animated opacity. The triangles inside a star do not. */
const pieces=view=>layer(view).findAll(node=>typeof node.type==='string'&&node.props.testID!=='confetti'&&flat(node).opacity!==undefined);
const settled=async promise=>{let done=false;promise.then(()=>{done=true;});for(let turn=0;turn<4;turn++)await Promise.resolve();return done;};
const fire=options=>{let promise;act(()=>{promise=confetti(options);});return promise;};

it('without a mounted Confetti a call resolves and draws nothing',async()=>{
 expect(await settled(confetti({particleCount:10}))).toBe(true);expect(mockTimings).toHaveLength(0);expect(()=>confetti.reset()).not.toThrow();
});

it('the layer fills its parent, takes no touches, is hidden from assistive technology, stays left-to-right and is empty at rest',async()=>{
 const view=await mount({style:{zIndex:5}});
 expect(layer(view).props.pointerEvents).toBe('none');expect(layer(view).props.accessible).toBe(false);expect(layer(view).props.accessibilityElementsHidden).toBe(true);expect(layer(view).props.importantForAccessibility).toBe('no-hide-descendants');
 expect(flat(layer(view))).toEqual({position:'absolute',left:0,right:0,top:0,bottom:0,direction:'ltr',zIndex:5});
 expect(pieces(view)).toHaveLength(0);expect(mockTimings).toHaveLength(0);
});

it('a burst mounts one plain view a piece in the provider\'s colours and starts one linear clock for all of them',async()=>{
 let renders=0;function Screen(){renders++;return h(Confetti,{testID:'confetti'});}
 act(()=>{root=create(h(HIGProvider,null,h(Screen)));});await tick();const view=root.root;
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

it('paints the Display P3 table on an iOS host that paints P3, and named colours as given',async()=>{
 await withOS('ios',async()=>{
  const view=await mount({},{colorSpace:'display-p3'});fire({particleCount:5});
  expect(pieces(view).map(piece=>flat(piece).backgroundColor).reverse()).toEqual([nativeDisplayP3.action,nativeDisplayP3.info,nativeDisplayP3.sell,nativeDisplayP3.warning,nativeDisplayP3.buy]);
 });
 act(()=>root.unmount());
 const view=await mount({},{marketColors:{up:'crimson',down:'navy'}});fire({particleCount:5});
 expect(pieces(view).map(piece=>flat(piece).backgroundColor).reverse()).toEqual([nativeSrgb.action,nativeSrgb.info,'navy',nativeSrgb.warning,'crimson']);
 fire({particleCount:3,colors:['gold','teal']});
 expect(pieces(view).slice(5).map(piece=>flat(piece).backgroundColor)).toEqual(['gold','teal','gold']);
});

it('a piece changes only its transform and opacity, from the burst\'s origin in the measured layer',async()=>{
 const view=await mount();act(()=>{layer(view).props.onLayout({nativeEvent:{layout:{width:400,height:800}}});});
 fire({particleCount:1,origin:{x:0.25,y:0.5},startVelocity:0,gravity:0,flat:true,shapes:['square'],ticks:100});
 const [piece]=pieces(view),style=flat(piece);
 expect(style).toMatchObject({width:10,height:10,borderRadius:0});
 // A flat, still square sits on the origin: a quarter of the way across and half way down, its corner where canvas-confetti starts it.
 expect(style.transform).toEqual([{translateX:100},{translateY:400},{rotate:'0rad'},{scaleX:1},{scaleY:1}]);expect(style.opacity).toBe(1);
 // Half way through the burst only the animated style has changed, and it holds nothing but opacity and transform.
 mockClocks[0].value=50;const later=mockStyles[0]();
 expect(Object.keys(later).sort()).toEqual(['opacity','transform']);expect(later.opacity).toBeCloseTo(0.51);expect(later.transform.map(part=>Object.keys(part)[0])).toEqual(['translateX','translateY','rotate','scaleX','scaleY']);
});

it('a moving piece follows the shared physics at the clock\'s tick',async()=>{
 const view=await mount();act(()=>{layer(view).props.onLayout({nativeEvent:{layout:{width:300,height:600}}});});
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

it('a star is canvas-confetti\'s star, built from five still triangles inside the one view that flies',async()=>{
 const view=await mount();act(()=>{layer(view).props.onLayout({nativeEvent:{layout:{width:200,height:200}}});});
 fire({particleCount:3,shapes:['star'],colors:['gold'],scalar:2,startVelocity:0,gravity:0});
 expect(pieces(view)).toHaveLength(3);
 const [piece]=pieces(view),style=flat(piece),wedges=piece.findAll(node=>typeof node.type==='string'&&node!==piece);
 // The flying view is the square around the star (outer points 16 from the centre at scalar 2), with no fill of its own;
 // it is centred on the origin, does not turn and fades as one picture.
 expect(style).toMatchObject({width:32,height:32});expect(style.backgroundColor).toBeUndefined();expect(piece.props.needsOffscreenAlphaCompositing).toBe(true);
 expect(style.transform).toEqual([{translateX:100-16},{translateY:100-16},{rotate:'0rad'},{scaleX:1},{scaleY:1}]);
 expect(wedges).toHaveLength(5);
 const width=confettiStarWedge.width*20,height=confettiStarWedge.height*20;expect(height).toBeCloseTo(16);
 /** Where a point of the triangle's own box lands in the star's box: the rotation is about the middle of the triangle's base. */
 const corners=wedges.map((wedge,fifth)=>{
  const at=flat(wedge);
  expect(at).toMatchObject({position:'absolute',top:0,width:0,height:0,borderBottomColor:'gold',borderLeftColor:'#ffffff00',borderRightColor:'#ffffff00'});
  expect(at.left).toBeCloseTo(16-width/2);expect(at.borderLeftWidth).toBeCloseTo(width/2);expect(at.borderRightWidth).toBeCloseTo(width/2);expect(at.borderBottomWidth).toBeCloseTo(height);
  expect(at.transform).toEqual([{translateY:height/2},{rotate:`${fifth*72}deg`},{translateY:-height/2}]);
  const turn=fifth*72*Math.PI/180,place=(x,y)=>{const dx=x-16,dy=y-height;return [16+dx*Math.cos(turn)-dy*Math.sin(turn)-16,height+dx*Math.sin(turn)+dy*Math.cos(turn)-16];};
  // Apex, then the two ends of the base, from the star's centre.
  return [place(16,0),place(16-width/2,height),place(16+width/2,height)];
 });
 // Each apex is one of the star's outer points, in turn; each base passes through the centre.
 corners.forEach(([apex,left,right],fifth)=>{
  const [x,y]=confettiStarPoints[fifth*2];expect(apex[0]).toBeCloseTo(x*20,6);expect(apex[1]).toBeCloseTo(y*20,6);
  expect((left[0]+right[0])/2).toBeCloseTo(0,6);expect((left[1]+right[1])/2).toBeCloseTo(0,6);
 });
 // Together the triangles are the star: every sampled point is in a triangle exactly when it is inside the outline.
 const inside=(point,outline)=>{let within=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const [xi,yi]=outline[i],[xj,yj]=outline[j];if((yi>point[1])!==(yj>point[1])&&point[0]<(xj-xi)*(point[1]-yi)/(yj-yi)+xi)within=!within;}return within;};
 const outline=confettiStarPoints.map(([x,y])=>[x*20,y*20]);let differ=0,filled=0;
 for(let x=-17;x<=17;x+=0.173)for(let y=-17;y<=17;y+=0.173){const star=inside([x,y],outline),drawn=corners.some(triangle=>inside([x,y],triangle));if(star)filled++;if(star!==drawn)differ++;}
 expect(filled).toBeGreaterThan(5000);expect(differ).toBe(0);
 // Moving the clock changes the flying view only; the triangles hold no animated style.
 expect(mockStyles).toHaveLength(3);
});

it('when the clock finishes the burst unmounts and its promise resolves; other bursts keep flying',async()=>{
 const view=await mount();const first=fire({particleCount:4}),second=fire({particleCount:3});
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
 const view=await mount({},{reducedMotion:true});
 expect(await settled(fire({particleCount:20}))).toBe(true);expect(pieces(view)).toHaveLength(0);expect(mockTimings).toHaveLength(0);
 fire({particleCount:20,disableForReducedMotion:false});expect(pieces(view)).toHaveLength(20);expect(mockTimings[0].config.reduceMotion).toBe('never');
});

it('a burst with no pieces resolves at once',async()=>{
 const view=await mount();expect(await settled(fire({particleCount:0}))).toBe(true);expect(pieces(view)).toHaveLength(0);
});

it('reset and unmounting both stop every burst and resolve the promises',async()=>{
 let view=await mount();const first=fire({particleCount:4}),second=fire({particleCount:4});
 act(()=>confetti.reset());
 expect(pieces(view)).toHaveLength(0);expect(await settled(first)).toBe(true);expect(await settled(second)).toBe(true);
 const third=fire({particleCount:4});expect(pieces(view)).toHaveLength(4);
 act(()=>root.unmount());root=null;expect(await settled(third)).toBe(true);
 // The host is out of the registry.
 expect(await settled(confetti({particleCount:4}))).toBe(true);
 view=await mount();expect(pieces(view)).toHaveLength(0);
});

it('fires its options for a truthy trigger, on mount and on each change, once each',async()=>{
 let view=await mount({trigger:0,options:{particleCount:2}});expect(pieces(view)).toHaveLength(0);
 act(()=>root.update(tree({trigger:1,options:[{particleCount:2},{particleCount:3}]})));expect(pieces(root.root)).toHaveLength(5);expect(mockTimings).toHaveLength(2);
 act(()=>root.update(tree({trigger:1,options:{particleCount:7}})));expect(pieces(root.root)).toHaveLength(5);
 act(()=>root.update(tree({trigger:null,options:{particleCount:7}})));expect(pieces(root.root)).toHaveLength(5);
 act(()=>root.update(tree({trigger:2,options:{particleCount:7}})));expect(pieces(root.root)).toHaveLength(12);
 act(()=>root.unmount());
 view=await mount({trigger:'order-1'});expect(pieces(view)).toHaveLength(50);
});

it('a burst asked for while the layer mounts waits for the system\'s reduced motion setting, then flies',async()=>{
 let answer;RN.AccessibilityInfo.isReduceMotionEnabled.mockImplementation(()=>new Promise(resolve=>{answer=resolve;}));
 act(()=>{root=create(tree({trigger:1,options:{particleCount:4}}));});const view=root.root;
 const called=fire({particleCount:3});await tick();
 // Nothing is drawn or resolved before the answer.
 expect(pieces(view)).toHaveLength(0);expect(mockTimings).toHaveLength(0);expect(await settled(called)).toBe(false);
 await act(async()=>{answer(false);});await tick();
 expect(pieces(view)).toHaveLength(7);expect(mockTimings).toHaveLength(2);
 // From then on a call starts at once.
 fire({particleCount:2});expect(pieces(view)).toHaveLength(9);
});

it('under the system\'s reduced motion setting a burst asked for while the layer mounts is never drawn',async()=>{
 RN.AccessibilityInfo.isReduceMotionEnabled.mockImplementation(()=>Promise.resolve(true));
 act(()=>{root=create(tree({trigger:1,options:{particleCount:4}}));});const view=root.root;
 const called=fire({particleCount:3});await tick();
 expect(pieces(view)).toHaveLength(0);expect(mockTimings).toHaveLength(0);expect(await settled(called)).toBe(true);
 // Later calls are skipped too, and one that opts out is drawn.
 expect(await settled(fire({particleCount:3}))).toBe(true);expect(pieces(view)).toHaveLength(0);
 fire({particleCount:3,disableForReducedMotion:false});expect(pieces(view)).toHaveLength(3);
});

it('a provider that asks for motion decides over the system setting, also for a burst asked for while the layer mounts',async()=>{
 RN.AccessibilityInfo.isReduceMotionEnabled.mockImplementation(()=>Promise.resolve(true));
 act(()=>{root=create(tree({trigger:1,options:{particleCount:4}},{reducedMotion:false}));});const view=root.root;
 expect(pieces(view)).toHaveLength(0);await tick();expect(pieces(view)).toHaveLength(4);
});

it('a burst still waiting when the layer goes or is reset resolves without being drawn',async()=>{
 RN.AccessibilityInfo.isReduceMotionEnabled.mockImplementation(()=>new Promise(()=>{}));
 act(()=>{root=create(tree());});const view=root.root;
 const first=fire({particleCount:3});act(()=>confetti.reset());expect(await settled(first)).toBe(true);
 const second=fire({particleCount:3});expect(await settled(second)).toBe(false);
 act(()=>root.unmount());root=null;expect(await settled(second)).toBe(true);expect(mockTimings).toHaveLength(0);expect(view).toBeDefined();
});

it('keeps a burst asked for at mount when React runs the effects twice, as in development',async()=>{
 act(()=>{root=create(h(React.StrictMode,null,tree({trigger:1,options:{particleCount:4}})));});await tick();
 expect(pieces(root.root)).toHaveLength(4);
});

it('exports the mirror helper for right-to-left cannons',()=>{
 expect(mirrorConfetti({angle:60,origin:{x:0}})).toMatchObject({angle:120,origin:{x:1}});
});
