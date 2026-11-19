/**
 * When the native sheet starts to move. The reaction that tells the sheet where to rest runs on the UI thread on a device;
 * here it is captured and run by hand against plain shared values, with the display's frames stepped one at a time.
 */
const React=require('react');
const {create,act}=require('react-test-renderer');
const mockSheet={values:[],reaction:null};
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{const ref=React.useRef(null);if(ref.current===null){ref.current={value:initial,initial};mockSheet.values.push(ref.current);}return ref.current;};
 return {__esModule:true,default:{View:RN.View,ScrollView:RN.ScrollView},cancelAnimation:()=>{},Easing:{bezier:(...points)=>points},ReduceMotion:{Always:'always',System:'system'},runOnJS:fn=>fn,
  useSharedValue:shared,useDerivedValue:fn=>({get value(){return fn();}}),useAnimatedStyle:()=>({}),useAnimatedProps:()=>({}),useAnimatedScrollHandler:handler=>handler,
  useAnimatedReaction:(prepare,react)=>{mockSheet.reaction={prepare,react};},
  withTiming:(to,config,done)=>({timing:true,to,config,done})};
});
jest.mock('react-native-gesture-handler',()=>{
 const chain=()=>{const gesture={};for(const name of ['activeOffsetY','failOffsetX','onStart','onChange','onEnd','onFinalize','simultaneousWithExternalGesture'])gesture[name]=()=>gesture;return gesture;};
 return {Gesture:{Pan:chain,Native:chain},GestureDetector:({children})=>children};
});
const {GestureSheet}=require('../../packages/hig/native/src/gesture-sheet');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
let root,frames,previous;
const tree=props=>h(HIGProvider,null,h(GestureSheet,{testID:'sheet',title:'Review',snapPoints:['50%'],presentation:'inline',onOpenChange:()=>{},...props}));
// The sheet's translateY: the one shared value that starts far below the screen.
const position=()=>mockSheet.values.find(value=>value.initial===100000);
/** One pass of the reaction, as the UI thread runs it whenever a value it reads has changed. */
const react=()=>{const next=mockSheet.reaction.prepare();mockSheet.reaction.react(next,previous);previous=next;};
/** One display frame: every callback asked for before it, then the reaction for whatever they changed. */
const frame=()=>{const due=frames;frames=[];for(const callback of due)callback(0);react();};
/** A travel that has run its course. */
const land=()=>{const travel=position().value;position().value=travel.to;act(()=>{travel.done?.(true);});};
beforeEach(()=>{
 mockSheet.values.length=0;mockSheet.reaction=null;frames=[];previous=null;
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{frames.push(callback);return frames.length;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(()=>{});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
const mount=props=>{
 act(()=>{root=create(tree(props));});
 act(()=>{root.root.findAll(node=>node.props.testID==='sheet'&&typeof node.type==='string')[0].props.onLayout({nativeEvent:{layout:{height:800}}});});
 frames=[];react();
};

it('holds an opening sheet below the edge for two frames, so its content is drawn before it moves',()=>{
 mount({open:true});
 // The sheet knows where it is going, and waits closed: nothing is in flight.
 expect(position().value).toBe(800);
 frame();
 expect(position().value).toBe(800);
 // The second frame after the render has passed: now it travels to its detent, half the room up.
 frame();
 expect(position().value).toMatchObject({timing:true,to:400});
 expect(position().value.config.duration).toBe(500);
});

it('holds a closing sheet still for two frames after the host closes it, then travels and reports the close',()=>{
 const dismissed=jest.fn();
 mount({open:true,onDismiss:dismissed});
 frame();frame();land();
 expect(position().value).toBe(400);
 act(()=>root.update(tree({open:false,onDismiss:dismissed})));
 frames=[];react();
 // The render that closed it is drawn first; the sheet has not moved.
 expect(position().value).toBe(400);
 frame();
 expect(position().value).toBe(400);
 frame();
 expect(position().value).toMatchObject({timing:true,to:800});
 land();
 // The dismissal is reported a frame after the travel ends, once the host has had its say.
 act(()=>{for(const callback of frames.splice(0))callback(0);});
 expect(dismissed).toHaveBeenCalledTimes(1);
});

it('drops a wait that is overtaken: a sheet reopened before it began to close stays where it is',()=>{
 mount({open:true});
 frame();frame();land();
 act(()=>root.update(tree({open:false})));
 frames=[];react();
 frame();
 // Reopened one frame into the wait.
 act(()=>root.update(tree({open:true})));
 react();
 frame();frame();
 const resting=position().value;
 // It never travelled to the closed position; at most it was told to stay on its detent.
 expect(typeof resting==='number'?resting:resting.to).toBe(400);
 // And the next close waits its two frames again rather than leaving at once.
 act(()=>root.update(tree({open:false})));
 frames=[];react();
 expect(typeof position().value==='number'?position().value:position().value.to).toBe(400);
 frame();frame();
 expect(position().value).toMatchObject({timing:true,to:800});
});
