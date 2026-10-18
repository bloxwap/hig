const React=require('react');
const {create,act}=require('react-test-renderer');
const native=require('react-native');
const {View,Text,ScrollView,StyleSheet,AccessibilityInfo,BackHandler}=native;
jest.mock('react-native-reanimated',()=>({ReduceMotion:{Always:'always',System:'system'}}));
jest.mock('@gorhom/bottom-sheet',()=>{
 const React=require('react'),{View,ScrollView}=require('react-native');
 const methods={present:jest.fn(),dismiss:jest.fn(),snapToIndex:jest.fn()};
 const BottomSheetModal=React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>methods);return React.createElement(View,{...props,testID:'backend'},props.children);});
 return {methods,BottomSheetModal,BottomSheetScrollView:ScrollView,BottomSheetBackdrop:View};
});
const backend=require('@gorhom/bottom-sheet');
const {GestureSheet}=require('../../packages/native/src/gesture-sheet');
const {HIGProvider}=require('../../packages/native/src/provider');
const {Heading}=require('../../packages/native/src/surface');
let root,frames,nextFrame;
beforeEach(()=>{
 frames=new Map();nextFrame=1;
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{const id=nextFrame++;frames.set(id,callback);return id;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(id=>frames.delete(id));
 jest.spyOn(native,'findNodeHandle').mockImplementation(node=>node?._nativeTag??31);
 jest.spyOn(AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();jest.clearAllMocks();});
const defaults={open:true,onOpenChange:jest.fn(),title:'Account',contentMode:'custom',snapPoints:['35%','80%']};
function element(props={},children=React.createElement(View,{testID:'card',style:{flex:1}},React.createElement(ScrollView,{testID:'caller-scroll'},React.createElement(Text,null,'Card body')))){
 return React.createElement(HIGProvider,{reducedMotion:true},React.createElement(GestureSheet,{...defaults,...props},children));
}
function mount(props,children){act(()=>{root=create(element(props,children));});return modal();}
function update(props,children){act(()=>root.update(element(props,children)));return modal();}
function modal(){return root.root.findAll(n=>n.props.testID==='backend')[0];}
function flushFrames(){const pending=[...frames.values()];frames.clear();act(()=>pending.forEach(callback=>callback(0)));}

it('custom content owns its full-height layout, nested scrolling and dismissal actions',()=>{
 const node=mount({description:'A default description must not appear',closeLabel:'Default close'});
 const card=root.root.findAll(n=>n.props.testID==='card')[0];
 expect(root.root.findAllByType(ScrollView)).toHaveLength(1);
 expect(StyleSheet.flatten(card.parent.props.style)).toMatchObject({flex:1});
 expect(StyleSheet.flatten(card.parent.props.style).padding).toBeUndefined();
 expect(root.root.findAll(n=>n.props.accessibilityRole==='button')).toHaveLength(0);
 expect(JSON.stringify(root.toJSON())).not.toContain('A default description must not appear');
 expect(node.props.accessibilityLabel).toBe('Account');
 expect(node.props.accessible).toBe(false);
 const heading=root.root.findAllByType(Text).find(n=>n.props.accessibilityRole==='header');
 expect(heading.props.accessible).toBe(true);
 expect(heading.props.accessibilityLabel).toBe('Account');
 expect(StyleSheet.flatten(heading.props.style)).toMatchObject({position:'absolute',width:1,height:1,overflow:'hidden'});
 act(()=>{node.props.onChange(0);node.props.onChange(1);});
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1);
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(31);
});

it('caller-rendered title supplies the open focus target without a duplicate hidden title',()=>{
 const titleRef=React.createRef();
 const children=React.createElement(View,null,React.createElement(Heading,{ref:titleRef},'Account'),React.createElement(ScrollView,null));
 const node=mount({titleRef},children);
 expect(root.root.findAllByType(Text).filter(n=>n.props.accessibilityRole==='header')).toHaveLength(1);
 expect(root.root.findAllByType(Text).find(n=>n.props.accessibilityRole==='header').props.accessibilityLabel).toBeUndefined();
 act(()=>node.props.onChange(0));
 expect(native.findNodeHandle).toHaveBeenCalledWith(titleRef.current);
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(31);
 expect(node.props.accessibilityLabel).toBe('Account');
});

it('changes detent geometry without closing, re-presenting or moving accessibility focus again',()=>{
 const change=jest.fn();let node=mount({onOpenChange:change});
 act(()=>node.props.onChange(1));
 node=update({onOpenChange:change,snapPoints:['45%','95%']});
 expect(node.props.snapPoints).toEqual(['45%','95%']);
 expect(node.props.index).toBe(1);
 act(()=>node.props.onChange(1));
 expect(backend.methods.present).toHaveBeenCalledTimes(1);
 expect(backend.methods.dismiss).not.toHaveBeenCalled();
 expect(change).not.toHaveBeenCalled();
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1);
});

it('clamps a removed current detent after geometry updates and preserves it when detents grow again',()=>{
 const change=jest.fn();let node=mount({onOpenChange:change,initialIndex:1});
 act(()=>node.props.onChange(1));
 node=update({onOpenChange:change,initialIndex:1,snapPoints:['55%']});
 expect(node.props.index).toBe(0);
 expect(backend.methods.snapToIndex).not.toHaveBeenCalled();
 update({onOpenChange:change,initialIndex:1,snapPoints:['60%','85%','95%']});
 flushFrames();
 expect(backend.methods.snapToIndex).toHaveBeenCalledTimes(1);
 expect(backend.methods.snapToIndex).toHaveBeenCalledWith(0);
 expect(modal().props.index).toBe(0);
 expect(change).not.toHaveBeenCalled();
 expect(backend.methods.present).toHaveBeenCalledTimes(1);
});

it('equivalent detent arrays retain a pending clamp, which closing cancels',()=>{
 let node=mount();act(()=>node.props.onChange(1));
 update({snapPoints:['55%']});
 update({snapPoints:['55%']});
 expect(frames.size).toBe(1);
 flushFrames();expect(backend.methods.snapToIndex).toHaveBeenCalledWith(0);
 node=update({snapPoints:['40%','85%']});act(()=>node.props.onChange(1));
 update({snapPoints:['60%']});expect(frames.size).toBe(1);
 update({open:false,snapPoints:['60%']});
 expect(frames.size).toBe(0);
 expect(backend.methods.dismiss).toHaveBeenCalledTimes(1);
 flushFrames();expect(backend.methods.snapToIndex).toHaveBeenCalledTimes(1);
});

it('custom mode retains reduced motion, backdrop policy, Android Back and focus return',()=>{
 let back;const remove=jest.fn();
 jest.spyOn(BackHandler,'addEventListener').mockImplementation((name,callback)=>{back=callback;return {remove};});
 const change=jest.fn(),returnFocusRef={current:{_nativeTag:77}};
 let node=mount({onOpenChange:change,returnFocusRef,dismissible:false});
 expect(node.props.overrideReduceMotion).toBe('always');
 expect(node.props.enablePanDownToClose).toBe(false);
 expect(node.props.backdropComponent({}).props.pressBehavior).toBe('none');
 act(()=>expect(back()).toBe(true));expect(change).not.toHaveBeenCalled();
 node=update({onOpenChange:change,returnFocusRef});
 expect(node.props.backdropComponent({}).props.pressBehavior).toBe('close');
 act(()=>expect(back()).toBe(true));expect(change).toHaveBeenCalledTimes(1);
 node=update({open:false,onOpenChange:change,returnFocusRef});
 act(()=>node.props.onDismiss());flushFrames();
 expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenLastCalledWith(77);
 expect(change).toHaveBeenCalledTimes(1);
 expect(remove).toHaveBeenCalledTimes(2);
});

it('rejected custom-mode dismissals re-present once the host state settles',()=>{
 const change=jest.fn(),node=mount({onOpenChange:change});
 act(()=>{node.props.onChange(-1);node.props.onDismiss();node.props.onDismiss();});
 expect(change).toHaveBeenCalledTimes(1);
 expect(frames.size).toBe(1);
 flushFrames();expect(backend.methods.present).toHaveBeenCalledTimes(2);
 act(()=>node.props.onChange(0));expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(31);
});

it('preserves host card geometry, measured handles, backgrounds and imperative motion access',()=>{
 const modalRef=React.createRef(),Handle=()=>React.createElement(View),Background=()=>React.createElement(View);
 const Backdrop=()=>React.createElement(View),animationConfigs={duration:320};
 let node=mount({modalRef,topInset:0,bottomInset:0,animateOnMount:false,animationConfigs,backdropComponent:Backdrop,handleComponent:Handle,handleStyle:{paddingTop:12,paddingBottom:8},handleIndicatorStyle:{height:6,width:100},backgroundComponent:Background,backgroundStyle:{borderTopLeftRadius:55}});
 expect(node.props.topInset).toBe(0);expect(node.props.bottomInset).toBe(0);
 expect(node.props.animateOnMount).toBe(false);expect(node.props.animationConfigs).toBe(animationConfigs);expect(node.props.backdropComponent).toBe(Backdrop);expect(node.props.overrideReduceMotion).toBe('always');
 expect(node.props.handleComponent).toBe(Handle);expect(node.props.backgroundComponent).toBe(Background);
 expect(StyleSheet.flatten(node.props.backgroundStyle)).toMatchObject({borderTopLeftRadius:55,borderRadius:require('@bloxwap/hig-tokens').nativeMetrics.radius.xl});
 expect(StyleSheet.flatten(node.props.backgroundStyle).backgroundColor).toBe(require('@bloxwap/hig-tokens').nativeSrgb.surface);
 expect(StyleSheet.flatten(node.props.handleStyle)).toEqual({paddingTop:12,paddingBottom:8});
 expect(StyleSheet.flatten(node.props.handleIndicatorStyle)).toMatchObject({height:6,width:100});
 expect(modalRef.current).toBe(backend.methods);
 act(()=>modalRef.current.snapToIndex(1));expect(backend.methods.snapToIndex).toHaveBeenCalledWith(1);
 node=update({modalRef,handleComponent:null,backdropComponent:null});expect(node.props.handleComponent).toBeNull();expect(node.props.backdropComponent).toBeNull();
 act(()=>root.unmount());root=null;expect(modalRef.current).toBeNull();
});

it('defers nested Android Back to the host and preserves the default close policy when omitted',()=>{
 let back;jest.spyOn(BackHandler,'addEventListener').mockImplementation((_,callback)=>{back=callback;return {remove:jest.fn()};});
 const change=jest.fn(),defer=jest.fn(()=>false),consume=jest.fn(()=>true);
 mount({onOpenChange:change,onHardwareBackPress:defer});
 act(()=>expect(back()).toBe(false));expect(defer).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();
 update({onOpenChange:change,onHardwareBackPress:consume});
 act(()=>expect(back()).toBe(true));expect(consume).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();
 update({onOpenChange:change});act(()=>expect(back()).toBe(true));expect(change).toHaveBeenCalledWith(false);
});

it('clears retained host card state once after an accepted dismissal, skipping rejected and interrupted closes',()=>{
 const change=jest.fn(),closed=jest.fn();let node=mount({onOpenChange:change,onDismiss:closed});
 act(()=>node.props.onDismiss());flushFrames();expect(closed).not.toHaveBeenCalled();
 node=update({open:false,onOpenChange:change,onDismiss:closed});act(()=>node.props.onDismiss());
 expect(closed).not.toHaveBeenCalled();flushFrames();expect(closed).toHaveBeenCalledTimes(1);
 act(()=>node.props.onDismiss());flushFrames();expect(closed).toHaveBeenCalledTimes(1);
 node=update({open:true,onOpenChange:change,onDismiss:closed});
 node=update({open:false,onOpenChange:change,onDismiss:closed});act(()=>node.props.onDismiss());
 update({open:true,onOpenChange:change,onDismiss:closed});flushFrames();expect(closed).toHaveBeenCalledTimes(1);
 node=update({open:false,onOpenChange:change,onDismiss:closed});act(()=>node.props.onDismiss());flushFrames();
 expect(closed).toHaveBeenCalledTimes(2);
});
