/**
 * The native toast host: what it draws, when a notice's time runs, and how the gesture and the stack are wired. Reanimated
 * and Gesture Handler are replaced by stand-ins that run the worklets on this thread and jump every animation to its end,
 * recording where it started and how it was timed. The arithmetic has its own tests (tests/toast-model.test.ts); frame
 * timing and the feel of the gesture need a device.
 */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {AccessibilityInfo,AppState,Dimensions,Platform,StyleSheet,Text:RNText}=require('react-native');
const mockUI={reactions:[],animations:[]};
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 // A shared value that jumps to the end of any animation written to it and records the animation.
 const shared=initial=>{const ref=React.useRef(null);if(ref.current===null){let current=initial;ref.current={get value(){return current;},set value(next){if(next&&next.__animation){mockUI.animations.push({from:current,to:next.to,kind:next.kind,config:next.config});current=next.to;}else current=next;}};}return ref.current;};
 const animation=kind=>(to,config)=>({__animation:true,kind,to,config});
 return {__esModule:true,default:{View:RN.View},cancelAnimation:()=>{},Easing:{bezier:(...points)=>points},ReduceMotion:{Always:'always',System:'system',Never:'never'},runOnJS:fn=>fn,
  useSharedValue:shared,useAnimatedStyle:updater=>({__style:updater}),withTiming:animation('timing'),withSpring:animation('spring'),
  useAnimatedReaction:(prepare,react)=>{const ref=React.useRef({previous:null});ref.current.prepare=prepare;ref.current.react=react;React.useEffect(()=>{const reaction=ref.current;mockUI.reactions.push(reaction);return()=>{mockUI.reactions.splice(mockUI.reactions.indexOf(reaction),1);};},[]);}};
});
jest.mock('react-native-gesture-handler',()=>{
 const pan=()=>{const gesture={config:{},handlers:{}};for(const name of ['enabled','activeOffsetX','activeOffsetY'])gesture[name]=value=>{gesture.config[name]=value;return gesture;};for(const name of ['onBegin','onStart','onChange','onEnd','onFinalize'])gesture[name]=handler=>{gesture.handlers[name]=handler;return gesture;};return gesture;};
 return {Gesture:{Pan:pan},GestureDetector:function GestureDetector({children}){return children;}};
});
const {GestureDetector}=require('react-native-gesture-handler');
const {SafeAreaInsetsContext}=require('react-native-safe-area-context');
const {nativeDisplayP3,nativeSrgb}=require('@bloxwap/hig/tokens');
const {Toaster,toast,dismissToast}=require('../../packages/hig/native/src/toast');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Button}=require('../../packages/hig/native/src/button');
const h=React.createElement;
let root;
const window=Dimensions.get('window');
// React Native's own jest stand-ins are replaced by assignment and put back after each test; a spy on them would outlive it.
const swapped=[];
const swap=(object,name,value)=>{swapped.push([object,name,object[name]]);object[name]=value;};
afterEach(()=>{if(root)act(()=>root.unmount());root=null;act(()=>dismissToast());mockUI.reactions.length=0;mockUI.animations.length=0;act(()=>Dimensions.set({window}));jest.useRealTimers();for(const [object,name,value] of swapped.splice(0))object[name]=value;});
const tree=(props={},provider={},insets)=>{const host=h(HIGProvider,provider,h(Toaster,{testID:'toasts',...props}));return insets?h(SafeAreaInsetsContext.Provider,{value:insets},host):host;};
const mount=(props,provider,insets)=>{act(()=>{root=create(tree(props,provider,insets));});return root.root;};
/** Runs every worklet reaction, as the UI thread does when a shared value changes. */
const flush=()=>act(()=>{for(let pass=0;pass<3;pass++)for(const reaction of [...mockUI.reactions]){const next=reaction.prepare();reaction.react(next,reaction.previous);reaction.previous=next;}});
const cards=()=>root.root.findAll(node=>node.props.testID==='toasts-toast'&&typeof node.type==='string');
const gestures=()=>root.root.findAllByType(GestureDetector).map(node=>node.props.gesture);
const flat=style=>(Array.isArray(style)?style.flatMap(flat):[style]).filter(Boolean);
/** A card's animated style as the UI thread would now draw it: {opacity, x, y, scaleX, scaleY}. */
const drawn=card=>{const style=Object.assign({},...flat(card.props.style).filter(part=>part.__style).map(part=>part.__style()));const [x,y,scaleX,scaleY]=style.transform.map(entry=>Object.values(entry)[0]);return {opacity:style.opacity,x,y,scaleX,scaleY};};
const contentOpacity=card=>card.children[0].props.style.__style().opacity;
/** Lays the cards out oldest first with these heights, then lets the stack react. */
const measure=(heights,width=200)=>{act(()=>{cards().forEach((card,index)=>{if(heights[index]!==undefined)card.props.onLayout({nativeEvent:{layout:{width,height:heights[index]}}});});});flush();};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const texts=()=>root.root.findAllByType(RNText).map(text);
const press=label=>act(()=>{root.root.findAll(node=>node.props.accessibilityLabel===label&&typeof node.props.onPress==='function')[0].props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented:()=>false});});
const onIOS=run=>{const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS');Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});try{return run();}finally{Object.defineProperty(Platform,'OS',descriptor);}};

it('draws nothing while idle, then the HIG capsule with its message, description, action and a named close control',()=>{
 const view=mount();
 expect(root.toJSON()).toBeNull();
 const retry=jest.fn();let id;
 act(()=>{id=toast('Transfer failed',{severity:'error',description:'Check your balance and retry.',action:h(Button,{onPress:retry},'Retry')});});
 expect(typeof id).toBe('number');
 expect(texts()).toEqual(expect.arrayContaining(['Transfer failed','Check your balance and retry.','Retry']));
 // The layer and the rail let touches through everywhere but on a notice.
 const layer=view.findAll(node=>node.props.testID==='toasts'&&typeof node.type==='string')[0];
 expect(layer.props.pointerEvents).toBe('box-none');expect(layer.children[0].props.pointerEvents).toBe('box-none');expect(layer.children[0].props.accessibilityLabel).toBe('Notifications');
 expect(view.findAll(node=>node.props.accessibilityLabel==='Dismiss Transfer failed').length).toBeGreaterThan(0);
 // The capsule hugs its content: nothing in its row grows, so a short notice is a short pill.
 const row=cards()[0].findAll(node=>typeof node.type==='string'&&StyleSheet.flatten(node.props.style)?.minHeight===44)[0],parts=row.children.map(child=>typeof child.type==='string'?child:child.findAll(node=>typeof node.type==='string')[0]);
 expect(StyleSheet.flatten(row.props.style)).toMatchObject({flexDirection:'row',alignItems:'center',backgroundColor:'transparent'});expect(parts).toHaveLength(4);
 expect(parts.map(part=>StyleSheet.flatten(part.props.style)?.flex)).toEqual([undefined,undefined,undefined,undefined]);expect(StyleSheet.flatten(parts[1].props.style)).toMatchObject({flexShrink:1,minWidth:0});
 // Until it is laid out it is transparent and out of the stack; then it is the front.
 expect(drawn(cards()[0]).opacity).toBe(0);measure([62]);expect(drawn(cards()[0])).toEqual({opacity:1,x:0,y:0,scaleX:1,scaleY:1});
 act(()=>{view.findAll(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function'&&text(node)==='Retry')[0].props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented:()=>false});});
 expect(retry).toHaveBeenCalledTimes(1);
});

it('paints the capsule and its severity symbol from the provider roles, Display P3 on an iOS P3 host',()=>{
 const painted=()=>{const colors=new Set();for(const node of root.root.findAll(node=>typeof node.type==='string'))for(const part of [...flat(node.props.style),{tintColor:node.props.tintColor}])for(const value of Object.values(part))if(typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))colors.add(value);return colors;};
 mount();act(()=>{toast.success('Saved');toast.error('Failed');toast.warning('Slow network');toast.info('Synced');});
 const srgb=painted();
 for(const role of ['positive','negative','warning','info','nested','muted'])expect(srgb.has(nativeSrgb[role])).toBe(true);
 // Every colour drawn is a role of the provider's table.
 for(const color of srgb)expect(Object.values(nativeSrgb)).toContain(color);
 act(()=>root.unmount());root=null;act(()=>dismissToast());
 onIOS(()=>{
  mount({},{colorSpace:'display-p3'});act(()=>{toast.success('Saved');toast.error('Failed');toast.warning('Slow network');toast.info('Synced');});
  const p3=painted();
  for(const role of ['positive','negative','warning','info','nested'])expect(p3.has(nativeDisplayP3[role])).toBe(true);
  for(const color of p3)expect(Object.values(nativeDisplayP3)).toContain(color);
 });
 expect(nativeDisplayP3.negative).not.toBe(nativeSrgb.negative);
});

it('hangs from the chosen edge, clear of the safe area, and is as wide as the window allows',()=>{
 const insets={top:59,right:0,bottom:34,left:0};
 act(()=>Dimensions.set({window:{...window,width:390,height:844}}));
 mount({},{},insets);act(()=>{toast('Saved');});
 const layer=()=>root.root.findAll(node=>node.props.testID==='toasts'&&typeof node.type==='string')[0],rail=()=>StyleSheet.flatten(layer().children[0].props.style);
 const card=()=>Object.assign({},...flat(cards()[0].props.style).filter(part=>!part.__style));
 // Narrow window: 16 points past the insets on every side, full width between them, anchored at the bottom by default.
 expect(rail()).toMatchObject({position:'absolute',top:75,bottom:50,start:16,end:16,alignItems:'center'});expect(StyleSheet.flatten(layer().props.style)).toMatchObject({position:'absolute',top:0,bottom:0,left:0,right:0,direction:'ltr'});
 expect(card()).toMatchObject({position:'absolute',bottom:0,maxWidth:'100%',borderRadius:22});expect(card().top).toBeUndefined();
 act(()=>root.update(tree({position:'top-right',offset:{top:60,left:8}},{direction:'rtl'},{top:59,right:47,bottom:21,left:0})));
 // Left and right stay physical under right-to-left: the layer still lays out left to right, each side takes its own inset, and edges the host did not name keep the default.
 expect(rail()).toMatchObject({top:119,bottom:37,start:8,end:63,alignItems:'flex-end'});expect(StyleSheet.flatten(layer().props.style).direction).toBe('ltr');expect(card()).toMatchObject({top:0});expect(card().bottom).toBeUndefined();
 // Wide window: 24 points and Sonner's 356-point column.
 act(()=>Dimensions.set({window:{...window,width:1024,height:768}}));
 act(()=>root.update(tree({position:'top-left'},{},insets)));
 expect(rail()).toMatchObject({top:83,start:24,end:24,alignItems:'flex-start'});expect(card()).toMatchObject({maxWidth:356});
});

it('stacks like Sonner: the newest in front, older ones collapsed behind it, expanded on request, one extra kept ready',()=>{
 mount({position:'top-center'});
 act(()=>{toast('One');toast('Two');toast('Three');toast('Four');toast('Five');toast('Six');});
 // Three visible and one transparent spare are mounted; the rest wait in the store.
 expect(cards()).toHaveLength(4);expect(texts().filter(value=>/^(One|Two|Three|Four|Five|Six)$/.test(value))).toEqual(['Three','Four','Five','Six']);
 measure([44,44,62,44]);
 const [spare,third,second,front]=cards();
 expect(drawn(front)).toEqual({opacity:1,x:0,y:0,scaleX:1,scaleY:1});expect(contentOpacity(front)).toBe(1);
 // Behind the front: 5% smaller per place, a gap further down, drawn at the front's height (62·scaleY = 44·0.95), content hidden.
 expect(drawn(second).scaleX).toBeCloseTo(0.95);expect(drawn(second).scaleY*62).toBeCloseTo(44*0.95);expect(drawn(second).y).toBeCloseTo(14+(44-62)/2);expect(contentOpacity(second)).toBe(0);
 expect(drawn(third)).toMatchObject({opacity:1,y:28});expect(drawn(third).scaleX).toBeCloseTo(0.9);
 expect(drawn(spare).opacity).toBe(0);
 // Only the front takes touches and is read; the others have nothing to show.
 expect(cards().map(card=>card.props.pointerEvents)).toEqual(['none','none','none','auto']);expect(cards().map(card=>card.props.accessibilityElementsHidden)).toEqual([true,true,true,false]);expect(gestures().map(gesture=>gesture.config.enabled)).toEqual([false,false,false,true]);
 // Restacking is a 400ms timing on the ease curve that never defers to the system setting: the provider decides.
 expect(mockUI.animations.every(animation=>animation.kind==='timing'&&animation.config.duration===400&&animation.config.reduceMotion==='never')).toBe(true);expect(mockUI.animations[0].config.easing).toEqual([0.25,0.1,0.25,1]);
 act(()=>root.update(tree({position:'top-center',expand:true})));flush();
 const listed=cards().map(drawn);
 expect(listed[3].y).toBe(0);expect(listed[2]).toMatchObject({y:58,scaleX:1,scaleY:1});expect(listed[1].y).toBe(44+62+28);expect(listed[0].opacity).toBe(0);
 expect(cards().map(card=>card.props.pointerEvents)).toEqual(['none','auto','auto','auto']);expect(contentOpacity(cards()[2])).toBe(1);
 // From the bottom the same stack grows up.
 act(()=>root.update(tree({position:'bottom-center',expand:true})));flush();
 expect(cards().map(card=>drawn(card).y)).toEqual([-(44+62+44+42),-(44+62+28),-58,0]);
});

it('slides a new front in from its own height and moves the others in the same frame, without a render per frame',()=>{
 mount({position:'top-center',expand:true});
 act(()=>{toast('One');});measure([44]);mockUI.animations.length=0;
 act(()=>{toast('Two');});
 // Not measured yet: the first notice has not moved for it.
 flush();expect(mockUI.animations).toHaveLength(0);expect(drawn(cards()[0]).y).toBe(0);
 measure([44,62]);
 // The new front starts 62 points above its slot and settles at 0 while fading in; the older notice makes room below it.
 expect(mockUI.animations).toEqual(expect.arrayContaining([expect.objectContaining({from:-62,to:0,kind:'timing'}),expect.objectContaining({from:0,to:1}),expect.objectContaining({from:0,to:76})]));
 expect(drawn(cards()[0]).y).toBe(76);expect(drawn(cards()[1])).toMatchObject({y:0,opacity:1});
 // A notice that grows restacks the ones behind it.
 mockUI.animations.length=0;measure([44,90]);expect(mockUI.animations).toEqual([expect.objectContaining({from:76,to:104})]);
});

it('runs a notice for its time once it is drawn, tells its owner, plays the exit and then drops it',()=>{
 jest.useFakeTimers();
 mount();const expired=jest.fn(),dismissed=jest.fn();
 act(()=>{toast('Saved',{onAutoClose:expired,onDismiss:dismissed});});
 // Its time does not start before it has been laid out.
 act(()=>{jest.advanceTimersByTime(10000);});expect(cards()).toHaveLength(1);expect(expired).not.toHaveBeenCalled();
 measure([44]);act(()=>{jest.advanceTimersByTime(3999);});expect(expired).not.toHaveBeenCalled();
 mockUI.animations.length=0;
 act(()=>{jest.advanceTimersByTime(1);});flush();
 expect(expired).toHaveBeenCalledTimes(1);expect(dismissed).not.toHaveBeenCalled();
 // The exit: 200ms ease-out, back out the way it came (down, from the bottom) while it fades. It is still mounted and takes no touches.
 expect(mockUI.animations).toEqual([expect.objectContaining({from:1,to:0,config:expect.objectContaining({duration:200,easing:[0,0,0.58,1]})}),expect.objectContaining({from:0,to:44,config:expect.objectContaining({duration:200})})]);
 expect(cards()).toHaveLength(1);expect(cards()[0].props.pointerEvents).toBe('none');
 act(()=>{jest.advanceTimersByTime(250);});expect(root.toJSON()).toBeNull();
});

it('takes the Toaster duration by default, keeps a persistent notice, and starts the time over when an id is raised again',()=>{
 jest.useFakeTimers();
 mount({duration:1000,expand:true});
 act(()=>{toast('Kept',{duration:Infinity});toast('Sending',{id:'send'});});measure([44,44]);
 act(()=>{jest.advanceTimersByTime(900);});
 act(()=>{toast.success('Sent',{id:'send'});});flush();
 // Replaced where it stands: same card, new words, and another full second.
 expect(cards()).toHaveLength(2);expect(texts()).toEqual(expect.arrayContaining(['Kept','Sent']));expect(texts()).not.toContain('Sending');
 act(()=>{jest.advanceTimersByTime(900);});expect(texts()).toContain('Sent');
 act(()=>{jest.advanceTimersByTime(100);});act(()=>{jest.advanceTimersByTime(250);});expect(texts()).not.toContain('Sent');
 act(()=>{jest.advanceTimersByTime(60000);});expect(texts()).toContain('Kept');
});

it('holds every notice while one is touched or the app is in the background, and only counts time for visible notices',()=>{
 jest.useFakeTimers();
 let appState;swap(AppState,'addEventListener',(name,listener)=>{appState=listener;return {remove(){}};});
 mount({visibleToasts:1,position:'top-center'});
 act(()=>{toast('Old');toast('New');});measure([44,44]);
 act(()=>{jest.advanceTimersByTime(3000);});
 // A finger goes down on the front: both clocks stop at once. A tap would lift before the stack stirs; held for 200ms, the stack expands.
 const front=gestures()[1];act(()=>{front.handlers.onBegin();});flush();
 expect(drawn(cards()[0]).y).toBe(14);
 act(()=>{jest.advanceTimersByTime(200);});flush();expect(drawn(cards()[0]).y).toBe(58);
 act(()=>{jest.advanceTimersByTime(60000);});expect(texts()).toEqual(expect.arrayContaining(['Old','New']));
 // Lifted without a swipe: it collapses again and the front has the second it had left.
 act(()=>{front.handlers.onFinalize();});flush();expect(drawn(cards()[0]).y).toBe(14);
 act(()=>{jest.advanceTimersByTime(999);});expect(texts()).toContain('New');
 act(()=>{appState('background');});act(()=>{jest.advanceTimersByTime(60000);});expect(texts()).toContain('New');
 act(()=>{appState('active');});act(()=>{jest.advanceTimersByTime(1);});act(()=>{jest.advanceTimersByTime(250);});expect(texts()).not.toContain('New');
 // The older notice was behind the visible one the whole time, so it still has its four seconds.
 flush();act(()=>{jest.advanceTimersByTime(3999);});expect(texts()).toContain('Old');
 act(()=>{jest.advanceTimersByTime(1);});act(()=>{jest.advanceTimersByTime(250);});expect(root.toJSON()).toBeNull();
});

it('follows a swipe towards its edge, dismisses it when far or fast enough and springs back otherwise',()=>{
 jest.useFakeTimers();
 mount();const dismissed=jest.fn(),expired=jest.fn();
 act(()=>{toast('Saved',{onDismiss:dismissed,onAutoClose:expired});});measure([44],240);
 const pan=gestures()[0];
 // Recognised only after 8 points either way, so a press on the action or the close control is still a press.
 expect(pan.config).toMatchObject({enabled:true,activeOffsetX:[-8,8],activeOffsetY:[-8,8]});
 // Upwards from the bottom edge is the wrong way: it resists, and a release there springs home with the release velocity.
 act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:1,translationY:-9});pan.handlers.onChange({translationX:2,translationY:-49});});
 expect(drawn(cards()[0]).y).toBeCloseTo(-40/(1.5+40/20));expect(drawn(cards()[0]).x).toBe(0);
 mockUI.animations.length=0;
 act(()=>{pan.handlers.onEnd({velocityX:0,velocityY:-2400});pan.handlers.onFinalize();});
 expect(mockUI.animations).toEqual([expect.objectContaining({to:0,kind:'spring',config:expect.objectContaining({velocity:-2400,damping:36,stiffness:320,overshootClamping:true})})]);
 expect(dismissed).not.toHaveBeenCalled();expect(drawn(cards()[0]).y).toBe(0);
 // Sideways is not a direction this stack dismisses in: the notice does not move.
 act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:9,translationY:1});pan.handlers.onChange({translationX:80,translationY:3});});
 expect(drawn(cards()[0]).x).toBe(0);
 act(()=>{pan.handlers.onEnd({velocityX:3000,velocityY:0});pan.handlers.onFinalize();});expect(dismissed).not.toHaveBeenCalled();
 // Down, 1:1 from where the drag was recognised, and a short flick is enough.
 act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:0,translationY:9});pan.handlers.onChange({translationX:0,translationY:21});});
 expect(drawn(cards()[0]).y).toBe(12);
 mockUI.animations.length=0;
 act(()=>{pan.handlers.onEnd({velocityX:0,velocityY:900});pan.handlers.onFinalize();});flush();
 expect(dismissed).toHaveBeenCalledTimes(1);expect(expired).not.toHaveBeenCalled();
 // Out by its own height on from the release point, timed so it leaves at the finger's speed (1.72·44/900 s is under the 100ms floor), fading with it.
 expect(mockUI.animations).toEqual([expect.objectContaining({from:12,to:56,config:expect.objectContaining({duration:100})}),expect.objectContaining({from:1,to:0,config:expect.objectContaining({duration:100})})]);
 act(()=>{jest.advanceTimersByTime(250);});expect(root.toJSON()).toBeNull();
});

it('swipes sideways off a corner stack towards its physical side in either direction, and takes explicit directions as given',()=>{
 mount({position:'top-right'},{direction:'rtl'});
 act(()=>{toast('Saved',{duration:Infinity});});measure([44],240);
 const drag=(dx,dy)=>{const pan=gestures()[0];act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:Math.sign(dx)*9,translationY:Math.sign(dy)*9});pan.handlers.onChange({translationX:dx+Math.sign(dx)*9,translationY:dy+Math.sign(dy)*9});});const at=drawn(cards()[0]);act(()=>{pan.handlers.onEnd({velocityX:0,velocityY:0});pan.handlers.onFinalize();});return at;};
 // Right is the physical right under right-to-left too, so that is the way off.
 expect(drag(30,0).x).toBe(30);expect(Math.abs(drag(-30,0).x)).toBeLessThan(20);expect(drag(0,-30).y).toBe(-30);
 act(()=>root.update(tree({position:'top-right',swipeDirections:['left']},{direction:'rtl'})));
 expect(drag(-30,0).x).toBe(-30);expect(Math.abs(drag(30,0).x)).toBeLessThan(20);expect(drag(0,-30).y).toBe(0);
});

it('dismisses by its close control, by id and all at once, and drops notices at once when no Toaster is mounted',()=>{
 jest.useFakeTimers();
 mount({expand:true});const first=jest.fn(),second=jest.fn(),third=jest.fn();
 act(()=>{toast('One',{duration:Infinity,onDismiss:first});toast('Two',{id:'two',duration:Infinity,onDismiss:second});toast('Three',{duration:Infinity,onDismiss:third});});measure([44,44,44]);
 press('Dismiss One');flush();expect(first).toHaveBeenCalledTimes(1);
 // The others close the gap in the same frame the exit starts; the leaving card stays until its exit has played.
 expect(cards()).toHaveLength(3);expect(drawn(cards()[1]).y).toBe(-58);expect(cards()[0].props.pointerEvents).toBe('none');
 act(()=>{jest.advanceTimersByTime(250);});expect(cards()).toHaveLength(2);
 act(()=>{toast.dismiss('two');toast.dismiss('two');});flush();expect(second).toHaveBeenCalledTimes(1);
 act(()=>{dismissToast();});flush();expect(third).toHaveBeenCalledTimes(1);expect(first).toHaveBeenCalledTimes(1);
 act(()=>{jest.advanceTimersByTime(250);});expect(root.toJSON()).toBeNull();
 act(()=>root.unmount());root=null;
 const orphan=jest.fn();act(()=>{toast('Nobody draws this',{onDismiss:orphan});dismissToast();});expect(orphan).toHaveBeenCalledTimes(1);
 mount();expect(root.toJSON()).toBeNull();
});

it('announces each burst once: errors interrupt on iOS, everything else queues',()=>onIOS(()=>{
 const announce=jest.fn();swap(AccessibilityInfo,'announceForAccessibilityWithOptions',announce);
 mount();
 act(()=>{toast.success('Saved',{description:'Your changes are ready.'});});
 expect(announce).toHaveBeenLastCalledWith('Saved. Your changes are ready.',{queue:true});
 act(()=>{toast.info('Synced');toast.error('Transfer failed',{id:'transfer'});});
 // One announcement for the burst, and the error is the one that is read.
 expect(announce).toHaveBeenCalledTimes(2);expect(announce).toHaveBeenLastCalledWith('Transfer failed',{queue:false});
 // Laying out, restacking and a dismissal say nothing; a replacement with new words does.
 measure([44,44,44]);act(()=>{dismissToast('transfer');});flush();expect(announce).toHaveBeenCalledTimes(2);
 act(()=>{toast.warning('Slow network',{id:'net'});});act(()=>{toast.warning('Slow network',{id:'net'});});expect(announce).toHaveBeenCalledTimes(3);
 act(()=>{toast.warning('Offline',{id:'net'});});expect(announce).toHaveBeenCalledTimes(4);expect(announce).toHaveBeenLastCalledWith('Offline',{queue:true});
}));

it('keeps the stack expanded and every visible notice reachable while a screen reader runs, with translated names',async()=>{
 swap(AccessibilityInfo,'isScreenReaderEnabled',()=>Promise.resolve(true));
 await act(async()=>{root=create(tree({position:'top-center'},{messages:{dismiss:'Fermer',notifications:'Notifications reçues'}}));});
 act(()=>{toast('Un');toast('Deux',{dismissName:'Fermer la deuxième'});});measure([44,44]);
 expect(cards().map(card=>card.props.accessibilityElementsHidden)).toEqual([false,false]);expect(cards().map(card=>card.props.importantForAccessibility)).toEqual(['auto','auto']);expect(cards().map(card=>card.props.pointerEvents)).toEqual(['auto','auto']);
 expect(drawn(cards()[0])).toMatchObject({y:58,scaleX:1});expect(contentOpacity(cards()[0])).toBe(1);
 const labels=root.root.findAll(node=>typeof node.props.accessibilityLabel==='string').map(node=>node.props.accessibilityLabel);
 expect(labels).toEqual(expect.arrayContaining(['Notifications reçues','Fermer Un','Fermer la deuxième']));
});

it('under reduced motion nothing slides or scales: notices fade in place, and a swipe out fades where it was released',()=>{
 jest.useFakeTimers();
 mount({position:'top-center'},{reducedMotion:true});
 act(()=>{toast('One');});measure([44]);
 // Placed directly; only opacity is timed, over 150ms.
 expect(mockUI.animations.every(animation=>animation.config.duration===150)).toBe(true);expect(mockUI.animations).toEqual(expect.arrayContaining([expect.objectContaining({from:0,to:1})]));expect(mockUI.animations.some(animation=>animation.from===-44)).toBe(false);
 mockUI.animations.length=0;
 const pan=gestures()[0];
 act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:0,translationY:-9});pan.handlers.onChange({translationX:0,translationY:-69});pan.handlers.onEnd({velocityX:0,velocityY:0});pan.handlers.onFinalize();});flush();
 expect(mockUI.animations).toEqual([expect.objectContaining({from:1,to:0,config:expect.objectContaining({duration:150})})]);expect(drawn(cards()[0]).y).toBe(-60);
 act(()=>{jest.advanceTimersByTime(250);});expect(root.toJSON()).toBeNull();
});

it('lets only the last Toaster mounted draw, and hands over when it goes',()=>{
 act(()=>{root=create(h(HIGProvider,null,h(Toaster,{testID:'first'}),h(Toaster,{testID:'toasts'})));});
 act(()=>{toast('Saved',{duration:Infinity});});
 const layers=id=>root.root.findAll(node=>node.props.testID===id&&typeof node.type==='string');
 expect(layers('toasts')).toHaveLength(1);expect(layers('first')).toHaveLength(0);
 act(()=>root.update(h(HIGProvider,null,h(Toaster,{testID:'first'}))));
 expect(layers('first')).toHaveLength(1);expect(texts()).toContain('Saved');
});

// Review pass: edge inputs and interruptions.
it('reads the newest notice of a burst, the one drawn in front, when none of them is an error',()=>onIOS(()=>{
 const announce=jest.fn();swap(AccessibilityInfo,'announceForAccessibilityWithOptions',announce);
 mount();
 act(()=>{toast.success('Saved');toast.info('Synced');toast.warning('Slow network');});
 expect(announce).toHaveBeenCalledTimes(1);expect(announce).toHaveBeenLastCalledWith('Slow network',{queue:true});
}));

it('reads a duration as Sonner does: zero, negative and NaN take the default, and a time no timer can count keeps the notice',()=>{
 jest.useFakeTimers();
 mount({duration:1000,expand:true,visibleToasts:4});
 act(()=>{toast('Zero',{duration:0});toast('Negative',{duration:-5});toast('Not a number',{duration:NaN});toast('Month',{duration:2147483648});});measure([44,44,44,44]);
 // Nothing leaves at once: the first three have the Toaster's second.
 act(()=>{jest.advanceTimersByTime(999);});expect(texts()).toEqual(expect.arrayContaining(['Zero','Negative','Not a number','Month']));
 act(()=>{jest.advanceTimersByTime(1);});act(()=>{jest.advanceTimersByTime(250);});
 expect(texts()).not.toContain('Zero');expect(texts()).not.toContain('Negative');expect(texts()).not.toContain('Not a number');
 // The last one is longer than a timer can count, so it stays like `Infinity` instead of firing at once; no timer is left running for it.
 expect(texts()).toContain('Month');expect(jest.getTimerCount()).toBe(0);
});

it('shows one notice when visibleToasts is not a usable number, and still lets it run out',()=>{
 jest.useFakeTimers();
 mount({visibleToasts:NaN});
 act(()=>{toast('One');toast('Two');});measure([44,44]);
 expect(cards().map(card=>card.props.pointerEvents)).toEqual(['none','auto']);expect(drawn(cards()[1]).opacity).toBe(1);expect(drawn(cards()[0]).opacity).toBe(0);
 act(()=>{jest.advanceTimersByTime(4000);});act(()=>{jest.advanceTimersByTime(250);});expect(texts()).not.toContain('Two');
});

it('does not dismiss on a swipe the system cancelled, however far it had gone',()=>{
 mount();const dismissed=jest.fn();
 act(()=>{toast('Saved',{duration:Infinity,onDismiss:dismissed});});measure([44],240);
 const pan=gestures()[0];
 act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:0,translationY:9});pan.handlers.onChange({translationX:0,translationY:89});});
 expect(drawn(cards()[0]).y).toBe(80);
 mockUI.animations.length=0;
 // An incoming call, or the notice being pushed behind a new one: the gesture ends without success.
 act(()=>{pan.handlers.onEnd({velocityX:0,velocityY:1200},false);pan.handlers.onFinalize();});flush();
 expect(dismissed).not.toHaveBeenCalled();expect(mockUI.animations).toEqual([expect.objectContaining({to:0,kind:'spring'})]);expect(drawn(cards()[0])).toMatchObject({y:0,opacity:1});
});

it('lets time run again when the notice a finger was on is pushed out of reach before the finger lifts',()=>{
 jest.useFakeTimers();
 mount({visibleToasts:1});
 act(()=>{toast('Held');});measure([44]);
 const stale=gestures()[0];act(()=>{stale.handlers.onBegin();});
 // Two more arrive: the held notice is no longer mounted, so its gesture can never report the finger lifting.
 act(()=>{toast('Next');toast('Front');});
 expect(texts()).not.toContain('Held');measure([44,44]);
 // A touch-down that was already on its way from the UI thread when the notice went out of reach is ignored as well.
 act(()=>{stale.handlers.onBegin();});
 act(()=>{jest.advanceTimersByTime(4000);});act(()=>{jest.advanceTimersByTime(250);});
 expect(texts()).not.toContain('Front');
});

it('keeps left and right physical under right-to-left, as Sonner does: only the capsule content mirrors',()=>{
 const insets={top:0,right:47,bottom:0,left:11};
 mount({position:'top-right',offset:{left:8,right:30}},{direction:'rtl'},insets);
 act(()=>{toast('Saved',{duration:Infinity});});measure([44],240);
 const layer=root.root.findAll(node=>node.props.testID==='toasts'&&typeof node.type==='string')[0],rail=StyleSheet.flatten(layer.children[0].props.style);
 // The layer lays out left to right whatever the provider or the OS says, so start is the physical left.
 expect(StyleSheet.flatten(layer.props.style).direction).toBe('ltr');expect(rail).toMatchObject({start:11+8,end:47+30,alignItems:'flex-end'});
 // The capsule row itself follows the provider.
 const row=cards()[0].findAll(node=>typeof node.type==='string'&&StyleSheet.flatten(node.props.style)?.minHeight===44)[0];
 expect(StyleSheet.flatten(row.props.style).direction).toBe('rtl');
 // The default swipe is towards the physical right edge.
 const pan=gestures()[0];
 act(()=>{pan.handlers.onBegin();pan.handlers.onStart({translationX:9,translationY:0});pan.handlers.onChange({translationX:39,translationY:0});});
 expect(drawn(cards()[0]).x).toBe(30);
 act(()=>{pan.handlers.onEnd({velocityX:0,velocityY:0});pan.handlers.onFinalize();});
});

it('gives a notice the next id when the one it was handed is an empty string, as Sonner does',()=>{
 mount({expand:true});let ids;
 act(()=>{ids=[toast('One',{id:'',duration:Infinity}),toast('Two',{id:'',duration:Infinity}),toast('Zero',{id:0,duration:Infinity})];});
 expect(texts()).toEqual(expect.arrayContaining(['One','Two','Zero']));expect(typeof ids[0]).toBe('number');expect(ids[1]).not.toBe(ids[0]);expect(ids[2]).toBe(0);
});

it('leaves no timer behind when it unmounts mid-exit, and shows what is still live when it mounts again',()=>{
 jest.useFakeTimers();
 mount();
 act(()=>{toast('Leaving');toast('Staying');});measure([44,44]);
 act(()=>{gestures()[1].handlers.onBegin();});
 act(()=>{dismissToast(toast('Gone',{id:'gone'}));});
 act(()=>root.unmount());root=null;
 expect(jest.getTimerCount()).toBe(0);
 mount();expect(texts()).toEqual(expect.arrayContaining(['Leaving','Staying']));expect(texts()).not.toContain('Gone');
});

it('bounds a burst of calls in one tick: four notices mounted, one announcement, and everything goes when dismissed',()=>onIOS(()=>{
 const announce=jest.fn();swap(AccessibilityInfo,'announceForAccessibilityWithOptions',announce);
 mount();const dismissed=jest.fn();
 act(()=>{for(let count=1;count<=100;count++)toast(`Notice ${count}`,{onDismiss:dismissed});});
 expect(cards()).toHaveLength(4);expect(texts()).toEqual(expect.arrayContaining(['Notice 97','Notice 100']));expect(texts()).not.toContain('Notice 96');
 expect(announce).toHaveBeenCalledTimes(1);expect(announce).toHaveBeenLastCalledWith('Notice 100',{queue:true});
 // The store kept sixteen; none was ever laid out, so none has an exit to play.
 act(()=>{dismissToast();});expect(dismissed).toHaveBeenCalledTimes(16);expect(root.toJSON()).toBeNull();
}));

it('draws a very long message and an empty one without cutting either',()=>{
 mount({expand:true});const long='Withdrawal '.repeat(60).trim();
 act(()=>{toast('',{duration:Infinity});toast(long,{duration:Infinity,description:long});});measure([44,480]);
 expect(texts().filter(value=>value===long)).toHaveLength(2);
 // No line limit: the capsule grows, and large text is not capped.
 for(const node of root.root.findAllByType(RNText)){expect(node.props.numberOfLines).toBeUndefined();expect(node.props.allowFontScaling).not.toBe(false);}
 expect(drawn(cards()[0]).y).toBe(-(480+14));
});
