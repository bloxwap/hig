/** HIG's own native sheet: what it renders and when, with the animation and gesture libraries replaced by inert stand-ins. Motion itself is covered by tests/gesture-sheet-model.test.ts and by device runs. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {BackHandler,StyleSheet,Text:RNText}=require('react-native');
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 const shared=initial=>{const ref=React.useRef(null);if(ref.current===null)ref.current={value:initial};return ref.current;};
 return {__esModule:true,default:{View:RN.View,ScrollView:RN.ScrollView},cancelAnimation:()=>{},Easing:{bezier:(...points)=>points},ReduceMotion:{Always:'always',System:'system'},runOnJS:fn=>fn,
  useSharedValue:shared,useDerivedValue:fn=>({get value(){return fn();}}),useAnimatedStyle:()=>({}),useAnimatedProps:()=>({}),useAnimatedScrollHandler:handler=>handler,useAnimatedReaction:()=>{},
  useAnimatedRef:()=>{const ref=React.useRef(null);if(ref.current===null){const set=node=>{set.current=node;};set.current=null;ref.current=set;}return ref.current;},scrollTo:jest.fn(),
  withTiming:to=>to};
});
jest.mock('react-native-gesture-handler',()=>{
 const chain=()=>{const gesture={};for(const name of ['activeOffsetY','failOffsetX','onStart','onChange','onEnd','onFinalize','simultaneousWithExternalGesture'])gesture[name]=()=>gesture;return gesture;};
 return {Gesture:{Pan:chain,Native:chain},GestureDetector:({children})=>children};
});
const {GestureSheet,GestureSheetHost,GestureSheetScrollView}=require('../../packages/hig/native/src/gesture-sheet');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
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

it('uses the measured host to lay out modal content on its first render',()=>{
 const view=mount({open:false});
 const host=view.findAll(node=>typeof node.type==='string'&&node.props.onLayout)[0];
 act(()=>host.props.onLayout({nativeEvent:{layout:{height:800}}}));
 act(()=>root.update(tree({open:true})));
 expect(all(root.root,'sheet-content')).toHaveLength(1);
});

it('a modal sheet draws in the host layer only while open, with default anatomy once it knows its room',()=>{
 let view=mount({open:false});expect(all(view,'sheet')).toHaveLength(0);
 act(()=>root.update(tree({open:true})));view=root.root;
 expect(all(view,'sheet')).toHaveLength(1);expect(all(view,'sheet-backdrop')).toHaveLength(1);expect(all(view,'sheet-surface')).toHaveLength(1);
 // Content waits for the room, so it is laid out once at its real size.
 expect(all(view,'sheet-handle')).toHaveLength(0);layout(view);expect(all(view,'sheet-handle')).toHaveLength(1);
 const texts=view.findAllByType(RNText).map(text);expect(texts).toEqual(expect.arrayContaining(['Review','Verify amount','Close']));
 expect(all(view,'sheet-content')[0].props.accessibilityViewIsModal).toBe(true);
 expect(StyleSheet.flatten(view.findByType(GestureSheetScrollView).props.contentContainerStyle).paddingHorizontal).toBe(16);
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
 expect(view.findAll(node=>typeof node.type==='string'&&node.props.style&&require('react-native').StyleSheet.flatten(node.props.style).height===720)).toHaveLength(1);
 act(()=>root.unmount());
 view=mount({open:true,contentMode:'custom',handle:false,enableDynamicSizing:true,snapPoints:undefined,maxDynamicContentSize:300});layout(view);
 expect(view.findAll(node=>typeof node.type==='string'&&node.props.style&&require('react-native').StyleSheet.flatten(node.props.style).maxHeight===300)).toHaveLength(1);void box;
});

it('GestureSheetScrollView is a plain scroller outside a sheet, with bounce and overscroll off',()=>{
 act(()=>{root=create(h(GestureSheetScrollView,{testID:'scroller'},h(RNText,null,'Row')));});
 const scroller=root.root.findAll(node=>node.props.testID==='scroller'&&node.props.bounces!==undefined)[0];
 expect(scroller.props).toMatchObject({bounces:false,overScrollMode:'never',scrollEventThrottle:16});
});

it('does not republish a stable sheet on unrelated parent updates and still propagates changed content',()=>{
 const renders=jest.fn();
 function Content({label}){renders();return h(RNText,{testID:'stable-content'},label);}
 const props={open:true,title:'Review',contentMode:'custom',snapPoints:['50%'],onOpenChange:()=>{},testID:'sheet'};
 const child=h(Content,{label:'Before'});
 const render=(tick,children)=>h(HIGProvider,{reducedMotion:true},h(GestureSheetHost,null,h(RNText,null,String(tick)),h(GestureSheet,props,children)));
 act(()=>{root=create(render(0,child));});layout(root.root);renders.mockClear();
 act(()=>root.update(render(1,child)));
 expect(renders).not.toHaveBeenCalled();
 act(()=>root.update(render(2,h(Content,{label:'After'}))));
 expect(renders).toHaveBeenCalled();
 expect(text(all(root.root,'stable-content')[0])).toBe('After');
});
it('is HIG\'s one native sheet, on one path, and nothing loads another sheet library',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=path.resolve(__dirname,'../../packages/hig/native/src');
 expect(fs.readdirSync(source).filter(file=>/@gorhom/.test(fs.readFileSync(path.join(source,file),'utf8')))).toEqual([]);
 const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../packages/hig/package.json'),'utf8'));
 expect(Object.keys({...manifest.peerDependencies,...manifest.peerDependenciesMeta}).filter(name=>name.startsWith('@gorhom'))).toEqual([]);
 expect(manifest.exports['./native/gesture-sheet-next']).toBeUndefined();expect(manifest.exports['./native/gesture-sheet']).toBeDefined();
});
it('hands a list its own scroll events as well as the sheet\'s, so a windowed list keeps drawing rows',()=>{
 const {ScrollView}=require('react-native');const onScroll=jest.fn();
 act(()=>{root=create(h(GestureSheetScrollView,{onScroll}));});
 const scroller=root.root.findByType(ScrollView);
 act(()=>scroller.props.onScroll({contentOffset:{y:120}}));
 expect(onScroll).toHaveBeenCalledWith(expect.objectContaining({nativeEvent:expect.objectContaining({contentOffset:{y:120}})}));
});
it('holds its content while the sheet is away from its top detent, and tells neither the sheet nor the host',()=>{
 const {ScrollView}=require('react-native');const {scrollTo}=require('react-native-reanimated');scrollTo.mockClear();
 const onScroll=jest.fn();
 // The stand-ins never run the opening travel, so this open sheet is still below its top detent.
 const view=mount({open:true,contentMode:'custom',children:h(GestureSheetScrollView,{testID:'held',onScroll},h(RNText,null,'Row'))});layout(view);
 const scroller=view.findAll(node=>node.type===ScrollView&&node.props.testID==='held')[0];
 // The content slips 40 under a moving sheet: it is put back where it was (its top) at once.
 act(()=>scroller.props.onScroll({contentOffset:{y:40}}));
 expect(scrollTo).toHaveBeenCalledTimes(1);expect(scrollTo.mock.calls[0].slice(1)).toEqual([0,0,false]);
 expect(onScroll).not.toHaveBeenCalled();
 // The event that reports it back at its place moves nothing again.
 act(()=>scroller.props.onScroll({contentOffset:{y:0}}));
 expect(scrollTo).toHaveBeenCalledTimes(1);expect(onScroll).not.toHaveBeenCalled();
});
it('keeps a host ref on the scroller as well as its own',()=>{
 const {ScrollView}=require('react-native');const ref=React.createRef();const seen=jest.fn();
 act(()=>{root=create(h(GestureSheetScrollView,{ref}));});
 expect(ref.current).toBe(root.root.findByType(ScrollView).instance);
 act(()=>root.update(h(GestureSheetScrollView,{ref:seen})));
 expect(seen).toHaveBeenCalledWith(root.root.findByType(ScrollView).instance);
});
it('draws nothing behind its handle: no highlight sits in the top corner of the surface',()=>{
 const {RadialGradient,LinearGradient}=require('react-native-svg');
 const view=mount({open:true});layout(view);
 expect(all(view,'sheet-handle')).toHaveLength(1);
 expect(view.findAllByType(RadialGradient)).toHaveLength(0);expect(view.findAllByType(LinearGradient)).toHaveLength(0);
 // The fade a pinned header draws once content scrolls under it is the only gradient the module keeps.
 const source=require('node:fs').readFileSync(require.resolve('../../packages/hig/native/src/sheet-header-glow.tsx'),'utf8');
 expect(source).not.toContain('RadialGradient');expect(source).toContain('SheetHeaderScrim');
});

it('tells its content the colour it paints, and keeps content mounted when the elevation step is switched',()=>{
 const {GestureSheetSurfaceContext}=require('../../packages/hig/native/src/sheet-header-glow');
 const {useColors,useFills}=require('../../packages/hig/native/src/provider');
 const seen=[];let mounts=0;
 function Probe(){const surface=React.useContext(GestureSheetSurfaceContext),colors=useColors(),fills=useFills();React.useEffect(()=>{mounts++;},[]);seen.push({surface,overlay:colors.overlay,stepped:fills.well===colors.nested});return null;}
 const props={open:true,contentMode:'custom',children:h(Probe)};
 layout(mount(props));
 expect(seen.at(-1)).toMatchObject({stepped:true});expect(seen.at(-1).surface).toBe(seen.at(-1).overlay);
 // A host that paints the page colour: a pinned header fades into that colour, and wells stay on the page's shade.
 act(()=>root.update(tree({...props,raised:false,backgroundStyle:{backgroundColor:'#123456'}})));
 expect(seen.at(-1)).toMatchObject({surface:'#123456',stepped:false});
 act(()=>root.update(tree(props)));
 expect(seen.at(-1)).toMatchObject({stepped:true});expect(mounts).toBe(1);
});

it('travels on the drawer curve and follows a new height on the resize curve',()=>{
 const {gestureSheetTravel,gestureSheetResize}=require('../../packages/hig/native/src/gesture-sheet');
 // The stand-in Easing.bezier returns its control points.
 expect(gestureSheetTravel).toEqual({duration:500,easing:[0.32,0.72,0,1]});
 expect(gestureSheetResize).toEqual({duration:270,easing:[0.26,0.08,0.25,1]});
 const source=require('fs').readFileSync(require.resolve('../../packages/hig/native/src/gesture-sheet.tsx'),'utf8');
 // Opening, closing, a change of detent and a release travel; only the same detent at a new offset resizes.
 expect(source).toContain('resizes?gestureSheetResize:gestureSheetTravel');
 expect(source.match(/\.\.\.gestureSheetTravel,reduceMotion/g)).toHaveLength(1);
 expect(source).not.toContain('gestureSheetAnimationConfigs');
});
