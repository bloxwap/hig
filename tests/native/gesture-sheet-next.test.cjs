/** HIG's own native sheet: what it renders and when, with the animation and gesture libraries replaced by inert stand-ins. Motion itself is covered by tests/gesture-sheet-model.test.ts and by device runs. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {BackHandler,Text:RNText}=require('react-native');
const mockSprings=[];
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{const ref=React.useRef(null);if(ref.current===null)ref.current={value:initial};return ref.current;};
 return {__esModule:true,default:{View:RN.View,ScrollView:RN.ScrollView},cancelAnimation:()=>{},ReduceMotion:{Always:'always',System:'system'},runOnJS:fn=>fn,
  useSharedValue:shared,useDerivedValue:fn=>({get value(){return fn();}}),useAnimatedStyle:()=>({}),useAnimatedProps:()=>({}),useAnimatedScrollHandler:()=>()=>{},useAnimatedReaction:()=>{},
  withSpring:(to,config,done)=>{mockSprings.push({to,config,done});return to;},withTiming:to=>to};
});
jest.mock('react-native-gesture-handler',()=>{
 const chain=()=>{const gesture={};for(const name of ['activeOffsetY','failOffsetX','onStart','onChange','onEnd','onFinalize','simultaneousWithExternalGesture'])gesture[name]=()=>gesture;return gesture;};
 return {Gesture:{Pan:chain,Native:chain},GestureDetector:({children})=>children};
});
const {GestureSheet,GestureSheetHost,GestureSheetScrollView}=require('../../packages/hig/native/src/gesture-sheet-next');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;mockSprings.length=0;jest.restoreAllMocks();});
const tree=(props,{host=true,provider={}}={})=>h(HIGProvider,{reducedMotion:true,...provider},host?h(GestureSheetHost,null,h(GestureSheet,{testID:'sheet',title:'Review',description:'Verify amount',snapPoints:['50%','90%'],onOpenChange:()=>{},...props},props.children??null)):h(GestureSheet,{testID:'sheet',title:'Review',snapPoints:['50%'],onOpenChange:()=>{},...props},props.children??null));
const mount=(props,options)=>{act(()=>{root=create(tree(props,options));});return root.root;};
const all=(view,id)=>view.findAll(node=>node.props.testID===id&&typeof node.type==='string');
const layout=view=>act(()=>{all(view,'sheet')[0].props.onLayout({nativeEvent:{layout:{height:800}}});});
const text=node=>typeof node==='string'?node:node.children.map(text).join('');

it('rejects sizing props that contradict each other',()=>{
 const quiet=jest.spyOn(console,'error').mockImplementation(()=>{});
 expect(()=>mount({open:true,snapPoints:[]})).toThrow('at least one snap point');
 expect(()=>mount({open:true,enableDynamicSizing:true,snapPoints:['50%']})).toThrow('does not accept fixed snapPoints');
 expect(()=>mount({open:true,enableDynamicSizing:true,snapPoints:undefined,maxDynamicContentSize:0})).toThrow('greater than zero');
 quiet.mockRestore();
});

it('a modal sheet draws in the host layer only while open, with default anatomy once it knows its room',()=>{
 let view=mount({open:false});expect(all(view,'sheet')).toHaveLength(0);
 act(()=>root.update(tree({open:true})));view=root.root;
 expect(all(view,'sheet')).toHaveLength(1);expect(all(view,'sheet-backdrop')).toHaveLength(1);expect(all(view,'sheet-surface')).toHaveLength(1);
 // Content waits for the room, so it is laid out once at its real size.
 expect(all(view,'sheet-handle')).toHaveLength(0);layout(view);expect(all(view,'sheet-handle')).toHaveLength(1);
 const texts=view.findAllByType(RNText).map(text);expect(texts).toEqual(expect.arrayContaining(['Review','Verify amount','Close']));
 expect(all(view,'sheet-content')[0].props.accessibilityViewIsModal).toBe(true);
 // The surface is rasterised on Android so moving it costs no redraw of its content.
 expect(all(view,'sheet-surface')[0].props.renderToHardwareTextureAndroid).toBe(true);
});

it('Close, the backdrop, Android Back and the accessibility escape ask the host to close; none of them do when not dismissible',()=>{
 const change=jest.fn();let back;jest.spyOn(BackHandler,'addEventListener').mockImplementation((name,callback)=>{back=callback;return {remove:()=>{}};});
 let view=mount({open:true,onOpenChange:change});layout(view);
 act(()=>{view.findAll(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function').at(-1).props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented:()=>false});});expect(change).toHaveBeenCalledWith(false);expect(change).toHaveBeenCalledTimes(1);
 // One request per presentation, however many controls ask.
 act(()=>{all(view,'sheet-backdrop')[0].findAll(node=>typeof node.props.onPress==='function')[0].props.onPress({});});expect(back()).toBe(true);expect(change).toHaveBeenCalledTimes(1);
 change.mockClear();act(()=>root.unmount());
 view=mount({open:true,onOpenChange:change,dismissible:false,contentMode:'custom'});layout(view);
 expect(all(view,'sheet-backdrop')[0].findAll(node=>typeof node.props.onPress==='function')).toHaveLength(0);expect(back()).toBe(true);expect(all(view,'sheet-content')[0].props.onAccessibilityEscape).toBeUndefined();expect(change).not.toHaveBeenCalled();
 // A host handler decides Back first.
 act(()=>root.unmount());mount({open:true,onOpenChange:change,onHardwareBackPress:()=>false});expect(back()).toBe(false);
});

it('custom content draws the host tree with a hidden title, and labelledBy and backdropOpacity 0 apply',()=>{
 const view=mount({open:true,contentMode:'custom',labelledBy:'pane-title',backdropOpacity:0,handle:false,children:h(RNText,{testID:'pane'},'Pane')});layout(view);
 expect(all(view,'pane')).toHaveLength(1);expect(all(view,'sheet-backdrop')).toHaveLength(0);expect(all(view,'sheet-handle')).toHaveLength(0);
 expect(all(view,'sheet-content')[0].props.accessibilityLabelledBy).toBe('pane-title');
 expect(view.findAll(node=>node.props.accessibilityLabel==='Review').length).toBeGreaterThan(0);
 expect(view.findAllByType(RNText).map(text)).not.toContain('Close');
});

it('an inline sheet stays mounted and hidden while closed, and a modal sheet without a host draws in place',()=>{
 let view=mount({open:false,presentation:'inline',contentMode:'custom',children:h(RNText,{testID:'pane'},'Pane')});layout(view);
 expect(all(view,'pane')).toHaveLength(1);expect(all(view,'sheet')[0].props.pointerEvents).toBe('none');
 expect(all(view,'sheet-content')[0].props).toMatchObject({accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants'});
 act(()=>root.update(tree({open:true,presentation:'inline',contentMode:'custom',children:h(RNText,{testID:'pane'},'Pane')})));
 expect(all(root.root,'sheet')[0].props.pointerEvents).toBe('box-none');expect(all(root.root,'sheet-content')[0].props.accessibilityElementsHidden).toBe(false);
 act(()=>root.unmount());
 view=mount({open:true},{host:false});expect(all(view,'sheet')).toHaveLength(1);
});

it('sizes fixed content to the tallest detent and caps content-sized sheets',()=>{
 let view=mount({open:true,contentMode:'custom',handle:false});layout(view);
 const box=id=>all(view,id)[0].parent;
 // 90% of 800 points of room (the mocked safe area has no top inset).
 expect(view.findAll(node=>typeof node.type==='string'&&node.props.style&&node.props.style.height===720)).toHaveLength(1);
 act(()=>root.unmount());
 view=mount({open:true,contentMode:'custom',handle:false,enableDynamicSizing:true,snapPoints:undefined,maxDynamicContentSize:300});layout(view);
 expect(view.findAll(node=>typeof node.type==='string'&&node.props.style&&node.props.style.maxHeight===300)).toHaveLength(1);void box;
});

it('GestureSheetScrollView is a plain scroller outside a sheet, with bounce and overscroll off',()=>{
 act(()=>{root=create(h(GestureSheetScrollView,{testID:'scroller'},h(RNText,null,'Row')));});
 const scroller=root.root.findAll(node=>node.props.testID==='scroller'&&node.props.bounces!==undefined)[0];
 expect(scroller.props).toMatchObject({bounces:false,overScrollMode:'never',scrollEventThrottle:16});
});
