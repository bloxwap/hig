const React=require('react');
const {create,act}=require('react-test-renderer');
const native=require('react-native');
const {View,Text,ScrollView,BackHandler,AccessibilityInfo}=native;
jest.mock('react-native-reanimated',()=>({ReduceMotion:{Always:'always',System:'system'}}));
jest.mock('@gorhom/bottom-sheet',()=>{
 const React=require('react'),{View,ScrollView}=require('react-native');
 const inlineMethods={snapToIndex:jest.fn(),close:jest.fn(),expand:jest.fn()};
 const modalMethods={present:jest.fn(),dismiss:jest.fn(),snapToIndex:jest.fn()};
 const component=(methods,id)=>React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>methods);return React.createElement(View,{...props,testID:id},props.children);});
 return {__esModule:true,default:component(inlineMethods,'inline-backend'),BottomSheetModal:component(modalMethods,'modal-backend'),BottomSheetView:View,BottomSheetScrollView:ScrollView,BottomSheetBackdrop:View,inlineMethods,modalMethods};
});
const backend=require('@gorhom/bottom-sheet');
const {GestureSheet}=require('../../packages/native/src/gesture-sheet');
const {HIGProvider}=require('../../packages/native/src/provider');
let root,frames,nextFrame;
beforeEach(()=>{
 frames=new Map();nextFrame=1;
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{const id=nextFrame++;frames.set(id,callback);return id;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(id=>frames.delete(id));
 jest.spyOn(native,'findNodeHandle').mockImplementation(node=>node?._nativeTag??31);
 jest.spyOn(AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();jest.clearAllMocks();});
const defaults={presentation:'inline',open:false,onOpenChange:jest.fn(),snapPoints:[200,500],title:'Markets',contentMode:'custom'};
function Picker(){const [query,setQuery]=React.useState('');return React.createElement(ScrollView,{testID:'list',contentOffset:{x:0,y:120}},React.createElement(Text,{testID:'query',onPress:()=>setQuery('ETH')},query||'All'));}
const element=props=>React.createElement(HIGProvider,{reducedMotion:true},React.createElement(GestureSheet,{...defaults,...props},React.createElement(Picker)));
function mount(props){act(()=>{root=create(element(props));});return node();}
function update(props){act(()=>root.update(element(props)));return node();}
const node=()=>root.root.findAll(item=>item.props.testID==='inline-backend')[0];
function flush(){const pending=[...frames.values()];frames.clear();act(()=>pending.forEach(callback=>callback(0)));}

it('prepares mounted closed content without accessibility, touch, Back or an initial dismissal',()=>{
 const back=jest.spyOn(BackHandler,'addEventListener'),dismiss=jest.fn(),ref=React.createRef();
 const sheet=mount({onDismiss:dismiss,sheetRef:ref});
 expect(sheet.props).toMatchObject({index:-1,accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants',overrideReduceMotion:'always'});
 expect(root.root.findAllByType(ScrollView)).toHaveLength(1);
 expect(root.root.findAll(item=>typeof item.type==='string'&&item.props.pointerEvents==='none')).toHaveLength(1);
 const hidden=root.root.findAll(item=>typeof item.type==='string'&&item.props.pointerEvents==='none')[0];
 expect(hidden.props).toMatchObject({accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants',collapsable:false,style:{flex:1,flexShrink:1,minHeight:0}});
 expect(back).not.toHaveBeenCalled();
 expect(ref.current).toBe(backend.inlineMethods);
 expect(ref.current.present).toBeUndefined();
 act(()=>{sheet.props.onChange(-1);sheet.props.onClose();});flush();
 expect(dismiss).not.toHaveBeenCalled();expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
 expect(backend.inlineMethods.close).not.toHaveBeenCalled();
});

it('preserves child and native list identity through open, detent changes, accepted close and reopen',()=>{
 const onOpenChange=jest.fn(),onDismiss=jest.fn(),returnFocusRef={current:{_nativeTag:99}};
 const props={onOpenChange,onDismiss,returnFocusRef};mount(props);
 const list=root.root.findByType(ScrollView);
 act(()=>root.root.findByProps({testID:'query'}).props.onPress());
 let sheet=update({...props,open:true,initialIndex:1});
 expect(sheet.props.index).toBe(1);expect(backend.inlineMethods.snapToIndex).toHaveBeenLastCalledWith(1);
 expect(sheet.props.accessibilityElementsHidden).toBe(false);
 act(()=>sheet.props.onChange(1));
 const focusCount=AccessibilityInfo.setAccessibilityFocus.mock.calls.length;
 sheet=update({...props,open:true,initialIndex:1,snapPoints:[220,600]});
 expect(root.root.findByType(ScrollView)).toBe(list);
 expect(root.root.findByProps({testID:'query'}).props.children).toBe('ETH');
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(focusCount);
 act(()=>sheet.props.onChange(-1));expect(onOpenChange).toHaveBeenCalledWith(false);
 sheet=update({...props,open:false});
 expect(onDismiss).not.toHaveBeenCalled();
 act(()=>{sheet.props.onClose();sheet.props.onClose();});flush();
 expect(onDismiss).toHaveBeenCalledTimes(1);expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenLastCalledWith(99);
 sheet=update({...props,open:true});
 expect(sheet.props.index).toBe(0);expect(root.root.findByType(ScrollView)).toBe(list);
 expect(root.root.findByProps({testID:'query'}).props.children).toBe('ETH');
});

it('restores rejected close geometry without returning focus or replacing content, and ignores interrupted close completion',()=>{
 const onDismiss=jest.fn(),onOpenChange=jest.fn(),props={open:true,onDismiss,onOpenChange};
 let sheet=mount(props);act(()=>sheet.props.onChange(1));
 const list=root.root.findByType(ScrollView),focusCount=AccessibilityInfo.setAccessibilityFocus.mock.calls.length;
 act(()=>{sheet.props.onChange(-1);sheet.props.onClose();});flush();
 expect(backend.inlineMethods.snapToIndex).toHaveBeenLastCalledWith(1);
 act(()=>node().props.onChange(1));
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(focusCount);
 expect(onDismiss).not.toHaveBeenCalled();expect(root.root.findByType(ScrollView)).toBe(list);
 sheet=update({...props,open:false});act(()=>sheet.props.onClose());
 update({...props,open:true});flush();
 expect(onDismiss).not.toHaveBeenCalled();expect(root.root.findByType(ScrollView)).toBe(list);
});

it('keeps inline Back scoped only while open and forwards the original screen layer',()=>{
 let listener;const remove=jest.fn(),change=jest.fn();
 jest.spyOn(BackHandler,'addEventListener').mockImplementation((_name,callback)=>{listener=callback;return {remove};});
 const props={open:true,onOpenChange:change,containerStyle:{zIndex:100},enableContentPanningGesture:false};
 const sheet=mount(props);expect(sheet.props.containerStyle).toEqual({zIndex:100});expect(sheet.props.enableContentPanningGesture).toBe(false);
 act(()=>expect(listener()).toBe(true));expect(change).toHaveBeenCalledWith(false);
 update({...props,open:false});expect(remove).toHaveBeenCalledTimes(1);
});
