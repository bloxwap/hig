// Filter: a horizontal row of single-choice chips. The selected chip inverts and its circle shows a check that animates in.
const React=require('react');
const {create,act}=require('react-test-renderer');
const {StyleSheet,Animated,Image,ScrollView}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Filter}=require('../../packages/hig/native/src/selection');
const {Surface}=require('../../packages/hig/native/src/surface');
const h=React.createElement;
const options=[{value:'',label:'All'},{value:'1',label:'Ethereum',icon:'https://example.test/eth.png'},{value:'8453',label:'Base'},{value:'10',label:'Optimism',disabled:true}];
let root;
function mount(props,provider={}){act(()=>{root=create(h(HIGProvider,provider,h(Filter,{label:'Chains',options,...props})));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
const chips=tree=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function');
const chip=(tree,label)=>chips(tree).find(n=>n.props.accessibilityLabel===label);
const flat=(target,pressed=false)=>StyleSheet.flatten(typeof target.props.style==='function'?target.props.style({pressed}):target.props.style);
const labelColor=target=>StyleSheet.flatten(target.findAll(n=>n.type==='Text')[0].props.style).color;
const press=target=>act(()=>{target.props.onPress({});});
// This renderer cannot attach the native driver, so every test keeps Animated.timing inert, lets it land on its target, and asserts on the requests.
let requests;
beforeEach(()=>{requests=[];jest.spyOn(Animated,'timing').mockImplementation((value,config)=>{const animation={start:jest.fn(()=>value.setValue(config.toValue)),stop:jest.fn()};requests.push({config,animation});return animation;});});

it('is a named radiogroup that scrolls horizontally, with one radio per option named by its label',()=>{
 const tree=mount({});
 const group=tree.findByType(ScrollView);
 expect(group.props).toMatchObject({horizontal:true,showsHorizontalScrollIndicator:false,accessibilityRole:'radiogroup',accessibilityLabel:'Chains'});
 expect(StyleSheet.flatten(group.props.contentContainerStyle)).toMatchObject({gap:8,direction:'ltr'});
 expect(chips(tree).map(n=>n.props.accessibilityLabel)).toEqual(['All','Ethereum','Base','Optimism']);
 // The empty default value selects the option whose value is empty.
 expect(chips(tree).map(n=>n.props.accessibilityState.checked)).toEqual([true,false,false,false]);
 expect(chip(tree,'Optimism').props.accessibilityState).toEqual({checked:false,disabled:true});
 expect(flat(chip(tree,'Base'))).toMatchObject({minHeight:40,borderRadius:9999,paddingVertical:6,paddingStart:8,paddingEnd:16,gap:8});
 expect(chip(tree,'Base').props.hitSlop).toEqual({top:2,bottom:2});
});
it('follows the provider direction',()=>{
 const tree=mount({},{direction:'rtl'});
 expect(StyleSheet.flatten(tree.findByType(ScrollView).props.contentContainerStyle).direction).toBe('rtl');
});
it('selects uncontrolled, reports the value, and ignores a press on the selected or a disabled chip',()=>{
 const changed=jest.fn();const tree=mount({onValueChange:changed,defaultValue:'1'});
 expect(chip(tree,'Ethereum').props.accessibilityState.checked).toBe(true);
 press(chip(tree,'Base'));expect(changed).toHaveBeenLastCalledWith('8453');expect(chip(tree,'Base').props.accessibilityState.checked).toBe(true);expect(chip(tree,'Ethereum').props.accessibilityState.checked).toBe(false);
 press(chip(tree,'Base'));press(chip(tree,'Optimism'));expect(changed).toHaveBeenCalledTimes(1);
 act(()=>chip(tree,'All').props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));expect(changed).toHaveBeenLastCalledWith('');
});
it('stays on the controlled value until the host changes it, and a disabled group blocks every chip',()=>{
 const changed=jest.fn();const tree=mount({value:'1',onValueChange:changed});
 press(chip(tree,'Base'));expect(changed).toHaveBeenCalledWith('8453');expect(chip(tree,'Ethereum').props.accessibilityState.checked).toBe(true);
 act(()=>root.update(h(HIGProvider,{},h(Filter,{label:'Chains',options,value:'8453',onValueChange:changed}))));
 expect(chip(tree,'Base').props.accessibilityState.checked).toBe(true);
 act(()=>root.update(h(HIGProvider,{},h(Filter,{label:'Chains',options,value:'8453',disabled:true,onValueChange:changed}))));
 press(chip(tree,'All'));expect(changed).toHaveBeenCalledTimes(1);expect(chips(tree).every(n=>n.props.accessibilityState.disabled&&flat(n).opacity===0.5)).toBe(true);
});
it('inverts the selected chip and steps the unselected fill up inside a surface',()=>{
 const tree=mount({defaultValue:'8453'});
 expect(flat(chip(tree,'Base')).backgroundColor).toBe(colors.text);expect(labelColor(chip(tree,'Base'))).toBe(colors.background);
 expect(flat(chip(tree,'All')).backgroundColor).toBe(colors.surface);expect(labelColor(chip(tree,'All'))).toBe(colors.text);
 expect(flat(chip(tree,'All'),true).backgroundColor).toBe(colors.nested);
 act(()=>root.unmount());act(()=>{root=create(h(HIGProvider,{},h(Surface,{},h(Filter,{label:'Chains',options}))));});
 expect(flat(chip(root.root,'Base')).backgroundColor).toBe(colors.nested);
});
it('shows the icon or an empty ring in the circle, and fills it with a check when selected',()=>{
 const tree=mount({defaultValue:'8453'});
 const layers=target=>target.findAll(n=>typeof n.type==='string').map(n=>StyleSheet.flatten(n.props.style)??{});
 const image=chip(tree,'Ethereum').findByType(Image);expect(image.props.source).toEqual({uri:'https://example.test/eth.png'});expect(StyleSheet.flatten(image.props.style)).toMatchObject({width:24,height:24,borderRadius:12});
 expect(chip(tree,'Base').findAllByType(Image)).toHaveLength(0);
 // No icon: a 2dp ring in the label colour.
 expect(layers(chip(tree,'All')).some(style=>style.borderWidth===2&&style.borderColor===colors.text&&style.width===24)).toBe(true);
 // Selected: the fill and the check are fully in; unselected: both fully out.
 const fill=target=>target.findAll(n=>{const style=StyleSheet.flatten(n.props.style)??{};return style.backgroundColor===colors.background&&style.width===24&&style.opacity!==undefined;})[0];
 const value=animated=>typeof animated==='number'?animated:animated.__getValue();
 expect(value(StyleSheet.flatten(fill(chip(tree,'Base')).props.style).opacity)).toBe(1);expect(value(StyleSheet.flatten(fill(chip(tree,'All')).props.style).opacity)).toBe(0);
 // The shared check uses the unselected label colour, so it reads on the dark fill.
 expect(chip(tree,'Base').findByType('ExpoImage').props.tintColor).toBe(colors.text);
 // The circle is decorative.
 expect(chip(tree,'Base').findAll(n=>n.props.importantForAccessibility==='no-hide-descendants').length).toBeGreaterThan(0);
});
it('animates the check in on select and out on deselect, and not on first render',()=>{
 const tree=mount({});
 expect(requests).toHaveLength(0);
 press(chip(tree,'Base'));
 expect(requests.map(request=>request.config.toValue).sort()).toEqual([0,1]);
 for(const request of requests){expect(request.config).toMatchObject({duration:220,useNativeDriver:true,isInteraction:false});expect(request.animation.start).toHaveBeenCalledTimes(1);}
 press(chip(tree,'Ethereum'));
 expect(requests.slice(2).map(request=>request.config.toValue).sort()).toEqual([0,1]);
});
it('shows the final state at once under reduced motion',()=>{
 const tree=mount({},{reducedMotion:true});
 press(chip(tree,'Base'));
 expect(requests).toHaveLength(0);expect(chip(tree,'Base').props.accessibilityState.checked).toBe(true);
 const fill=chip(tree,'Base').findAll(n=>{const style=StyleSheet.flatten(n.props.style)??{};return style.backgroundColor===colors.background&&style.width===24&&style.opacity!==undefined;})[0];
 const opacity=StyleSheet.flatten(fill.props.style).opacity;expect(typeof opacity==='number'?opacity:opacity.__getValue()).toBe(1);
});
