const React=require('react');
const {create,act}=require('react-test-renderer');
const {TextInput,Modal}=require('react-native');
const {Button}=require('../../packages/native/src/button');
const {Field,AmountInput}=require('../../packages/native/src/field');
const {Checkbox,RadioGroup}=require('../../packages/native/src/selection');
const {Dialog}=require('../../packages/native/src/overlay');
const {NumberReadout}=require('../../packages/native/src/data');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}
it('native busy button exposes blocked action/progress state',()=>{const tree=mount(React.createElement(Button,{busy:true},'Confirm'));const button=tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0];expect(button.props.disabled).toBe(true);expect(button.props.accessibilityState).toEqual({disabled:true,busy:true});});
it('native checkbox updates state on accepted activation',()=>{const change=jest.fn();const tree=mount(React.createElement(Checkbox,{label:'Sound',onCheckedChange:change}));act(()=>tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0].props.onPress());expect(change).toHaveBeenCalledWith(true);expect(tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0].props.accessibilityState.checked).toBe(true);});
it('native controlled radio ignores repeated current values',()=>{const change=jest.fn();const tree=mount(React.createElement(RadioGroup,{label:'Side',value:'buy',onValueChange:change,options:[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}]}));act(()=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function')[0].props.onPress());expect(change).not.toHaveBeenCalled();act(()=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function')[1].props.onPress());expect(change).toHaveBeenCalledWith('sell');});
it('native amount entry keeps raw decimal string and labeled error hint',()=>{const tree=mount(React.createElement(Field,{label:'Amount',description:'Available: 1 BTC',error:'Precision exceeded'},React.createElement(AmountInput,{value:'0,001'})));const input=tree.findByType(TextInput);expect(input.props.value).toBe('0,001');expect(input.props.accessibilityLabel).toBe('Amount');expect(input.props.accessibilityHint).toContain('Precision exceeded');expect(input.props.keyboardType).toBe('decimal-pad');});
it('native Modal handles Android back without DOM imports',()=>{const close=jest.fn();const tree=mount(React.createElement(Dialog,{open:true,onOpenChange:close,title:'Review',description:'Verify amount'},null));act(()=>tree.findByType(Modal).props.onRequestClose());expect(close).toHaveBeenCalledWith(false);});
it('native unknown financial values stay distinct from zero',()=>{mount(React.createElement(NumberReadout,{value:null}));expect(JSON.stringify(root.toJSON())).toContain('—');});

it('native slider blocks disabled backend changes and exposes adjustment state',()=>{const {Slider}=require('../../packages/native/src/slider');const change=jest.fn();const tree=mount(React.createElement(Slider,{label:'Volume',value:20,disabled:true,onValueChange:change}));const slider=tree.findAll(n=>n.props.accessibilityRole==='adjustable')[0];const backend=tree.findAll(n=>n.props.onValueChange&&n.props.minimumValue===0)[0];expect(slider.props.accessibilityState).toEqual({disabled:true});expect(slider.props.accessibilityValue).toEqual({min:0,max:100,now:20});act(()=>backend.props.onValueChange(30));expect(change).not.toHaveBeenCalled();});
it('native notification bursts preserve critical retry and every message',()=>{const {Toast}=require('../../packages/native/src/status');const retry=jest.fn();const notices=Array.from({length:5},(_,i)=>({id:String(i),message:`Outcome ${i}`,severity:'error',action:i===0?React.createElement(Button,{onPress:retry},'Retry'):undefined}));mount(React.createElement(Toast,{notices,onDismiss:jest.fn()}));const json=JSON.stringify(root.toJSON());for(const n of notices)expect(json).toContain(n.message);expect(json).toContain('Retry');});

it('native registered static heading face avoids synthesized font weight',()=>{const {HIGProvider}=require('../../packages/native/src/provider');const {Heading}=require('../../packages/native/src/surface');const {Text,StyleSheet}=require('react-native');const tree=mount(React.createElement(HIGProvider,{fontFamily:'SansRegular',fontFamilies:{400:'SansRegular',600:'SansSemiBold'}},React.createElement(Heading,null,'Review')));const text=tree.findByType(Text);const style=StyleSheet.flatten(text.props.style);expect(style.fontFamily).toBe('SansSemiBold');expect(style.fontWeight).toBe('normal');});

it('native mark geometry and decorative semantics match the approved source at each size',()=>{const {BrandMark}=require('../../packages/native/src/brand');const {default:Svg,Rect,Path}=require('react-native-svg');const source=require('node:fs').readFileSync('packages/tokens/assets/bloxwap-icon.svg','utf8');const paths=[...source.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);const radius=source.match(/rx="([^"]+)"/)[1];for(const size of [16,20,24,32]){if(root)act(()=>root.unmount());const tree=mount(React.createElement(BrandMark,{size}));expect(tree.findByType(Svg).props.width).toBe(size);expect(tree.findByType(Svg).props.height).toBe(size);expect(tree.findByType(Svg).props.accessible).toBe(false);expect(tree.findByType(Rect).props.rx).toBe(radius);expect(tree.findAllByType(Path).map(p=>p.props.d)).toEqual(paths);}});
it('native canceled and busy activation never emits optional feedback',()=>{const {HIGProvider}=require('../../packages/native/src/provider');const emit=jest.fn(),action=jest.fn(e=>e.preventDefault());const tree=mount(React.createElement(HIGProvider,{feedback:{emit}},React.createElement(Button,{onPress:action},'Cancel')));const press=tree.findAll(n=>n.props.accessibilityRole==='button'&&n.props.onPress)[0];let prevented=false;act(()=>press.props.onPress({stopPropagation(){},preventDefault(){prevented=true;},isDefaultPrevented(){return prevented;}}));expect(action).toHaveBeenCalledTimes(1);expect(emit).not.toHaveBeenCalled();});

it('native disabled selection handlers reject even direct backend callbacks',()=>{const {Switch}=require('../../packages/native/src/switch');const change=jest.fn();for(const [Component,props,role,handler,arg] of [[Checkbox,{label:'Choice',disabled:true,onCheckedChange:change},'checkbox','onPress',undefined],[RadioGroup,{label:'Side',disabled:true,onValueChange:change,options:[{value:'buy',label:'Buy'}]},'radio','onPress',undefined],[Switch,{label:'Sound',disabled:true,onCheckedChange:change},null,'onValueChange',true]]){if(root)act(()=>root.unmount());const tree=mount(React.createElement(Component,props));const control=tree.findAll(n=>typeof n.props[handler]==='function'&&(!role||n.props.accessibilityRole===role))[0];act(()=>control.props[handler](arg));}expect(change).not.toHaveBeenCalled();});
it('native Modal requests initial and return accessibility focus without delayed stale requests',()=>{const {AccessibilityInfo,findNodeHandle}=require('react-native');void findNodeHandle;const rn=require('react-native');const handle=jest.spyOn(rn,'findNodeHandle').mockImplementation(node=>node._nativeTag);const focus=jest.spyOn(AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});const raf=jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{callback(0);return 99;});const initialFocusRef={current:{_nativeTag:7}},returnFocusRef={current:{_nativeTag:9}};try{const props={open:true,onOpenChange:jest.fn(),title:'Review',description:'Verify',initialFocusRef,returnFocusRef};const tree=mount(React.createElement(Dialog,props,null));act(()=>tree.findByType(Modal).props.onShow());expect(focus).toHaveBeenCalledWith(7);act(()=>root.update(React.createElement(Dialog,{...props,open:false},null)));expect(focus).toHaveBeenLastCalledWith(9);}finally{handle.mockRestore();focus.mockRestore();raf.mockRestore();}});
it('native layout direction follows each provider and stays isolated',()=>{const {HIGProvider}=require('../../packages/native/src/provider');const {Inline}=require('../../packages/native/src/surface');const {View,StyleSheet}=require('react-native');const tree=mount(React.createElement(React.Fragment,null,React.createElement(HIGProvider,{direction:'rtl'},React.createElement(Inline,{testID:'rtl'})),React.createElement(HIGProvider,{direction:'ltr'},React.createElement(Inline,{testID:'ltr'}))));for(const direction of ['rtl','ltr']){const view=tree.findAllByType(View).find(n=>n.props.testID===direction);expect(StyleSheet.flatten(view.props.style).direction).toBe(direction);}});
it('native provider observes OS reduced motion and removes its subscription',async()=>{const {HIGProvider,useHIG}=require('../../packages/native/src/provider');const {AccessibilityInfo}=require('react-native');const remove=jest.fn();let change;const originalSubscribe=AccessibilityInfo.addEventListener,originalQuery=AccessibilityInfo.isReduceMotionEnabled;const subscribe=AccessibilityInfo.addEventListener=jest.fn().mockImplementation((name,callback)=>{if(name==='reduceMotionChanged')change=callback;return {remove};});const query=AccessibilityInfo.isReduceMotionEnabled=jest.fn().mockResolvedValue(true);void subscribe;void query;let env;function Probe(){env=useHIG();return null;}try{await act(async()=>{root=create(React.createElement(HIGProvider,null,React.createElement(Probe)));});expect(env.reducedMotion).toBe(true);act(()=>change(false));expect(env.reducedMotion).toBe(false);act(()=>root.unmount());root=null;expect(remove).toHaveBeenCalledTimes(1);}finally{AccessibilityInfo.addEventListener=originalSubscribe;AccessibilityInfo.isReduceMotionEnabled=originalQuery;}});

it('native typography preserves explicit host families and maps normal/bold weights',()=>{const {HIGProvider}=require('../../packages/native/src/provider');const {Text}=require('../../packages/native/src/surface');const {Text:RNText,StyleSheet}=require('react-native');const tree=mount(React.createElement(HIGProvider,{fontFamily:'SansRegular',fontFamilies:{400:'SansRegular',700:'SansBold'}},React.createElement(React.Fragment,null,React.createElement(Text,{testID:'bold',style:{fontWeight:'bold'}},'Bold'),React.createElement(Text,{testID:'host',style:{fontFamily:'HostMono',fontWeight:'bold'}},'Host'))));const texts=tree.findAllByType(RNText);expect(StyleSheet.flatten(texts.find(n=>n.props.testID==='bold').props.style).fontFamily).toBe('SansBold');expect(StyleSheet.flatten(texts.find(n=>n.props.testID==='host').props.style).fontFamily).toBe('HostMono');});

it('native disabled fields block queued edits while preserving host amount keyboard choice',()=>{const change=jest.fn();const tree=mount(React.createElement(Field,{label:'Amount',disabled:true},React.createElement(AmountInput,{editable:true,keyboardType:'numbers-and-punctuation',accessibilityState:{disabled:false},onChangeText:change})));const input=tree.findByType(TextInput);expect(input.props.editable).toBe(false);expect(input.props.accessibilityState.disabled).toBe(true);expect(input.props.onChangeText).toBeUndefined();expect(input.props.keyboardType).toBe('numbers-and-punctuation');});
it('native notification bursts announce once and repeated ids/content stay silent',()=>{const {Toast}=require('../../packages/native/src/status');const {Platform,AccessibilityInfo}=require('react-native');const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS'),original=AccessibilityInfo.announceForAccessibilityWithOptions;Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();try{const notices=[{id:'1',message:'Failed operation',severity:'error'},{id:'2',message:'Copied',severity:'info'}];mount(React.createElement(Toast,{notices,onDismiss:jest.fn()}));expect(announce).toHaveBeenCalledTimes(1);expect(announce).toHaveBeenCalledWith('Failed operation',{queue:false});act(()=>root.update(React.createElement(Toast,{notices:[...notices],onDismiss:jest.fn()})));expect(announce).toHaveBeenCalledTimes(1);act(()=>root.unmount());root=null;}finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}});
it('native iOS inline status announces changed content without repeating unchanged renders',()=>{const {Alert}=require('../../packages/native/src/status');const {Text,Platform,AccessibilityInfo}=require('react-native');const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS'),original=AccessibilityInfo.announceForAccessibilityWithOptions;Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();try{const example=message=>React.createElement(Alert,{title:'Result'},React.createElement(Text,null,message));mount(example('Ready'));act(()=>root.update(example('Ready')));expect(announce).toHaveBeenCalledTimes(1);act(()=>root.update(example('Completed')));expect(announce).toHaveBeenCalledTimes(2);expect(announce).toHaveBeenLastCalledWith('Result. Completed',{queue:true});act(()=>root.unmount());root=null;}finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}});

it('native percent uses one localized accessible readout and preserves percent points',()=>{
 const {Percent}=require('../../packages/native/src/data');const {HIGProvider}=require('../../packages/native/src/provider');
 mount(React.createElement(HIGProvider,{locale:'de-DE'},React.createElement(Percent,{value:5.25,label:'Change'})));
 expect(JSON.stringify(root.toJSON())).toContain(new Intl.NumberFormat('de-DE',{style:'percent',maximumFractionDigits:3}).format(.0525));
 expect(root.root.findAll(n=>n.props.accessibilityLabel==='Change: '+new Intl.NumberFormat('de-DE',{style:'percent',maximumFractionDigits:3}).format(.0525)).length).toBeGreaterThan(0);
});
it('native long lists virtualize stable keys and expose loading, retry and pagination',()=>{
 const {FlatList}=require('react-native');const {List}=require('../../packages/native/src/data');const retry=jest.fn(),more=jest.fn();
 const items=Array.from({length:10000},(_,id)=>({id:String(id)}));const tree=mount(React.createElement(List,{items,keyFor:i=>i.id,render:i=>React.createElement(require('react-native').Text,null,i.id),label:'Positions',error:'Offline',onRetry:retry,onLoadMore:more}));
 const list=tree.findByType(FlatList);expect(list.props.data).toHaveLength(10000);expect(list.props.keyExtractor(items[9999])).toBe('9999');expect(list.props.accessibilityLabel).toBe('Positions');
 const element=list.props.ListFooterComponent;act(()=>root.unmount());root=null;const footer=mount(element);const buttons=footer.findAllByType(Button);act(()=>buttons[0].props.onPress());act(()=>buttons[1].props.onPress());expect(retry).toHaveBeenCalledTimes(1);expect(more).toHaveBeenCalledTimes(1);
});
it('native accordion emits one silent disclosure intent instead of duplicate activation and selection',()=>{
 const {Accordion}=require('../../packages/native/src/navigation');const {HIGProvider}=require('../../packages/native/src/provider');const emit=jest.fn();
 const tree=mount(React.createElement(HIGProvider,{feedback:{emit}},React.createElement(Accordion,{title:'Details'},'Information')));
 const target=tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0];act(()=>target.props.onPress({stopPropagation:()=>{},isDefaultPrevented:()=>false}));expect(emit).toHaveBeenCalledTimes(1);expect(emit.mock.calls[0][0].intent).toBe('disclosure');
});
it('optional native number motion uses the native driver, cancels replacement and bypasses rapid/reduced-motion changes',()=>{
 const {Animated}=require('react-native');const {AnimatedNumberReadout}=require('../../packages/native/src/animated-number');const {HIGProvider}=require('../../packages/native/src/provider');const start=jest.fn(),stop=jest.fn();const timing=jest.spyOn(Animated,'timing').mockReturnValue({start,stop,reset:jest.fn()});const clock=jest.spyOn(Date,'now').mockReturnValue(1000);
 const element=(value,reducedMotion=false)=>React.createElement(HIGProvider,{reducedMotion},React.createElement(AnimatedNumberReadout,{value,label:'Price'}));
 try{mount(element(1));expect(timing).not.toHaveBeenCalled();act(()=>root.update(element(2)));expect(timing).toHaveBeenCalledTimes(1);expect(timing.mock.calls[0][1].useNativeDriver).toBe(true);expect(start).toHaveBeenCalledTimes(1);clock.mockReturnValue(1010);act(()=>root.update(element(3)));expect(stop).toHaveBeenCalledTimes(1);expect(timing).toHaveBeenCalledTimes(1);clock.mockReturnValue(2000);act(()=>root.update(element(4,true)));expect(timing).toHaveBeenCalledTimes(1);expect(JSON.stringify(root.toJSON())).toContain('Price: 4');
 }finally{timing.mockRestore();clock.mockRestore();}
});
it('native menu disclosure is quiet and one accepted selection follows the action while cancellation stays silent',()=>{
 const {Menu}=require('../../packages/native/src/overlay');const {HIGProvider}=require('../../packages/native/src/provider');const order=[],emit=jest.fn(()=>order.push('feedback'));
 const tree=mount(React.createElement(HIGProvider,{feedback:{emit}},React.createElement(Menu,{label:'Actions',items:[{label:'Select',onSelect:()=>order.push('action')},{label:'Cancel',onSelect:event=>event.preventDefault()}]})));
 const event=()=>{let canceled=false;return {stopPropagation:()=>{},preventDefault:()=>{canceled=true;},isDefaultPrevented:()=>canceled};};
 act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Actions').props.onPress(event()));expect(emit).not.toHaveBeenCalled();
 act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Select').props.onPress(event()));expect(order).toEqual(['action','feedback']);expect(emit.mock.calls[0][0].intent).toBe('selection');
 act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Actions').props.onPress(event()));act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Cancel').props.onPress(event()));expect(emit).toHaveBeenCalledTimes(1);
});
it('native button keeps adjacent text children in one wrapping Text run (iOS Simulator regression)',()=>{
 // Select/MarketRow pass `{label}: {value}` and `{name} ({symbol})`; split runs rendered "Bitcoin ( BTC" with ")" wrapped alone.
 const {Text}=require('react-native');const {Select}=require('../../packages/native/src/select');const {MarketRow}=require('../../packages/native/src/recipes');
 const select=mount(React.createElement(Select,{label:'Component',options:[{value:'button',label:'Button'}],value:'button',onValueChange:jest.fn()}));
 expect(select.findAllByType(Text).map(t=>t.props.children)).toContain('Component: Button');
 const row=mount(React.createElement(MarketRow,{symbol:'BTC',name:'Bitcoin',price:1,change:1,onSelect:jest.fn()}));
 expect(row.findAllByType(Text).map(t=>t.props.children)).toContain('Bitcoin (BTC)');
 const icon=mount(React.createElement(Button,null,'Copy ',3,React.createElement(Text,{testID:'icon'},'*'),' items'));
 expect(icon.findAllByType(Text).map(t=>t.props.children)).toEqual(['Copy 3','*',' items']);
});
it('native search status region never renders an empty accessibility element (iOS Simulator audit regression)',()=>{
 const {Text}=require('react-native');const {Search}=require('../../packages/native/src/navigation');
 const status=results=>{const tree=mount(React.createElement(Search,{query:'b',onQueryChange:jest.fn(),results}));return tree.findAllByType(Text).find(t=>t.props.accessibilityLiveRegion==='polite').props.children;};
 expect(status([{id:'btc',label:'Bitcoin (BTC)',onSelect:jest.fn()}])).toBe('1 result');
 expect(status([{id:'a',label:'A',onSelect:jest.fn()},{id:'b',label:'B',onSelect:jest.fn()}])).toBe('2 results');
 expect(status([])).toBe('No results');
});
it('native switch exposes one labeled 48dp row target and toggles from the row (Android emulator 47x27dp regression)',()=>{
 const {Switch}=require('../../packages/native/src/switch');const {StyleSheet}=require('react-native');const change=jest.fn();
 const tree=mount(React.createElement(Switch,{label:'Sound',checked:false,onCheckedChange:change}));
 const rows=tree.findAll(n=>n.props.accessibilityRole==='switch'&&typeof n.props.onPress==='function');
 expect(rows).toHaveLength(1);const row=rows[0];
 expect(row.props.accessibilityLabel).toBe('Sound');expect(row.props.accessibilityState).toEqual({checked:false,disabled:false});
 expect(StyleSheet.flatten(typeof row.props.style==='function'?row.props.style({pressed:false}):row.props.style).minHeight).toBeGreaterThanOrEqual(48);
 const hidden=tree.findAll(n=>n.props.importantForAccessibility==='no-hide-descendants'&&n.props.accessibilityElementsHidden===true);
 expect(hidden.length).toBeGreaterThan(0);expect(hidden[0].props.pointerEvents).toBe('none');
 act(()=>row.props.onPress());expect(change).toHaveBeenCalledWith(true);
});
it('native slider exposes a 48dp adjustable accessibility element (Android emulator 18dp SeekBar regression)',()=>{
 const {Slider}=require('../../packages/native/src/slider');const {StyleSheet}=require('react-native');
 const tree=mount(React.createElement(Slider,{label:'Volume',value:20}));const element=tree.findAll(n=>n.props.accessibilityRole==='adjustable'&&n.props.accessible)[0];
 expect(StyleSheet.flatten(element.props.style).minHeight).toBe(48);
 const backend=tree.findAll(n=>n.props.onValueChange&&n.props.minimumValue===0)[0];expect(backend.props.importantForAccessibility).toBe('no-hide-descendants');
});
it('native provider follows the OS RTL layout direction by default (Android emulator Arabic-locale regression)',()=>{
 // With an Arabic per-app locale I18nManager.isRTL was true, yet HIG Stack/Inline forced direction:"ltr".
 jest.isolateModules(()=>{
  const R=require('react');const {create,act:run}=require('react-test-renderer');const RN=require('react-native');
  const original=RN.I18nManager.isRTL;Object.defineProperty(RN.I18nManager,'isRTL',{value:true,configurable:true});
  try{const {HIGProvider}=require('../../packages/native/src/provider');const {Stack}=require('../../packages/native/src/surface');
   const direction=element=>{let r;run(()=>{r=create(element);});const value=RN.StyleSheet.flatten(r.root.findAll(n=>n.type===RN.View)[0].props.style).direction;run(()=>r.unmount());return value;};
   expect(direction(R.createElement(HIGProvider,null,R.createElement(Stack)))).toBe('rtl');
   expect(direction(R.createElement(Stack))).toBe('rtl');
   expect(direction(R.createElement(HIGProvider,{direction:'ltr'},R.createElement(Stack)))).toBe('ltr');
  }finally{Object.defineProperty(RN.I18nManager,'isRTL',{value:original,configurable:true});}
 });
});
it('native iOS slider handles VoiceOver increment/decrement actions in 5% steps (iOS Simulator regression)',()=>{
 // RN Fabric only forwards accessibilityIncrement/Decrement to onAccessibilityAction; without it VoiceOver swipes did nothing.
 const {Platform}=require('react-native');expect(Platform.OS).toBe('ios');
 const {Slider}=require('../../packages/native/src/slider');const change=jest.fn();
 const tree=mount(React.createElement(Slider,{label:'Volume',defaultValue:25,onValueChange:change}));
 const slider=()=>tree.findAll(n=>n.props.accessibilityRole==='adjustable'&&n.props.onAccessibilityAction)[0];
 expect(slider().props.accessibilityActions.map(a=>a.name)).toEqual(['increment','decrement']);
 // The community backend drops onAccessibilityAction on iOS Fabric, so it must be hidden behind the adjustable wrapper.
 const backend=tree.findAll(n=>n.props.onValueChange&&n.props.minimumValue===0)[0];expect(backend.props.accessibilityElementsHidden).toBe(true);expect(backend.props.onAccessibilityAction).toBeUndefined();
 act(()=>slider().props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(slider().props.accessibilityValue.now).toBe(30);
 act(()=>slider().props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));act(()=>slider().props.onAccessibilityAction({nativeEvent:{actionName:'decrement'}}));
 expect(change.mock.calls.map(c=>c[0])).toEqual([30,35,30]);
 if(root)act(()=>root.unmount());const disabled=jest.fn();const t2=mount(React.createElement(Slider,{label:'Volume',value:100,disabled:true,onValueChange:disabled}));
 act(()=>t2.findAll(n=>n.props.onAccessibilityAction)[0].props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(disabled).not.toHaveBeenCalled();
});
it('native code recipes use the registered mono face and stay LTR inside RTL roots (simulator capture regression)',()=>{
 const {Text,StyleSheet}=require('react-native');const {HIGProvider}=require('../../packages/native/src/provider');const {CodeWindow,InstallCommand}=require('../../packages/native/src/recipes');
 const tree=mount(React.createElement(HIGProvider,{direction:'rtl',fontFamily:'BloxwapSansRegular',monoFontFamily:'BloxwapMonoRegular'},React.createElement(CodeWindow,{language:'TypeScript'},'a >= b'),React.createElement(InstallCommand,{command:'npm i x',onCopy:jest.fn()})));
 const style=text=>StyleSheet.flatten(tree.findAllByType(Text).find(t=>t.props.children===text).props.style);
 for(const text of ['a >= b','npm i x'])expect(style(text)).toMatchObject({fontFamily:'BloxwapMonoRegular',writingDirection:'ltr'});
 expect(style('TypeScript')).toMatchObject({fontFamily:'BloxwapSansRegular',writingDirection:'rtl'});
});
it('native Menu and Select return focus to their own trigger on close (Android TalkBack regression)',()=>{
 // With TalkBack on the emulator, closing a Menu by Back left focus on the first screen element instead of the trigger.
 const rn=require('react-native');const {Menu}=require('../../packages/native/src/overlay');const {Select}=require('../../packages/native/src/select');
 const handle=jest.spyOn(rn,'findNodeHandle').mockImplementation(node=>node?'trigger-handle':null);const focus=jest.spyOn(rn.AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});const raf=jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{callback(0);return 1;});
 try{for(const element of [React.createElement(Menu,{label:'Market actions',items:[{label:'Show details',onSelect:jest.fn()}]}),React.createElement(Select,{label:'Side',options:[{value:'buy',label:'Buy'}],value:'buy',onValueChange:jest.fn()})]){
  if(root)act(()=>root.unmount());focus.mockClear();const tree=mount(element);
  const trigger=tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0];
  act(()=>trigger.props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented(){return false;}}));
  const modal=tree.findByType(rn.Modal);expect(modal.props.visible).toBe(true);
  act(()=>modal.props.onRequestClose());
  expect(tree.findByType(rn.Modal).props.visible).toBe(false);
  expect(focus).toHaveBeenLastCalledWith('trigger-handle');
 }}finally{handle.mockRestore();focus.mockRestore();raf.mockRestore();}
});
it('native InstallCommand hides its empty status region from VoiceOver until a copy outcome exists (iOS audit regression)',async()=>{
 const {Text}=require('react-native');const {InstallCommand}=require('../../packages/native/src/recipes');
 const tree=mount(React.createElement(InstallCommand,{command:'npm i x',onCopy:()=>Promise.resolve()}));
 const status=()=>tree.findAllByType(Text).find(t=>t.props.accessibilityLiveRegion==='polite');
 expect(status().props.accessibilityElementsHidden).toBe(true);
 await act(async()=>{tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0].props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented(){return false;}});});
 expect(status().props.children).toBe('Copied');expect(status().props.accessibilityElementsHidden).toBe(false);
});
it('native overlay focus requests also send viewHoverEnter on Android so TalkBack moves focus (emulator regression)',()=>{
 // focusNative reads Platform.OS per call, so the shared registry can be switched to Android for this test.
 const RN=require('react-native');const os=RN.Platform.OS;Object.defineProperty(RN.Platform,'OS',{value:'android',configurable:true});
 const handle=jest.spyOn(RN,'findNodeHandle').mockImplementation(node=>node?42:null);const focus=jest.spyOn(RN.AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});const hover=jest.spyOn(RN.AccessibilityInfo,'sendAccessibilityEvent').mockImplementation(()=>{});const raf=jest.spyOn(global,'requestAnimationFrame').mockImplementation(cb=>{cb(0);return 1;});
 try{const trigger={current:{_nativeTag:5}};const props={open:true,onOpenChange:jest.fn(),title:'Review',description:'Verify',returnFocusRef:trigger};
  const tree=mount(React.createElement(Dialog,props,null));
  act(()=>tree.findByType(RN.Modal).props.onShow());expect(focus).toHaveBeenCalledWith(42);expect(hover).toHaveBeenLastCalledWith(expect.anything(),'viewHoverEnter');
  act(()=>root.update(React.createElement(Dialog,{...props,open:false},null)));
  expect(hover).toHaveBeenLastCalledWith(trigger.current,'viewHoverEnter');
 }finally{Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});handle.mockRestore();focus.mockRestore();hover.mockRestore();raf.mockRestore();}
});
