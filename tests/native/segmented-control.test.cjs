const React=require('react');
const {create,act}=require('react-test-renderer');
const {Animated,StyleSheet,Text:RNText}=require('react-native');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
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

it('passes segmentProps to every segment, such as Android sound off for a host that plays its own, and keeps its own press',()=>{
 const changed=jest.fn();mount({value:'all',onValueChange:changed,segmentProps:{android_disableSound:true,onPress:()=>{throw new Error('host press must not replace HIG’s');}}});
 expect(radios().map(node=>node.props.android_disableSound)).toEqual([true,true,true]);
 act(()=>radios()[1].props.onPress());expect(changed).toHaveBeenCalledWith('open');
});

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
 // 36dp segments in a 44dp track; the slop restores the 48dp touch target.
 expect(StyleSheet.flatten(trend.props.style).minHeight).toBe(36);expect(trend.props.hitSlop).toEqual({top:6,bottom:6});
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

it('reaches a 48dp touch target at either density, with vertical slop only so segments 4 apart never overlap',()=>{
 for(const density of ['comfortable','compact']){
  mount({defaultValue:'all'},{density});
  for(const radio of radios()){
   const {minHeight}=StyleSheet.flatten(radio.props.style),slop=radio.props.hitSlop;
   expect([density,minHeight+slop.top+slop.bottom]).toEqual([density,48]);expect(slop.left).toBeUndefined();expect(slop.right).toBeUndefined();
  }
  act(()=>root.unmount());root=null;
 }
});

it('takes a group testID, gives each segment <testID>-<value>, and lets an option set its own test ID',()=>{
 mount({testID:'mode',options:[{value:'all',label:'All'},{value:'open',label:'Open',testID:'mode-open-custom'},{value:'trend',label:'Trend'}]});
 expect(root.root.findAll(node=>node.props.testID==='mode'&&typeof node.type==='string')).toHaveLength(1);
 expect(radios().map(node=>node.props.testID)).toEqual(['mode-all','mode-open-custom','mode-trend']);
 act(()=>root.unmount());
 // Without a group testID only the option that sets one has a test ID.
 mount({options:[{value:'all',label:'All'},{value:'open',label:'Open',testID:'open-only'}]});
 expect(radios().map(node=>node.props.testID)).toEqual([undefined,'open-only']);
});

it('scrolls choices at their minimum width inside a narrow host',()=>{
 const {ScrollView}=require('react-native');
 mount({defaultValue:'all'},{density:'compact',reducedMotion:true});layout(92);
 expect(root.root.findByType(ScrollView).props.horizontal).toBe(true);
 expect(radios().map(radio=>StyleSheet.flatten(radio.props.style).minWidth)).toEqual([44,44,44]);
 act(()=>radios()[2].props.onPress());
 expect(style().width).toBe(44);
 expect(style().transform[0].translateX.__getValue()).toBe(96);
 layout(308);
 expect(root.root.findAllByType(ScrollView)).toHaveLength(0);
 expect(style().width).toBe(100);
 expect(radios()[2].props.accessibilityState.checked).toBe(true);
});

it('resizes the indicator without rereading segment options',()=>{
 const read=jest.fn(i=>String(i));
 const choices=Array.from({length:50},(_,i)=>({get value(){return read(i);},label:String(i)}));
 mount({options:choices,value:'49'});
 layout(3000);
 read.mockClear();
 layout(3500);
 expect(read).not.toHaveBeenCalled();
 expect(style().width).toBe((3500-49*4)/50);
 expect(radios()[49].props.accessibilityState.checked).toBe(true);
});
