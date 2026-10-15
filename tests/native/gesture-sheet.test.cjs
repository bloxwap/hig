const React=require('react');
const {create,act}=require('react-test-renderer');
const {BackHandler}=require('react-native');
jest.mock('react-native-reanimated',()=>({ReduceMotion:{Always:'always',System:'system'}}));
jest.mock('@gorhom/bottom-sheet',()=>{
 const React=require('react'),{View,ScrollView}=require('react-native');
 const methods={present:jest.fn(),dismiss:jest.fn()};
 const BottomSheetModal=React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>methods);return React.createElement(View,{...props,testID:'backend'},props.children);});
 return {methods,BottomSheetModal,BottomSheetScrollView:ScrollView,BottomSheetBackdrop:View};
});
const backend=require('@gorhom/bottom-sheet');
const {GestureSheet}=require('../../packages/native/src/gesture-sheet');
const {HIGProvider}=require('../../packages/native/src/provider');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();jest.clearAllMocks();});
function mount(props){act(()=>{root=create(React.createElement(HIGProvider,{reducedMotion:true},React.createElement(GestureSheet,{title:'Review',description:'Verify amount',snapPoints:['50%','90%'],...props},null)));});return root.root.findAll(n=>n.props.testID==='backend')[0];}
it('optional sheet wires stable detents, keyboard avoidance, safe areas and reduced motion',()=>{const node=mount({open:true,onOpenChange:jest.fn()});expect(backend.methods.present).toHaveBeenCalledTimes(1);expect(node.props.snapPoints).toEqual(['50%','90%']);expect(node.props.enableDynamicSizing).toBe(false);expect(node.props.stackBehavior).toBe('push');expect(node.props.keyboardBehavior).toBe('interactive');expect(node.props.android_keyboardInputMode).toBe('adjustResize');expect(node.props.overrideReduceMotion).toBe('always');expect(node.props.topInset).toBe(0);});
it('detent changes and canceled drags never close; repeated dismissal callbacks notify once',()=>{const close=jest.fn();const frames=[];jest.spyOn(global,'requestAnimationFrame').mockImplementation(cb=>{frames.push(cb);return frames.length;});const node=mount({open:true,onOpenChange:close});act(()=>{node.props.onChange(0);node.props.onChange(1);node.props.onChange(0);});expect(close).not.toHaveBeenCalled();act(()=>{node.props.onChange(-1);node.props.onDismiss();node.props.onDismiss();});expect(close).toHaveBeenCalledTimes(1);expect(close).toHaveBeenCalledWith(false);});
it('Android back is scoped to the open sheet and respects nondismissible confirmations',()=>{let back;const remove=jest.fn();jest.spyOn(BackHandler,'addEventListener').mockImplementation((name,callback)=>{back=callback;return {remove};});const close=jest.fn();mount({open:true,dismissible:false,onOpenChange:close});act(()=>expect(back()).toBe(true));expect(close).not.toHaveBeenCalled();act(()=>root.unmount());root=null;expect(remove).toHaveBeenCalledTimes(1);mount({open:true,onOpenChange:close});act(()=>expect(back()).toBe(true));expect(close).toHaveBeenCalledWith(false);});
it('rejected controlled dismissal re-presents after host state settles',()=>{let settle;const raf=jest.spyOn(global,'requestAnimationFrame').mockImplementation(cb=>{settle=cb;return 88;});void raf;const close=jest.fn();const node=mount({open:true,onOpenChange:close});act(()=>node.props.onDismiss());expect(close).toHaveBeenCalledWith(false);expect(backend.methods.present).toHaveBeenCalledTimes(1);act(()=>settle(0));expect(backend.methods.present).toHaveBeenCalledTimes(2);});
it('never dismisses a sheet it has not presented (Gorhom DISMISSING state blocked the first present on simulator/emulator)',()=>{
 const close=jest.fn();mount({open:false,onOpenChange:close});expect(backend.methods.dismiss).not.toHaveBeenCalled();
 act(()=>root.update(React.createElement(HIGProvider,{reducedMotion:true},React.createElement(GestureSheet,{title:'Review',description:'Verify amount',snapPoints:['50%','90%'],open:true,onOpenChange:close},null))));
 expect(backend.methods.present).toHaveBeenCalledTimes(1);expect(backend.methods.dismiss).not.toHaveBeenCalled();
 act(()=>root.update(React.createElement(HIGProvider,{reducedMotion:true},React.createElement(GestureSheet,{title:'Review',description:'Verify amount',snapPoints:['50%','90%'],open:false,onOpenChange:close},null))));
 expect(backend.methods.dismiss).toHaveBeenCalledTimes(1);
});
it('sheet content stays individually reachable by screen readers (iOS Simulator: Gorhom grouped it as one "Bottom Sheet" element)',()=>{const node=mount({open:true,onOpenChange:jest.fn()});expect(node.props.accessible).toBe(false);expect(node.props.accessibilityLabel).toBe('Review');});
it('sheet Close follows HIGProvider messages, closeLabel and RTL',()=>{const {Text:RNText}=require('react-native');const label=()=>root.root.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function').map(b=>b.findAllByType(RNText).map(t=>[].concat(t.props.children).join('')).join(''));const close=jest.fn();
 act(()=>{root=create(React.createElement(HIGProvider,{reducedMotion:true,direction:'rtl',locale:'ar-EG',messages:{close:'إغلاق'}},React.createElement(GestureSheet,{title:'مراجعة',description:'تحقق',snapPoints:['50%'],open:true,onOpenChange:close},null)));});
 expect(label()).toEqual(['إغلاق']);act(()=>root.root.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0].props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));expect(close).toHaveBeenCalledWith(false);
 act(()=>{root.update(React.createElement(HIGProvider,{reducedMotion:true,direction:'rtl',locale:'ar-EG',messages:{close:'إغلاق'}},React.createElement(GestureSheet,{title:'مراجعة',description:'تحقق',snapPoints:['50%'],open:true,onOpenChange:close,closeLabel:'تم'},null)));});
 expect(label()).toEqual(['تم']);});
