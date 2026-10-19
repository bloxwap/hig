const React=require('react');
const {act,create}=require('react-test-renderer');
const native=require('react-native');
const {View,Text,ScrollView,StyleSheet,AccessibilityInfo}=native;
jest.mock('react-native-reanimated',()=>({ReduceMotion:{Always:'always',System:'system'}}));
jest.mock('@gorhom/bottom-sheet',()=>{
 const React=require('react'),{View,ScrollView}=require('react-native');
 const methods={present:jest.fn(),dismiss:jest.fn(),snapToIndex:jest.fn()};
 const BottomSheetModal=React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>methods);return React.createElement(View,{...props,testID:'backend'},props.children);});
 const BottomSheetView=props=>React.createElement(View,{...props,testID:'measured-content'},props.children);
 return {methods,BottomSheetModal,BottomSheetView,BottomSheetScrollView:ScrollView,BottomSheetBackdrop:View};
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
const defaults={open:true,title:'Size and leverage',onOpenChange:jest.fn(),contentMode:'custom',enableDynamicSizing:true,maxDynamicContentSize:480};
function Counter({rows=1}){
 const [count,setCount]=React.useState(0);
 return React.createElement(View,null,React.createElement(Text,{testID:'counter',onPress:()=>setCount(value=>value+1)},`count:${count}`),React.createElement(ScrollView,{testID:'caller-scroll'},Array.from({length:rows},(_,index)=>React.createElement(Text,{key:index},`Row ${index}`))));
}
function element(props={},rows=1){return React.createElement(HIGProvider,{reducedMotion:true},React.createElement(GestureSheet,{...defaults,...props},React.createElement(Counter,{rows})));}
function mount(props={},rows=1){act(()=>{root=create(element(props,rows));});return modal();}
function update(props={},rows=1){act(()=>root.update(element(props,rows)));return modal();}
function modal(){return root.root.findAll(n=>n.props.testID==='backend')[0];}
function flushFrames(){const pending=[...frames.values()];frames.clear();act(()=>pending.forEach(callback=>callback(0)));}

it('uses backend intrinsic measurement, one generated detent and caller-owned scrolling',()=>{
 const node=mount({initialIndex:4});
 expect(node.props.enableDynamicSizing).toBe(true);
 expect(node.props.snapPoints).toBeUndefined();
 expect(node.props.index).toBe(0);
 expect(node.props.maxDynamicContentSize).toBe(480);
 const measured=root.root.findByType(backend.BottomSheetView);
 expect(StyleSheet.flatten(measured.props.style).flex).toBeUndefined();
 expect(root.root.findAllByType(ScrollView)).toHaveLength(1);
 expect(root.root.findAll(n=>n.props.accessibilityRole==='button')).toHaveLength(0);
 expect(node.props.overrideReduceMotion).toBe('always');
});

it('content and ceiling changes retain card state, the presentation and open focus',()=>{
 const change=jest.fn();let node=mount({onOpenChange:change});
 act(()=>{node.props.onChange(0);root.root.findAll(n=>n.props.testID==='counter')[0].props.onPress();});
 node=update({onOpenChange:change,maxDynamicContentSize:640},24);
 act(()=>node.props.onChange(0));
 expect(node.props.maxDynamicContentSize).toBe(640);
 expect(root.root.findAllByType(Text).some(n=>n.props.children==='count:1')).toBe(true);
 expect(backend.methods.present).toHaveBeenCalledTimes(1);
 expect(backend.methods.dismiss).not.toHaveBeenCalled();
 expect(backend.methods.snapToIndex).not.toHaveBeenCalled();
 expect(change).not.toHaveBeenCalled();
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1);
});

it('dynamic anatomy keeps default scrolling and translated Close when custom content is not selected',()=>{
 mount({contentMode:'default',closeLabel:'Done'});
 expect(root.root.findAllByType(backend.BottomSheetView)).toHaveLength(0);
 expect(root.root.findAllByType(ScrollView)).toHaveLength(2); // built-in scroller and the caller's test content
 expect(root.root.findAll(n=>n.props.accessibilityRole==='button')).not.toHaveLength(0);
 expect(JSON.stringify(root.toJSON())).toContain('Done');
});

it('retains controlled dismissal, focus return and one settled callback after content changes',()=>{
 const change=jest.fn(),closed=jest.fn(),returnFocusRef={current:{_nativeTag:77}};
 let node=mount({onOpenChange:change,onDismiss:closed,returnFocusRef});
 act(()=>node.props.onDismiss());flushFrames(); // owner rejected dismissal
 expect(closed).not.toHaveBeenCalled();expect(backend.methods.present).toHaveBeenCalledTimes(2);
 node=update({open:false,onOpenChange:change,onDismiss:closed,returnFocusRef},12);
 act(()=>node.props.onDismiss());
 update({open:true,onOpenChange:change,onDismiss:closed,returnFocusRef},3);flushFrames(); // interrupted close
 expect(closed).not.toHaveBeenCalled();
 node=update({open:false,onOpenChange:change,onDismiss:closed,returnFocusRef},3);
 act(()=>{node.props.onDismiss();node.props.onDismiss();});flushFrames();
 expect(closed).toHaveBeenCalledTimes(1);
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenLastCalledWith(77);
});

it('passes content-panning and keyboard policies while preserving HIG defaults when omitted',()=>{
 let node=mount({enableContentPanningGesture:false,keyboardBehavior:'fillParent',keyboardBlurBehavior:'none',android_keyboardInputMode:'adjustPan'});
 expect(node.props).toMatchObject({enableContentPanningGesture:false,keyboardBehavior:'fillParent',keyboardBlurBehavior:'none',android_keyboardInputMode:'adjustPan'});
 node=update();
 expect(node.props.enableContentPanningGesture).toBeUndefined();
 expect(node.props).toMatchObject({keyboardBehavior:'interactive',keyboardBlurBehavior:'restore',android_keyboardInputMode:'adjustResize'});
});

it.each([0,-1,NaN,Infinity,-Infinity])('rejects an invalid dynamic ceiling: %s',maxDynamicContentSize=>{
 jest.spyOn(console,'error').mockImplementation(()=>{});
 expect(()=>mount({maxDynamicContentSize})).toThrow(/finite and greater than zero/);
});

it('rejects competing fixed points in content sizing and missing points in fixed sizing',()=>{
 jest.spyOn(console,'error').mockImplementation(()=>{});
 expect(()=>mount({snapPoints:['50%']})).toThrow(/does not accept fixed snapPoints/);
 expect(()=>mount({enableDynamicSizing:false})).toThrow(/at least one snap point/);
 expect(()=>mount({enableDynamicSizing:false,snapPoints:[]})).toThrow(/at least one snap point/);
});
