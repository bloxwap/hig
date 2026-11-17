// Design review pass: no resting strokes, fills that step up inside a card or panel, 44dp controls, and motion that reduced motion turns off.
const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const {View,Text:RNText,TextInput,Animated,StyleSheet,ScrollView,ActivityIndicator}=RN;
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Surface,Separator}=require('../../packages/hig/native/src/surface');
const {Input,SearchInput}=require('../../packages/hig/native/src/field');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {Dialog}=require('../../packages/hig/native/src/overlay');
const {Tabs,Accordion}=require('../../packages/hig/native/src/navigation');
const {Badge,Toast,Skeleton,EmptyState,Avatar,StatusIndicator}=require('../../packages/hig/native/src/status');
const {Button}=require('../../packages/hig/native/src/button');
const h=React.createElement;
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style);
let root;
function mount(node){if(root)act(()=>root.unmount());act(()=>{root=create(node);});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
/** First host node in the rendered JSON that matches; children there are the real on-screen order. */
function json(node,match){if(!node||typeof node==='string')return null;if(Array.isArray(node)){for(const child of node){const hit=json(child,match);if(hit)return hit;}return null;}if(match(node))return node;return json(node.children??[],match);}
const jsonStyle=node=>StyleSheet.flatten(node.props.style);

it('Surface and Separator: a filled card with no stroke, and a 2dp rounded rule',()=>{
 const surface=flat(mount(h(Surface,null,h(RNText,null,'Card'))).findByType(View));
 expect(surface).toMatchObject({backgroundColor:colors.surface});expect(surface.borderWidth).toBeUndefined();expect(surface.borderColor).toBeUndefined();
 expect(flat(mount(h(Separator)).findByType(View))).toMatchObject({height:2,borderRadius:9999,backgroundColor:colors.nested});
});
it('SearchInput insets a decorative magnifying glass on the leading edge and pads the text past it, following direction',()=>{
 const ref=React.createRef();const tree=mount(h(HIGProvider,{direction:'rtl'},h(SearchInput,{ref,value:'btc',onChangeText:jest.fn()})));
 const input=tree.findByType(TextInput);expect(flat(input)).toMatchObject({paddingStart:46,borderColor:'transparent',backgroundColor:colors.surface});expect(input.props.returnKeyType).toBe('search');expect(ref.current).toBeTruthy();
 const wrapper=input.parent.parent.parent;expect(flat(wrapper)).toMatchObject({direction:'rtl'});
 const icon=tree.findAll(n=>n.type===View&&n.props.pointerEvents==='none'&&flat(n)?.position==='absolute')[0];expect(flat(icon)).toMatchObject({start:18});
 expect(tree.findAll(n=>n.props.importantForAccessibility==='no-hide-descendants'&&n.props.accessible===false).length).toBeGreaterThan(0);
});
it('SearchInput is button height, 44dp, while other inputs keep 48dp',()=>{
 const {StyleSheet,TextInput}=require('react-native');
 const search=mount(h(HIGProvider,null,h(SearchInput,{value:'',onChangeText:jest.fn()})));
 expect(StyleSheet.flatten(search.findByType(TextInput).props.style)).toMatchObject({minHeight:44,paddingVertical:10});
 const plain=mount(h(HIGProvider,null,h(Input,{value:'',onChangeText:jest.fn()})));
 expect(StyleSheet.flatten(plain.findByType(TextInput).props.style).minHeight).toBe(48);
});
it('SegmentedControl: dark well with a lighter selected segment, stepping up inside a Surface; 44dp tall, 36 compact',()=>{
 const control=h(SegmentedControl,{label:'Side',options:[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}],value:'buy'});
 const fills=tree=>{const track=tree.findAll(n=>n.type===View&&flat(n)?.padding===4&&flat(n).borderRadius===9999)[0];act(()=>track.findAll(n=>n.props.onLayout)[0].props.onLayout({nativeEvent:{layout:{width:200}}}));return [flat(track).backgroundColor,flat(tree.findByType(Animated.View)).backgroundColor];};
 expect(fills(mount(control))).toEqual([colors.surface,colors.nested]);
 expect(fills(mount(h(Surface,null,control)))).toEqual([colors.nested,colors.border]);
 const height=density=>{const radio=mount(h(HIGProvider,{density},control)).findAll(n=>n.props.accessibilityRole==='radio')[0];return flat(radio).minHeight+8;};
 expect(height('comfortable')).toBe(44);expect(height('compact')).toBe(36);
});
it('Dialog panel is the darker overlay fill with no stroke, and its fields use the raised well',()=>{
 const tree=mount(h(Dialog,{open:true,onOpenChange:jest.fn(),title:'Review'},h(Input),h(Badge,null,'Demo')));
 const panel=StyleSheet.flatten(tree.findByType(ScrollView).props.contentContainerStyle);
 expect(panel.backgroundColor).toBe(colors.overlay);expect(panel.borderWidth).toBeUndefined();expect(panel.boxShadow).toBeTruthy();
 expect(flat(tree.findByType(TextInput)).backgroundColor).toBe(colors.nested);
 expect(flat(tree.findAllByType(RNText).find(n=>n.props.children==='Demo')).backgroundColor).toBe(colors.nested);
});
it('Tabs are 44dp tall with a 48dp touch target',()=>{
 const tab=mount(h(Tabs,{label:'Modes',items:[{value:'a',label:'A',content:null}]})).findAll(n=>n.props.accessibilityRole==='tab'&&n.props.hitSlop)[0];
 expect(flat(tab)).toMatchObject({minHeight:44});expect(tab.props.hitSlop).toEqual({top:2,bottom:2});
});
it('Accordion is a strokeless card whose trailing chevron and content animate; reduced motion switches at once',()=>{
 const timing=jest.spyOn(Animated,'timing').mockImplementation((value,config)=>({start:jest.fn(done=>{value.setValue(config.toValue);done?.({finished:true});}),stop:jest.fn()}));
 try{
  const event={stopPropagation(){},isDefaultPrevented:()=>false};const header=tree=>tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0];
  const tree=mount(h(Accordion,{title:'Advanced'},h(RNText,null,'Body')));
  const card=flat(tree.findAllByType(View)[0]);expect(card.backgroundColor).toBe(colors.surface);expect(card.borderWidth).toBeUndefined();
  expect(header(tree).props.accessibilityState).toEqual({expanded:false});expect(tree.findAllByType(RNText).map(n=>n.props.children)).toEqual(['Advanced']);
  const row=header(tree);expect(flat(row)).toMatchObject({flexDirection:'row',justifyContent:'space-between'});
  const chevron=row.findByType(Animated.View);
  // The title comes first and the chevron last, so it sits on the trailing edge in either direction.
  const kids=json(root.toJSON(),n=>n.props.accessibilityRole==='button').children;expect(kids[0].children).toEqual(['Advanced']);expect(kids[kids.length-1].props.style.transform).toBeTruthy();
  expect(flat(chevron).transform[0].rotate.__getValue()).toBe('0deg');
  act(()=>header(tree).props.onPress(event));
  expect(timing).toHaveBeenCalledTimes(1);expect(timing.mock.calls[0][1]).toMatchObject({toValue:1,duration:260,useNativeDriver:false});
  expect(header(tree).props.accessibilityState).toEqual({expanded:true});expect(tree.findAllByType(RNText).map(n=>n.props.children)).toEqual(['Advanced','Body']);
  expect(flat(header(tree).findByType(Animated.View)).transform[0].rotate.__getValue()).toBe('180deg');
  act(()=>header(tree).props.onPress(event));expect(timing.mock.calls[1][1]).toMatchObject({toValue:0});expect(tree.findAllByType(RNText).map(n=>n.props.children)).toEqual(['Advanced']);
  timing.mockClear();const reduced=mount(h(HIGProvider,{reducedMotion:true},h(Accordion,{title:'Advanced'},h(RNText,null,'Body'))));
  act(()=>header(reduced).props.onPress(event));expect(timing).not.toHaveBeenCalled();expect(reduced.findAllByType(RNText).map(n=>n.props.children)).toEqual(['Advanced','Body']);
 }finally{timing.mockRestore();}
});
it('Toast notices are one-row capsules: severity symbol, message, action, then an x close control; no stroke or visible dismiss text',()=>{
 const dismissed=jest.fn();const retry=h(Button,{onPress:jest.fn()},'Retry');
 const tree=mount(h(Toast,{notices:[{id:'1',message:'Order failed',severity:'error',action:retry}],onDismiss:dismissed}));
 const capsule=json(root.toJSON(),n=>jsonStyle(n)?.backgroundColor===colors.nested);
 expect(jsonStyle(capsule)).toMatchObject({flexDirection:'row',alignItems:'center',minHeight:44,borderRadius:22});expect(jsonStyle(capsule).borderWidth).toBeUndefined();
 const parts=capsule.children;expect(parts).toHaveLength(4);
 expect(json(parts[0],n=>n.type==='ExpoImage').props.tintColor).toBe(colors.negative);
 expect(jsonStyle(parts[1])).toMatchObject({flex:1});expect(json(parts[1],n=>n.type==='Text').children).toEqual(['Order failed']);
 expect(json(parts[2],n=>n.type==='Text').children).toEqual(['Retry']);
 expect(parts[3].props.accessibilityLabel).toBe('Dismiss Order failed');expect(json(parts[3].children,n=>n.type==='Text')).toBeNull();
 const close=tree.findAllByType(Button).find(n=>n.props.accessibilityLabel==='Dismiss Order failed');
 act(()=>close.props.onPress());expect(dismissed).toHaveBeenCalledWith('1');
 expect(tree.findAllByType(RNText).map(n=>n.props.children)).toEqual(['Order failed','Retry']);
});
it('Skeleton pulses and StatusIndicator rings for online and stale; offline and reduced motion stay still',()=>{
 const loops=()=>global.__loops.length;
 const skeleton=mount(h(Skeleton));expect(loops()).toBe(1);expect(global.__loops[0].start).toHaveBeenCalledTimes(1);
 expect(flat(skeleton.findByType(Animated.View)).opacity.__getValue()).toBe(1);
 mount(h(HIGProvider,{reducedMotion:true},h(Skeleton)));expect(global.__loops[0].stop).toHaveBeenCalled();expect(loops()).toBe(1);
 const ring=(state,reducedMotion)=>{const tree=mount(h(HIGProvider,{reducedMotion},h(StatusIndicator,{label:'Feed',state})));const dot=tree.findAll(n=>n.type===View&&flat(n)?.width===7&&flat(n).borderRadius===4)[0];return {color:flat(dot).backgroundColor,rings:tree.findAllByType(Animated.View).length,text:tree.findByType(RNText).props.children.join('')};};
 expect(ring('online')).toEqual({color:colors.positive,rings:1,text:'Feed: online'});expect(ring('stale')).toMatchObject({color:colors.warning,rings:1});
 expect(ring('offline')).toMatchObject({color:colors.muted,rings:0});expect(ring('online',true)).toMatchObject({rings:0});
});
it('EmptyState centres a default icon, title, optional description and action without a stroke; Avatar initials sit on the well fill',()=>{
 const tree=mount(h(EmptyState,{title:'No positions',action:h(Button,{onPress:jest.fn()},'Refresh')}));
 const card=flat(tree.findAllByType(View)[0]);expect(card).toMatchObject({alignItems:'center',backgroundColor:colors.surface});expect(card.borderWidth).toBeUndefined();
 const icon=tree.findAll(n=>n.props.importantForAccessibility==='no-hide-descendants'&&n.props.accessible===false)[0];expect(icon).toBeTruthy();
 expect(flat(tree.findAllByType(RNText).find(n=>n.props.children==='No positions'))).toMatchObject({textAlign:'center'});
 expect(tree.findAllByType(RNText).map(n=>n.props.children)).toEqual(['No positions','Refresh']);
 const custom=mount(h(EmptyState,{title:'None',illustration:h(View,{testID:'mark'})}));expect(custom.findAll(n=>n.props.testID==='mark').length).toBeGreaterThan(0);
 expect(mount(h(EmptyState,{title:'None',illustration:null})).findAll(n=>n.props.importantForAccessibility==='no-hide-descendants')).toHaveLength(0);
 const avatar=tree=>tree.findAll(n=>n.props.accessibilityRole==='image')[0];
 const page=avatar(mount(h(Avatar,{name:'Demo account'})));expect(flat(page)).toMatchObject({width:40,height:40,borderRadius:20,backgroundColor:colors.surface});expect(page.props.accessibilityLabel).toBe('Demo account');
 expect(flat(avatar(mount(h(Surface,null,h(Avatar,{name:'Demo account'}))))).backgroundColor).toBe(colors.nested);
});
it('thin tracks and rules sit one step above the wells of their container',()=>{
 const {Switch}=require('../../packages/hig/native/src/switch');const {Progress}=require('../../packages/hig/native/src/status');
 const track=tree=>tree.findByType(RN.Switch).props.trackColor.false,rule=tree=>flat(tree.findAll(n=>n.type===View&&flat(n)?.height===2)[0]).backgroundColor,bar=tree=>flat(tree.findAll(n=>n.type===View&&flat(n)?.height===6)[0]).backgroundColor;
 expect(track(mount(h(Switch,{label:'Sound'})))).toBe(colors.nested);expect(track(mount(h(Surface,null,h(Switch,{label:'Sound'}))))).toBe(colors.border);
 expect(rule(mount(h(Surface,null,h(Separator))))).toBe(colors.border);
 expect(bar(mount(h(Progress,{label:'Sync',value:40})))).toBe(colors.nested);expect(bar(mount(h(Surface,null,h(Progress,{label:'Sync',value:40}))))).toBe(colors.border);
 expect(flat(mount(h(Skeleton)).findAll(n=>flat(n)?.minHeight===48)[0]).backgroundColor).toBe(colors.nested);
});
it('an unavailable button is a neutral well with muted text; busy keeps its intent colour',()=>{
 const button=tree=>tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.style==='function')[0],label=tree=>StyleSheet.flatten(tree.findAllByType(RNText).at(-1).props.style).color;
 for(const intent of ['primary','secondary','destructive']){const tree=mount(h(Button,{intent,disabled:true},'Go'));expect(flat(button(tree))).toMatchObject({backgroundColor:colors.surface,opacity:1});expect(label(tree)).toBe(colors.muted);}
 const inCard=mount(h(Surface,null,h(Button,{disabled:true},'Go')));expect(flat(button(inCard)).backgroundColor).toBe(colors.nested);
 const ghost=mount(h(Button,{intent:'ghost',disabled:true},'Go'));expect(flat(button(ghost)).backgroundColor).toBe('transparent');expect(label(ghost)).toBe(colors.faint);
 const busy=mount(h(Button,{busy:true},'Go'));expect(flat(button(busy))).toMatchObject({backgroundColor:colors.action,opacity:0.7});expect(label(busy)).toBe(colors.onAction);
});
it('the selected tab is a raised neutral capsule and the others are bare muted labels',()=>{
 const tabs=tree=>tree.findAll(n=>n.props.accessibilityRole==='tab'&&typeof n.props.style==='function'),label=tab=>StyleSheet.flatten(tab.findAllByType(RNText).at(-1).props.style).color;
 const items=[{value:'a',label:'A',content:null},{value:'b',label:'B',content:null}];
 const [on,off]=tabs(mount(h(Tabs,{label:'Modes',items})));
 expect(flat(on).backgroundColor).toBe(colors.nested);expect(label(on)).toBe(colors.text);expect(flat(off).backgroundColor).toBe('transparent');expect(label(off)).toBe(colors.muted);
 expect(flat(tabs(mount(h(Surface,null,h(Tabs,{label:'Modes',items}))))[0]).backgroundColor).toBe(colors.border);
});
