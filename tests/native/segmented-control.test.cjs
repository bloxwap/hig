const React=require('react');
const {create,act}=require('react-test-renderer');
const {Animated,StyleSheet,Text:RNText}=require('react-native');
const {SegmentedControl}=require('../../packages/native/src/radio-group');
const {HIGProvider}=require('../../packages/native/src/provider');
const h=React.createElement;
const options=[{value:'all',label:'All'},{value:'open',label:'Open'},{value:'trend',label:'Trend',description:'Recent direction',lang:'en-US'}];
let root,timing,animations;
const example=(props={},environment={})=>h(HIGProvider,environment,h(SegmentedControl,{label:'Markets',options,...props}));
const radios=()=>root.root.findAll(node=>node.props.accessibilityRole==='radio'&&typeof node.props.onPress==='function');
const indicator=()=>root.root.findByType(Animated.View);
const style=()=>StyleSheet.flatten(indicator().props.style);
function layout(width){act(()=>root.root.findAll(node=>typeof node.props.onLayout==='function')[0].props.onLayout({nativeEvent:{layout:{width,height:48}}}));}
function mount(props,environment){act(()=>{root=create(example(props,environment));});layout(308);}
beforeEach(()=>{
 animations=[];timing=jest.spyOn(Animated,'timing').mockImplementation((value,config)=>{
  const animation={start:jest.fn(),stop:jest.fn(),reset:jest.fn()};animations.push({value,config,...animation});return animation;
 });
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;timing.mockRestore();});

it('places the initial pill without motion and animates only accepted controlled selections',()=>{
 const changed=jest.fn();mount({value:'open',onValueChange:changed});
 expect(style().width).toBe(100);expect(style().transform[0].translateX.__getValue()).toBe(104);expect(timing).not.toHaveBeenCalled();
 act(()=>radios()[2].props.onPress());expect(changed).toHaveBeenCalledWith('trend');expect(timing).not.toHaveBeenCalled();expect(radios()[1].props.accessibilityState.checked).toBe(true);
 act(()=>root.update(example({value:'trend',onValueChange:changed})));
 expect(animations[0].config).toMatchObject({toValue:208,duration:260,useNativeDriver:true,isInteraction:false});expect(animations[0].start).toHaveBeenCalledTimes(1);
 expect(radios()[2].props.accessibilityState.checked).toBe(true);
 // A second selection stops the old animation without resetting its position.
 act(()=>animations[0].value.setValue(156));
 act(()=>root.update(example({value:'all',onValueChange:changed})));
 expect(animations[0].stop).toHaveBeenCalledTimes(1);expect(animations[1].config.toValue).toBe(0);expect(animations[1].value.__getValue()).toBe(156);
 act(()=>root.unmount());root=null;expect(animations[1].stop).toHaveBeenCalledTimes(1);
});

it('snaps on reduced motion, resize and RTL changes and hides absent selections',()=>{
 mount({value:'all'});act(()=>root.update(example({value:'trend'})));
 act(()=>root.update(example({value:'trend'},{reducedMotion:true})));
 expect(animations[0].stop).toHaveBeenCalledTimes(1);expect(style().transform[0].translateX.__getValue()).toBe(208);
 act(()=>root.update(example({value:'open'},{reducedMotion:true,direction:'rtl'})));
 expect(style().transform[0].translateX.__getValue()).toBe(-104);expect(style().start).toBe(0);
 layout(608);expect(style().width).toBe(200);expect(style().transform[0].translateX.__getValue()).toBe(-204);expect(timing).toHaveBeenCalledTimes(1);
 act(()=>root.update(example({value:'missing'})));expect(root.root.findAllByType(Animated.View)).toHaveLength(0);
 act(()=>root.update(example({value:'open'})));expect(style().transform[0].translateX.__getValue()).toBe(204);expect(timing).toHaveBeenCalledTimes(1);
 act(()=>root.update(example({value:'open',options:options.slice(0,2)})));expect(style().width).toBe(302);expect(style().transform[0].translateX.__getValue()).toBe(306);
 act(()=>root.update(example({options:[]})));expect(root.root.findAllByType(Animated.View)).toHaveLength(0);
});

it('keeps touch and accessibility activation, option languages and feedback on the accepted value',()=>{
 const changed=jest.fn(),emit=jest.fn();mount({defaultValue:'all',onValueChange:changed},{feedback:{emit}});
 const trend=radios()[2];expect(trend.props).toMatchObject({accessibilityRole:'radio',accessibilityLabel:'Trend',accessibilityHint:'Recent direction',accessibilityLanguage:'en-US',accessibilityActions:[{name:'activate'}]});
 expect(StyleSheet.flatten(trend.props.style).minHeight).toBe(48);
 expect(trend.findAllByType(RNText).find(node=>node.props.children==='Recent direction').props.accessibilityLanguage).toBe('en-US');
 expect(indicator().props).toMatchObject({pointerEvents:'none',accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants'});
 act(()=>trend.props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 expect(changed).toHaveBeenCalledTimes(1);expect(changed).toHaveBeenCalledWith('trend');expect(emit).toHaveBeenCalledTimes(1);expect(radios()[2].props['aria-checked']).toBe(true);
 act(()=>radios()[2].props.onPress());act(()=>radios()[0].props.onAccessibilityAction({nativeEvent:{actionName:'longpress'}}));
 expect(changed).toHaveBeenCalledTimes(1);expect(timing).toHaveBeenCalledTimes(1);
});

it.each([true,false])('rejects disabled touch and accessibility callbacks (whole group: %s)',disabled=>{
 const changed=jest.fn();mount({defaultValue:'all',disabled,options:options.map(option=>({...option,disabled:!disabled})),onValueChange:changed});
 for(const radio of radios()){
  expect(radio.props.accessibilityState.disabled).toBe(true);
  act(()=>radio.props.onPress());act(()=>radio.props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 }
 expect(changed).not.toHaveBeenCalled();expect(timing).not.toHaveBeenCalled();expect(style().opacity).toBe(0.5);
});
