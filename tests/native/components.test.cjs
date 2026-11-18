const React=require('react');
const {create,act}=require('react-test-renderer');
const {TextInput,Modal}=require('react-native');
const {Button}=require('../../packages/hig/native/src/button');
const {Field,Input}=require('../../packages/hig/native/src/field');
const {Checkbox,RadioGroup}=require('../../packages/hig/native/src/selection');
const {Dialog}=require('../../packages/hig/native/src/overlay');
const {NumberReadout}=require('../../packages/hig/native/src/data');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}
it('native busy button exposes blocked action/progress state',()=>{const tree=mount(React.createElement(Button,{busy:true},'Confirm'));const button=tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0];expect(button.props.disabled).toBe(true);expect(button.props.accessibilityState).toEqual({disabled:true,busy:true});});
it('native checkbox updates state on accepted activation',()=>{const change=jest.fn();const tree=mount(React.createElement(Checkbox,{label:'Sound',onCheckedChange:change}));act(()=>tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0].props.onPress());expect(change).toHaveBeenCalledWith(true);expect(tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0].props.accessibilityState.checked).toBe(true);});
it('native controlled radio ignores repeated current values',()=>{const change=jest.fn();const tree=mount(React.createElement(RadioGroup,{label:'Side',value:'buy',onValueChange:change,options:[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}]}));act(()=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function')[0].props.onPress());expect(change).not.toHaveBeenCalled();act(()=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function')[1].props.onPress());expect(change).toHaveBeenCalledWith('sell');});
it('native radio selection leaves other labels untouched and uses the latest change handler',()=>{
 const read=jest.fn(index=>String(index));
 const options=Array.from({length:50},(_,index)=>({value:String(index),get label(){return read(index);}}));
 const oldChange=jest.fn(),newChange=jest.fn();
 const group=(value,onValueChange)=>React.createElement(RadioGroup,{label:'Choice',options,value,onValueChange});
 const tree=mount(group('0',oldChange));
 read.mockClear();
 act(()=>root.update(group('1',newChange)));
 expect(read.mock.calls.filter(([index])=>index>1)).toHaveLength(0);
 const radio=tree.findAll(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityLabel==='2'&&typeof n.props.onPress==='function')[0];
 act(()=>radio.props.onPress());
 expect(newChange).toHaveBeenCalledWith('2');
 expect(oldChange).not.toHaveBeenCalled();
});
it('native amount entry keeps raw decimal string and labeled error hint',()=>{const tree=mount(React.createElement(Field,{label:'Amount',description:'Available: 1 BTC',error:'Precision exceeded'},React.createElement(Input,{value:'0,001',keyboardType:'decimal-pad'})));const input=tree.findByType(TextInput);expect(input.props.value).toBe('0,001');expect(input.props.accessibilityLabel).toBe('Amount');expect(input.props.accessibilityHint).toContain('Precision exceeded');expect(input.props.keyboardType).toBe('decimal-pad');});
it('native Modal handles Android back without DOM imports',()=>{const close=jest.fn();const tree=mount(React.createElement(Dialog,{open:true,onOpenChange:close,title:'Review',description:'Verify amount'},null));act(()=>tree.findByType(Modal).props.onRequestClose());expect(close).toHaveBeenCalledWith(false);});
it('native unknown financial values stay distinct from zero',()=>{mount(React.createElement(NumberReadout,{value:null}));expect(JSON.stringify(root.toJSON())).toContain('—');});

it('native slider blocks disabled backend changes and exposes adjustment state',()=>{const {Slider}=require('../../packages/hig/native/src/slider');const change=jest.fn();const tree=mount(React.createElement(Slider,{label:'Volume',value:20,disabled:true,onValueChange:change}));const slider=tree.findAll(n=>n.props.accessibilityRole==='adjustable')[0];const backend=tree.findAll(n=>n.props.onValueChange&&n.props.minimumValue===0)[0];expect(slider.props.accessibilityState).toEqual({disabled:true});expect(slider.props.accessibilityValue).toEqual({min:0,max:100,now:20});act(()=>backend.props.onValueChange(30));expect(change).not.toHaveBeenCalled();});
it('native notification bursts preserve critical retry and every message',()=>{const {Toast}=require('../../packages/hig/native/src/status');const retry=jest.fn();const notices=Array.from({length:5},(_,i)=>({id:String(i),message:`Outcome ${i}`,severity:'error',action:i===0?React.createElement(Button,{onPress:retry},'Retry'):undefined}));mount(React.createElement(Toast,{notices,onDismiss:jest.fn()}));const json=JSON.stringify(root.toJSON());for(const n of notices)expect(json).toContain(n.message);expect(json).toContain('Retry');});

it('native registered static heading face avoids synthesized font weight',()=>{const {HIGProvider}=require('../../packages/hig/native/src/provider');const {Heading}=require('../../packages/hig/native/src/surface');const {Text,StyleSheet}=require('react-native');const tree=mount(React.createElement(HIGProvider,{fontFamily:'SansRegular',fontFamilies:{400:'SansRegular',600:'SansSemiBold'}},React.createElement(Heading,null,'Review')));const text=tree.findByType(Text);const style=StyleSheet.flatten(text.props.style);expect(style.fontFamily).toBe('SansSemiBold');expect(style.fontWeight).toBe('normal');});

it('native mark geometry and decorative semantics match the approved source at each size',()=>{const {BrandMark}=require('../../packages/hig/native/src/brand');const {default:Svg,Rect,Path}=require('react-native-svg');const source=require('node:fs').readFileSync('packages/hig/tokens/assets/bloxwap-icon.svg','utf8');const paths=[...source.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);const radius=source.match(/rx="([^"]+)"/)[1];for(const size of [16,20,24,32]){if(root)act(()=>root.unmount());const tree=mount(React.createElement(BrandMark,{size}));expect(tree.findByType(Svg).props.width).toBe(size);expect(tree.findByType(Svg).props.height).toBe(size);expect(tree.findByType(Svg).props.accessible).toBe(false);expect(tree.findByType(Rect).props.rx).toBe(radius);expect(tree.findAllByType(Path).map(p=>p.props.d)).toEqual(paths);}});
it('native canceled and busy activation never emits optional feedback',()=>{const {HIGProvider}=require('../../packages/hig/native/src/provider');const emit=jest.fn(),action=jest.fn(e=>e.preventDefault());const tree=mount(React.createElement(HIGProvider,{feedback:{emit}},React.createElement(Button,{onPress:action},'Cancel')));const press=tree.findAll(n=>n.props.accessibilityRole==='button'&&n.props.onPress)[0];let prevented=false;act(()=>press.props.onPress({stopPropagation(){},preventDefault(){prevented=true;},isDefaultPrevented(){return prevented;}}));expect(action).toHaveBeenCalledTimes(1);expect(emit).not.toHaveBeenCalled();});

it('native disabled selection handlers reject even direct backend callbacks',()=>{const {Switch}=require('../../packages/hig/native/src/switch');const change=jest.fn();for(const [Component,props,role,handler,arg] of [[Checkbox,{label:'Choice',disabled:true,onCheckedChange:change},'checkbox','onPress',undefined],[RadioGroup,{label:'Side',disabled:true,onValueChange:change,options:[{value:'buy',label:'Buy'}]},'radio','onPress',undefined],[Switch,{label:'Sound',disabled:true,onCheckedChange:change},null,'onValueChange',true]]){if(root)act(()=>root.unmount());const tree=mount(React.createElement(Component,props));const control=tree.findAll(n=>typeof n.props[handler]==='function'&&(!role||n.props.accessibilityRole===role))[0];act(()=>control.props[handler](arg));}expect(change).not.toHaveBeenCalled();});
it('native Modal keeps the host orientation instead of forcing iOS portrait',()=>{const tree=mount(React.createElement(Dialog,{open:true,onOpenChange:jest.fn(),title:'Review',description:'Verify amount'},null));const orientations=tree.findByType(Modal).props.supportedOrientations;expect(orientations).toEqual(expect.arrayContaining(['portrait','landscape-left','landscape-right']));});
it('native Modal requests initial and return accessibility focus without delayed stale requests',()=>{const {AccessibilityInfo,findNodeHandle}=require('react-native');void findNodeHandle;const rn=require('react-native');const handle=jest.spyOn(rn,'findNodeHandle').mockImplementation(node=>node._nativeTag);const focus=jest.spyOn(AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});const raf=jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{callback(0);return 99;});const initialFocusRef={current:{_nativeTag:7}},returnFocusRef={current:{_nativeTag:9}};try{const props={open:true,onOpenChange:jest.fn(),title:'Review',description:'Verify',initialFocusRef,returnFocusRef};const tree=mount(React.createElement(Dialog,props,null));act(()=>tree.findByType(Modal).props.onShow());expect(focus).toHaveBeenCalledWith(7);act(()=>root.update(React.createElement(Dialog,{...props,open:false},null)));expect(focus).toHaveBeenLastCalledWith(9);}finally{handle.mockRestore();focus.mockRestore();raf.mockRestore();}});
it('native layout direction follows each provider and stays isolated',()=>{const {HIGProvider}=require('../../packages/hig/native/src/provider');const {Inline}=require('../../packages/hig/native/src/surface');const {View,StyleSheet}=require('react-native');const tree=mount(React.createElement(React.Fragment,null,React.createElement(HIGProvider,{direction:'rtl'},React.createElement(Inline,{testID:'rtl'})),React.createElement(HIGProvider,{direction:'ltr'},React.createElement(Inline,{testID:'ltr'}))));for(const direction of ['rtl','ltr']){const view=tree.findAllByType(View).find(n=>n.props.testID===direction);expect(StyleSheet.flatten(view.props.style).direction).toBe(direction);}});
it('native provider observes OS reduced motion and removes its subscription',async()=>{const {HIGProvider,useHIG}=require('../../packages/hig/native/src/provider');const {AccessibilityInfo}=require('react-native');const remove=jest.fn();let change;const originalSubscribe=AccessibilityInfo.addEventListener,originalQuery=AccessibilityInfo.isReduceMotionEnabled;const subscribe=AccessibilityInfo.addEventListener=jest.fn().mockImplementation((name,callback)=>{if(name==='reduceMotionChanged')change=callback;return {remove};});const query=AccessibilityInfo.isReduceMotionEnabled=jest.fn().mockResolvedValue(true);let env;function Probe(){env=useHIG();return null;}try{await act(async()=>{root=create(React.createElement(HIGProvider,null,React.createElement(HIGProvider,null,React.createElement(Probe))));});expect(subscribe).toHaveBeenCalledTimes(1);expect(query).toHaveBeenCalledTimes(1);expect(env.reducedMotion).toBe(true);act(()=>change(false));expect(env.reducedMotion).toBe(false);act(()=>root.unmount());root=null;expect(remove).toHaveBeenCalledTimes(1);}finally{AccessibilityInfo.addEventListener=originalSubscribe;AccessibilityInfo.isReduceMotionEnabled=originalQuery;}});

it('native typography preserves explicit host families and maps normal/bold weights',()=>{const {HIGProvider}=require('../../packages/hig/native/src/provider');const {Text}=require('../../packages/hig/native/src/surface');const {Text:RNText,StyleSheet}=require('react-native');const tree=mount(React.createElement(HIGProvider,{fontFamily:'SansRegular',fontFamilies:{400:'SansRegular',700:'SansBold'}},React.createElement(React.Fragment,null,React.createElement(Text,{testID:'bold',style:{fontWeight:'bold'}},'Bold'),React.createElement(Text,{testID:'host',style:{fontFamily:'HostMono',fontWeight:'bold'}},'Host'))));const texts=tree.findAllByType(RNText);expect(StyleSheet.flatten(texts.find(n=>n.props.testID==='bold').props.style).fontFamily).toBe('SansBold');expect(StyleSheet.flatten(texts.find(n=>n.props.testID==='host').props.style).fontFamily).toBe('HostMono');});

it('native disabled fields block queued edits while preserving host amount keyboard choice',()=>{const change=jest.fn();const tree=mount(React.createElement(Field,{label:'Amount',disabled:true},React.createElement(Input,{editable:true,keyboardType:'numbers-and-punctuation',accessibilityState:{disabled:false},onChangeText:change})));const input=tree.findByType(TextInput);expect(input.props.editable).toBe(false);expect(input.props.accessibilityState.disabled).toBe(true);expect(input.props.onChangeText).toBeUndefined();expect(input.props.keyboardType).toBe('numbers-and-punctuation');});
it('native notification bursts announce once and repeated ids/content stay silent',()=>{const {Toast}=require('../../packages/hig/native/src/status');const {Platform,AccessibilityInfo}=require('react-native');const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS'),original=AccessibilityInfo.announceForAccessibilityWithOptions;Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();try{const notices=[{id:'1',message:'Failed operation',severity:'error'},{id:'2',message:'Copied',severity:'info'}];mount(React.createElement(Toast,{notices,onDismiss:jest.fn()}));expect(announce).toHaveBeenCalledTimes(1);expect(announce).toHaveBeenCalledWith('Failed operation',{queue:false});act(()=>root.update(React.createElement(Toast,{notices:[...notices],onDismiss:jest.fn()})));expect(announce).toHaveBeenCalledTimes(1);act(()=>root.unmount());root=null;}finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}});
it('native Callout accepts a ReactNode title, renders it in the heading and announces its text (#69)',()=>{const {Callout}=require('../../packages/hig/native/src/status');const {Text,Platform,AccessibilityInfo}=require('react-native');const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS'),original=AccessibilityInfo.announceForAccessibilityWithOptions;Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();try{const tree=mount(React.createElement(Callout,{severity:'tip',title:React.createElement(Text,{testID:'rich-title'},'Rich result')},React.createElement(Text,null,'Body')));const heading=tree.find(n=>n.props.accessibilityRole==='header');expect(heading.findAll(n=>n.props.testID==='rich-title').length).toBeGreaterThan(0);expect(announce).toHaveBeenLastCalledWith('Rich result. Body',{queue:true});act(()=>root.unmount());root=null;}finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}});
it('native iOS inline status announces changed content without repeating unchanged renders',()=>{const {Alert}=require('../../packages/hig/native/src/status');const {Text,Platform,AccessibilityInfo}=require('react-native');const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS'),original=AccessibilityInfo.announceForAccessibilityWithOptions;Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();try{const example=message=>React.createElement(Alert,{title:'Result'},React.createElement(Text,null,message));mount(example('Ready'));act(()=>root.update(example('Ready')));expect(announce).toHaveBeenCalledTimes(1);act(()=>root.update(example('Completed')));expect(announce).toHaveBeenCalledTimes(2);expect(announce).toHaveBeenLastCalledWith('Result. Completed',{queue:true});act(()=>root.unmount());root=null;}finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}});

it('native percent uses one localized accessible readout and preserves percent points',()=>{
 const {Percent}=require('../../packages/hig/native/src/data');const {HIGProvider}=require('../../packages/hig/native/src/provider');
 mount(React.createElement(HIGProvider,{locale:'de-DE'},React.createElement(Percent,{value:5.25,label:'Change'})));
 expect(JSON.stringify(root.toJSON())).toContain(new Intl.NumberFormat('de-DE',{style:'percent',maximumFractionDigits:3}).format(.0525));
 expect(root.root.findAll(n=>n.props.accessibilityLabel==='Change: '+new Intl.NumberFormat('de-DE',{style:'percent',maximumFractionDigits:3}).format(.0525)).length).toBeGreaterThan(0);
});
it('native long lists virtualize stable keys and expose loading, retry and pagination',()=>{
 const {FlatList}=require('react-native');const {List}=require('../../packages/hig/native/src/data');const retry=jest.fn(),more=jest.fn();
 const items=Array.from({length:10000},(_,id)=>({id:String(id)}));const tree=mount(React.createElement(List,{items,keyFor:i=>i.id,render:i=>React.createElement(require('react-native').Text,null,i.id),label:'Positions',error:'Offline',onRetry:retry,onLoadMore:more}));
 const list=tree.findByType(FlatList);expect(list.props.data).toHaveLength(10000);expect(list.props.keyExtractor(items[9999])).toBe('9999');expect(list.props.accessibilityLabel).toBe('Positions');
 const element=list.props.ListFooterComponent;act(()=>root.unmount());root=null;const footer=mount(element);const buttons=footer.findAllByType(Button);act(()=>buttons[0].props.onPress());act(()=>buttons[1].props.onPress());expect(retry).toHaveBeenCalledTimes(1);expect(more).toHaveBeenCalledTimes(1);
});
it('native accordion emits one silent disclosure intent instead of duplicate activation and selection',()=>{
 const {Accordion}=require('../../packages/hig/native/src/navigation');const {HIGProvider}=require('../../packages/hig/native/src/provider');const emit=jest.fn();
 const tree=mount(React.createElement(HIGProvider,{feedback:{emit},reducedMotion:true},React.createElement(Accordion,{title:'Details'},'Information')));
 const target=tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0];act(()=>target.props.onPress({stopPropagation:()=>{},isDefaultPrevented:()=>false}));expect(emit).toHaveBeenCalledTimes(1);expect(emit.mock.calls[0][0].intent).toBe('disclosure');
});
it('optional native number motion exposes one quiet accessible final reading',()=>{
 const {Text}=require('react-native');const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');const {HIGProvider}=require('../../packages/hig/native/src/provider');
 const element=(value,reducedMotion=false)=>React.createElement(HIGProvider,{reducedMotion},React.createElement(AnimatedNumberReadout,{value,label:'Price',testID:'animated-price'}));
 mount(element(1));act(()=>root.update(element(4,true)));
 const readings=root.root.findAllByType(Text).filter(node=>node.props.testID==='animated-price');expect(readings).toHaveLength(1);expect(readings[0].props.accessibilityLabel).toBe('Price: 4');expect(readings[0].props.accessibilityLiveRegion).toBeUndefined();
});
it('native menu disclosure is quiet and one accepted selection follows the action while cancellation stays silent',()=>{
 const {Menu}=require('../../packages/hig/native/src/overlay');const {HIGProvider}=require('../../packages/hig/native/src/provider');const order=[],emit=jest.fn(()=>order.push('feedback'));
 const tree=mount(React.createElement(HIGProvider,{feedback:{emit}},React.createElement(Menu,{label:'Actions',items:[{label:'Select',onSelect:()=>order.push('action')},{label:'Cancel',onSelect:event=>event.preventDefault()}]})));
 const event=()=>{let canceled=false;return {stopPropagation:()=>{},preventDefault:()=>{canceled=true;},isDefaultPrevented:()=>canceled};};
 act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Actions').props.onPress(event()));expect(emit).not.toHaveBeenCalled();
 act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Select').props.onPress(event()));expect(order).toEqual(['action','feedback']);expect(emit.mock.calls[0][0].intent).toBe('selection');
 act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Actions').props.onPress(event()));act(()=>tree.findAllByType(Button).find(b=>b.props.children==='Cancel').props.onPress(event()));expect(emit).toHaveBeenCalledTimes(1);
});
it('native button keeps adjacent text children in one wrapping Text run (iOS Simulator regression)',()=>{
 // Select/MarketRow pass `{label}: {value}` and `{name} ({symbol})`; split runs rendered "Bitcoin ( BTC" with ")" wrapped alone.
 const {Text}=require('react-native');const {Select}=require('../../packages/hig/native/src/select');const {MarketRow}=require('../../packages/hig/native/src/blocks');
 const select=mount(React.createElement(Select,{label:'Component',options:[{value:'button',label:'Button'}],value:'button',onValueChange:jest.fn()}));
 expect(select.findAllByType(Text).map(t=>t.props.children)).toContain('Component: Button');
 const row=mount(React.createElement(MarketRow,{symbol:'BTC',name:'Bitcoin',price:1,change:1,onSelect:jest.fn()}));
 expect(row.findAllByType(Text).map(t=>t.props.children)).toContain('Bitcoin (BTC)');
 const icon=mount(React.createElement(Button,null,'Copy ',3,React.createElement(Text,{testID:'icon'},'*'),' items'));
 expect(icon.findAllByType(Text).map(t=>t.props.children)).toEqual(['Copy 3','*',' items']);
});
it('native search status region never renders an empty accessibility element (iOS Simulator audit regression)',()=>{
 const {Text}=require('react-native');const {Search}=require('../../packages/hig/native/src/navigation');
 const status=results=>{const tree=mount(React.createElement(Search,{query:'b',onQueryChange:jest.fn(),results}));return tree.findAllByType(Text).find(t=>t.props.accessibilityLiveRegion==='polite').props.children;};
 expect(status([{id:'btc',label:'Bitcoin (BTC)',onSelect:jest.fn()}])).toBe('1 result');
 expect(status([{id:'a',label:'A',onSelect:jest.fn()},{id:'b',label:'B',onSelect:jest.fn()}])).toBe('2 results');
 expect(status([])).toBe('No results');
});
it('native switch exposes one labeled 48dp row target and toggles from the row (Android emulator 47x27dp regression)',()=>{
 const {Switch}=require('../../packages/hig/native/src/switch');const {StyleSheet}=require('react-native');const change=jest.fn();
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
 const {Slider}=require('../../packages/hig/native/src/slider');const {StyleSheet}=require('react-native');
 const tree=mount(React.createElement(Slider,{label:'Volume',value:20}));const element=tree.findAll(n=>n.props.accessibilityRole==='adjustable'&&n.props.accessible)[0];
 expect(StyleSheet.flatten(element.props.style).minHeight).toBe(48);
 const backend=tree.findAll(n=>n.props.onValueChange&&n.props.minimumValue===0)[0];expect(backend.props.importantForAccessibility).toBe('no-hide-descendants');
});
it('native provider follows the OS RTL layout direction by default (Android emulator Arabic-locale regression)',()=>{
 // With an Arabic per-app locale I18nManager.isRTL was true, yet HIG Stack/Inline forced direction:"ltr".
 jest.isolateModules(()=>{
  const R=require('react');const {create,act:run}=require('react-test-renderer');const RN=require('react-native');
  const original=RN.I18nManager.isRTL;Object.defineProperty(RN.I18nManager,'isRTL',{value:true,configurable:true});
  try{const {HIGProvider}=require('../../packages/hig/native/src/provider');const {Stack}=require('../../packages/hig/native/src/surface');
   const direction=element=>{let r;run(()=>{r=create(element);});const value=RN.StyleSheet.flatten(r.root.findAll(n=>n.type===RN.View)[0].props.style).direction;run(()=>r.unmount());return value;};
   expect(direction(R.createElement(HIGProvider,null,R.createElement(Stack)))).toBe('rtl');
   expect(direction(R.createElement(Stack))).toBe('rtl');
   expect(direction(R.createElement(HIGProvider,{direction:'ltr'},R.createElement(Stack)))).toBe('ltr');
  }finally{Object.defineProperty(RN.I18nManager,'isRTL',{value:original,configurable:true});}
 });
});
it('native provider takes a host locale direction when I18nManager.isRTL stays false (RN 0.83 Android per-app locale, #86)',()=>{
 jest.isolateModules(()=>{
  const R=require('react');const {create,act:run}=require('react-test-renderer');const RN=require('react-native');
  const original=RN.I18nManager.isRTL;Object.defineProperty(RN.I18nManager,'isRTL',{value:false,configurable:true});
  try{const {HIGProvider,localeDirection}=require('../../packages/hig/native/src/provider');const {Stack}=require('../../packages/hig/native/src/surface');
   const direction=element=>{let r;run(()=>{r=create(element);});const value=RN.StyleSheet.flatten(r.root.findAll(n=>n.type===RN.View)[0].props.style).direction;run(()=>r.unmount());return value;};
   // expo-localization getLocales()[0] reports the per-app locale and its textDirection; HIG never derives it on its own.
   expect(direction(R.createElement(HIGProvider,{direction:localeDirection({languageTag:'ar-EG',textDirection:'rtl'})},R.createElement(Stack)))).toBe('rtl');
   expect(direction(R.createElement(HIGProvider,{direction:localeDirection('ar_EG')},R.createElement(Stack)))).toBe('rtl');
   expect(direction(R.createElement(HIGProvider,{direction:localeDirection('en-US')},R.createElement(Stack)))).toBe('ltr');
   expect(direction(R.createElement(HIGProvider,{direction:localeDirection('und')},R.createElement(Stack)))).toBe('ltr');
   expect(direction(R.createElement(HIGProvider,null,R.createElement(Stack)))).toBe('ltr');
  }finally{Object.defineProperty(RN.I18nManager,'isRTL',{value:original,configurable:true});}
 });
});
it('native iOS slider handles VoiceOver increment/decrement actions in 5% steps (iOS Simulator regression)',()=>{
 // RN Fabric only forwards accessibilityIncrement/Decrement to onAccessibilityAction; without it VoiceOver swipes did nothing.
 const {Platform}=require('react-native');expect(Platform.OS).toBe('ios');
 const {Slider}=require('../../packages/hig/native/src/slider');const change=jest.fn();
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
it('native code blocks use the registered mono face and stay LTR inside RTL roots (simulator capture regression)',()=>{
 const {Text,StyleSheet}=require('react-native');const {HIGProvider}=require('../../packages/hig/native/src/provider');const {InstallCommand}=require('../../packages/hig/native/src/blocks');
 const tree=mount(React.createElement(HIGProvider,{direction:'rtl',fontFamily:'BloxwapSansRegular',monoFontFamily:'BloxwapMonoRegular'},React.createElement(InstallCommand,{command:'npm i x',onCopy:jest.fn()})));
 const style=text=>StyleSheet.flatten(tree.findAllByType(Text).find(t=>t.props.children===text).props.style);
 for(const text of ['npm i x'])expect(style(text)).toMatchObject({fontFamily:'BloxwapMonoRegular',writingDirection:'ltr'});
});
it('native Menu and Select return focus to their own trigger on close (Android TalkBack regression)',()=>{
 // With TalkBack on the emulator, closing a Menu by Back left focus on the first screen element instead of the trigger.
 const rn=require('react-native');const {Menu}=require('../../packages/hig/native/src/overlay');const {Select}=require('../../packages/hig/native/src/select');
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
it('native InstallCommand shows a copy outcome as a transient toast capsule and mounts no empty status region (iOS audit regression)',async()=>{
 const {Text}=require('react-native');const {InstallCommand}=require('../../packages/hig/native/src/blocks');
 const tree=mount(React.createElement(InstallCommand,{command:'npm i x',onCopy:()=>Promise.resolve()}));
 jest.useFakeTimers();try{
 const {Toast}=require('../../packages/hig/native/src/status');const shown=()=>tree.findAllByType(Text).map(t=>t.props.children);
 expect(tree.findAllByType(Toast)).toHaveLength(0);expect(shown()).toEqual(['npm i x','Copy install command']);
 await act(async()=>{tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function')[0].props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented(){return false;}});});
 expect(shown()).toContain('Copied');expect(tree.findByType(Toast).props.notices).toMatchObject([{message:'Copied',severity:'success'}]);
 const close=tree.findAll(n=>n.props.accessibilityRole==='button'&&n.props.accessibilityLabel==='Dismiss Copied');expect(close.length).toBeGreaterThan(0);
 act(()=>{jest.advanceTimersByTime(4000);});expect(tree.findAllByType(Toast)).toHaveLength(0);
 }finally{jest.useRealTimers();}
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
it('native switch draws the HIG capsule on web as one named switch, not react-native-web\'s Switch',()=>{
 const RN=require('react-native');const os=RN.Platform.OS;Object.defineProperty(RN.Platform,'OS',{value:'web',configurable:true});
 try{const {Switch}=require('../../packages/hig/native/src/switch');const {nativeSrgb}=require('../../packages/hig/tokens/src/index');const changed=jest.fn();
  const flat=n=>RN.StyleSheet.flatten(n.props.style)??{};
  const tree=mount(React.createElement(Switch,{label:'Sound',checked:false,onCheckedChange:changed}));
  const controls=()=>tree.findAll(n=>n.props.accessibilityRole==='switch'&&typeof n.props.onPress==='function');
  expect(controls()).toHaveLength(1);expect(controls()[0].props.accessibilityLabel).toBe('Sound');expect(controls()[0].props.accessibilityState.checked).toBe(false);
  // Views only inside the row, so nothing interactive nests (axe nested-interactive, label and target-size on Expo web).
  expect(tree.findAllByType(RN.Switch)).toHaveLength(0);
  const track=()=>tree.findAll(n=>n.type==='View'&&flat(n).width===40&&flat(n).height===24)[0],thumb=()=>tree.findAll(n=>n.type==='View'&&flat(n).width===18&&flat(n).height===18)[0];
  expect(track().props['aria-hidden']).toBe(true);
  expect(flat(track())).toMatchObject({borderRadius:12,padding:3,backgroundColor:nativeSrgb.nested});expect(flat(thumb())).toMatchObject({backgroundColor:nativeSrgb.text,transform:[{translateX:0}],transitionProperty:'transform'});
  // Space toggles once and ignores key repeat; Enter is RN Web's own press.
  const prevent=jest.fn();act(()=>controls()[0].props.onKeyDown({key:' ',preventDefault:prevent}));act(()=>controls()[0].props.onKeyDown({key:' ',repeat:true,preventDefault:prevent}));
  expect(changed).toHaveBeenCalledTimes(1);expect(changed).toHaveBeenCalledWith(true);expect(prevent).toHaveBeenCalledTimes(2);
  act(()=>root.update(React.createElement(Switch,{label:'Sound',checked:true,onCheckedChange:changed})));
  expect(flat(track())).toMatchObject({backgroundColor:nativeSrgb.nested});expect(tree.findAll(n=>n.type==='View'&&flat(n).transitionProperty==='opacity').map(n=>flat(n).opacity)).toEqual([1]);expect(flat(thumb())).toMatchObject({backgroundColor:nativeSrgb.onAction,transform:[{translateX:16}]});
 }finally{Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});}
});
it('native switch keeps the platform switch in one pressable row on iOS and Android',()=>{
 const RN=require('react-native');const {Switch}=require('../../packages/hig/native/src/switch');
 const tree=mount(React.createElement(Switch,{label:'Sound',checked:true,onCheckedChange:jest.fn()}));
 expect(tree.findAll(n=>n.props.accessibilityRole==='switch'&&typeof n.props.onPress==='function')).toHaveLength(1);
 expect(tree.findByType(RN.Switch).props.value).toBe(true);
});
it('native switch and alert accept token colour roles only (#67)',()=>{
 const {Switch}=require('../../packages/hig/native/src/switch');const {Alert}=require('../../packages/hig/native/src/status');const RN=require('react-native');const {nativeSrgb:colors,withAlpha}=require('../../packages/hig/tokens/dist/index.js');
 const track=props=>{const tree=mount(React.createElement(Switch,{label:'Sound',...props}));const value=tree.findByType(RN.Switch).props.trackColor;act(()=>root.unmount());root=null;return value;};
 expect(track({})).toEqual({true:colors.action,false:colors.nested});
 expect(track({tone:'positive'}).true).toBe(colors.positive);
 // Untyped JS cannot smuggle a raw palette colour through the role prop.
 expect(track({tone:'#123456'}).true).toBe(colors.action);
 // Android paints the thumb from the app theme accent unless HIG sets a token; iOS keeps the native thumb.
 const thumb=()=>{const tree=mount(React.createElement(Switch,{label:'Sound',checked:true}));const value=tree.findByType(RN.Switch).props.thumbColor;act(()=>root.unmount());root=null;return value;};
 expect(thumb()).toBeUndefined();
 const os=RN.Platform.OS;Object.defineProperty(RN.Platform,'OS',{value:'android',configurable:true});
 try{expect(thumb()).toBe(colors.text);}finally{Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});}
 // Severity tints the panel. Its title uses the primary text role.
 const accent=props=>{const tree=mount(React.createElement(Alert,{title:'Result',announce:false,...props}));const style=RN.StyleSheet.flatten(tree.findAll(n=>n.type===RN.View&&n.props.style)[0].props.style);const tone=RN.StyleSheet.flatten(tree.findAll(n=>n.type===RN.Text&&n.props.accessibilityRole==='header')[0].props.style).color;act(()=>root.unmount());root=null;return {...style,tone};};
 const tint=(tone,amount)=>'#'+[1,3,5].map(k=>Math.round(parseInt(colors.surface.slice(k,k+2),16)*(1-amount)+parseInt(tone.slice(k,k+2),16)*amount).toString(16).padStart(2,'0')).join('');
 expect(accent({}).tone).toBe(colors.text);
 expect(accent({severity:'success'}).tone).toBe(colors.text);
 expect(accent({severity:'warning'}).tone).toBe(colors.text);
 expect(accent({severity:'error'}).tone).toBe(colors.text);
 expect(accent({severity:'note'}).tone).toBe(colors.text);
 expect(accent({severity:'tip'}).tone).toBe(colors.text);
 expect(accent({severity:'error',tone:'action'}).tone).toBe(colors.text);
 expect(accent({severity:'error',tone:'rgb(1,2,3)'}).tone).toBe(colors.text);
 // No stroke and no glow: a 10% tone tint of the surface, 6% of text for the neutral default.
 const base=accent({});expect(base.borderWidth).toBeUndefined();expect(base.borderColor).toBeUndefined();expect(base.boxShadow).toBeUndefined();
 expect(base.backgroundColor).toBe(tint(colors.info,0.1));expect(accent({severity:'error'}).backgroundColor).toBe(tint(colors.negative,0.1));
 const neutral=accent({severity:'default'});expect(neutral.tone).toBe(colors.text);expect(neutral.backgroundColor).toBe(tint(colors.text,0.06));
 expect(accent({severity:'default',tone:'warning'}).tone).toBe(colors.text);
});
it('native Text caps font scale from the prop or the provider and readouts pass it through (#67)',()=>{
 const {HIGProvider}=require('../../packages/hig/native/src/provider');const {Text,Heading}=require('../../packages/hig/native/src/surface');const {Text:RNText}=require('react-native');
 const tree=mount(React.createElement(HIGProvider,{maxFontSizeMultiplier:3},React.createElement(Text,{testID:'inherited'},'Prose'),React.createElement(Text,{testID:'capped',maxFontSizeMultiplier:2},'Dense'),React.createElement(Heading,{testID:'heading',maxFontSizeMultiplier:1.5},'Title'),React.createElement(NumberReadout,{value:67234.56,maxFontSizeMultiplier:2})));
 const multiplier=id=>tree.findAllByType(RNText).find(t=>t.props.testID===id).props.maxFontSizeMultiplier;
 expect(multiplier('inherited')).toBe(3);expect(multiplier('capped')).toBe(2);expect(multiplier('heading')).toBe(1.5);
 expect(tree.findAllByType(RNText).find(t=>t.props.style&&JSON.stringify(t.props.style).includes('tabular-nums')).props.maxFontSizeMultiplier).toBe(2);
 if(root)act(()=>root.unmount());const plain=mount(React.createElement(Text,null,'Unscaled default'));expect(plain.findByType(RNText).props.maxFontSizeMultiplier).toBeUndefined();expect(plain.findByType(RNText).props.allowFontScaling).toBeUndefined();
});
it('native Text sets Korean and Chinese runs at the companion face spacing, overridable per script (#67)',()=>{
 const {HIGProvider}=require('../../packages/hig/native/src/provider');const {Text,detectScript,scriptLetterSpacing}=require('../../packages/hig/native/src/surface');const {Text:RNText,StyleSheet}=require('react-native');
 expect(detectScript('Bloxwap 한국어','en-US')).toBe('ko');expect(detectScript('中文 ₿','en-US')).toBe('zh');expect(detectScript('한국어 中文','en-US')).toBe('ko');
 expect(detectScript('「」','ko-KR')).toBe('ko');expect(detectScript('「」','zh-CN')).toBe('zh');expect(detectScript('BTC 0.25','ko')).toBe('latin');
 expect(scriptLetterSpacing).toEqual({ko:0,zh:0});
 const spacing=(element)=>{const tree=mount(element);const values=Object.fromEntries(tree.findAllByType(RNText).filter(t=>t.props.testID).map(t=>[t.props.testID,StyleSheet.flatten(t.props.style).letterSpacing]));act(()=>root.unmount());root=null;return values;};
 const sample=props=>[React.createElement(Text,{key:1,testID:'latin',style:{letterSpacing:1}},'Order details'),React.createElement(Text,{key:2,testID:'ko',style:{letterSpacing:1,fontSize:20}},'한국어'),React.createElement(Text,{key:3,testID:'zh',style:{letterSpacing:1}},'中文'),React.createElement(Text,{key:4,testID:'forced',script:'zh',style:{letterSpacing:1}},'Latin forced'),React.createElement(Text,{key:5,testID:'nested',style:{letterSpacing:1}},'Bloxwap ',React.createElement(RNText,null,'한국어'))].map(e=>React.cloneElement(e,props));
 expect(spacing(React.createElement(React.Fragment,null,...sample()))).toEqual({latin:1,ko:0,zh:0,forced:0,nested:0});
 expect(spacing(React.createElement(HIGProvider,{letterSpacingByScript:{ko:-0.01}},...sample()))).toEqual({latin:1,ko:-0.2,zh:0,forced:0,nested:-0.16});
});
it('native Android slider exposes set-progress through HIGAdjustableView and keeps steps and disabled rejection (#71)',()=>{
 jest.isolateModules(()=>{
  const R=require('react');const {create,act:run}=require('react-test-renderer');const RN=require('react-native');
  const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS'),original=RN.UIManager.hasViewManagerConfig;
  Object.defineProperty(RN.Platform,'OS',{value:'android',configurable:true});RN.UIManager.hasViewManagerConfig=name=>name==='HIGAdjustableView';
  try{const {Slider}=require('../../packages/hig/native/src/slider');const change=jest.fn();let r;
   run(()=>{r=create(R.createElement(Slider,{label:'Volume',defaultValue:25,onValueChange:change}));});
   const node=()=>r.root.findAll(n=>n.type==='HIGAdjustableView')[0];
   expect(node().props.accessibilityRole).toBe('adjustable');expect(node().props.accessibilityValue).toEqual({min:0,max:100,now:25});
   expect(node().props.accessibilityActions.map(a=>a.name)).toEqual(['increment','decrement']);
   const act=nativeEvent=>run(()=>node().props.onAccessibilityAction({nativeEvent}));
   act({actionName:'setProgress',value:80});expect(node().props.accessibilityValue.now).toBe(80);
   act({actionName:'setProgress',value:80});act({actionName:'setProgress',value:61.6});act({actionName:'setProgress',value:250});act({actionName:'setProgress',value:Number.NaN});act({actionName:'setProgress'});
   act({actionName:'decrement'});act({actionName:'increment'});
   // One update per accepted request: repeats, NaN and missing values change nothing; out-of-range clamps; steps stay 5%.
   expect(change.mock.calls.map(c=>c[0])).toEqual([80,62,100,95,100]);
   run(()=>r.unmount());const disabled=jest.fn();run(()=>{r=create(R.createElement(Slider,{label:'Volume',value:30,disabled:true,onValueChange:disabled}));});
   expect(node().props.accessibilityState).toEqual({disabled:true});act({actionName:'setProgress',value:80});act({actionName:'increment'});expect(disabled).not.toHaveBeenCalled();run(()=>r.unmount());
  }finally{Object.defineProperty(RN.Platform,'OS',descriptor);RN.UIManager.hasViewManagerConfig=original;}
 });
});
it('native Android slider falls back to a plain adjustable View when HIGAdjustableView is not linked (Expo Go)',()=>{
 jest.isolateModules(()=>{
  const R=require('react');const {create,act:run}=require('react-test-renderer');const RN=require('react-native');
  const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS'),original=RN.UIManager.hasViewManagerConfig;
  Object.defineProperty(RN.Platform,'OS',{value:'android',configurable:true});RN.UIManager.hasViewManagerConfig=()=>false;
  try{const {Slider}=require('../../packages/hig/native/src/slider');let r;run(()=>{r=create(R.createElement(Slider,{label:'Volume',value:20}));});
   expect(r.root.findAll(n=>n.type==='HIGAdjustableView')).toHaveLength(0);expect(r.root.findAll(n=>n.type===RN.View&&n.props.accessibilityRole==='adjustable')).toHaveLength(1);run(()=>r.unmount());
  }finally{Object.defineProperty(RN.Platform,'OS',descriptor);RN.UIManager.hasViewManagerConfig=original;}
 });
});

it('retains each filter chip animation value across parent updates',()=>{
 const {Animated}=require('react-native');
 const {Filter}=require('../../packages/hig/native/src/radio-group');
 const options=Array.from({length:20},(_,i)=>({value:String(i),label:String(i)}));
 const OriginalValue=Animated.Value;
 const constructor=jest.spyOn(Animated,'Value').mockImplementation(value=>new OriginalValue(value));
 try{
  mount(React.createElement(Filter,{label:'Filters',options,value:'0'}));
  expect(constructor.mock.calls.length).toBeGreaterThanOrEqual(options.length);
  constructor.mockClear();
  for(let i=0;i<10;i++)act(()=>root.update(React.createElement(Filter,{label:'Filters '+i,options,value:'0'})));
  expect(constructor).toHaveBeenCalledTimes(0);
 }finally{constructor.mockRestore();}
});

it('windows long search results and keeps the full result count accessible',()=>{
 const {Search}=require('../../packages/hig/native/src/navigation');
 const {FlatList}=require('react-native');
 const select=jest.fn();
 const results=Array.from({length:1000},(_,index)=>({id:String(index),label:'Market '+index,onSelect:()=>select(index)}));
 const tree=mount(React.createElement(Search,{query:'Market',onQueryChange:jest.fn(),results}));
 const buttons=tree.findAllByType(Button);
 expect(buttons.length).toBeGreaterThan(0);
 expect(buttons.length).toBeLessThan(40);
 expect(tree.findByType(FlatList).props.data).toBe(results);
 expect(tree.findAll(n=>n.props.accessibilityLiveRegion==='polite'&&typeof n.props.children==='string')[0].props.children).toMatch(/1,?000/);
 act(()=>buttons[0].props.onPress());
 expect(select).toHaveBeenCalledWith(0);
});

it.each([40,1000])('keeps %i search results stable when only the query changes',count=>{
 const {Search}=require('../../packages/hig/native/src/navigation');
 const label=jest.fn(index=>'Market '+index);
 const results=Array.from({length:count},(_,index)=>({id:String(index),get label(){return label(index);},onSelect:jest.fn()}));
 const onQueryChange=jest.fn();
 const search=query=>React.createElement(Search,{query,onQueryChange,results});
 mount(search(''));
 expect(label).toHaveBeenCalled();
 label.mockClear();
 for(const query of ['m','ma','mar','mark','market'])act(()=>root.update(search(query)));
 expect(label).toHaveBeenCalledTimes(0);
});

it('keeps radio options rendered when only the group label changes',()=>{
 const label=jest.fn(index=>'Option '+index);
 const options=Array.from({length:40},(_,index)=>({value:String(index),get label(){return label(index);}}));
 const change=jest.fn();
 const group=name=>React.createElement(RadioGroup,{label:name,options,defaultValue:'0',onValueChange:change});
 mount(group('Options'));
 label.mockClear();
 for(let i=0;i<10;i++)act(()=>root.update(group('Options '+i)));
 expect(label).toHaveBeenCalledTimes(0);
 const radio=root.root.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function');
 act(()=>radio.find(n=>n.props.accessibilityLabel==='Option 1').props.onPress());
 expect(change).toHaveBeenCalledWith('1');
});

it('redraws only the two changed native segment labels after selection',()=>{
 const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
 const {HIGProvider}=require('../../packages/hig/native/src/provider');
 const label=jest.fn(index=>'Segment '+index);
 const options=Array.from({length:8},(_,index)=>({value:String(index),get label(){return label(index);}}));
 const change=jest.fn();
 const group=onValueChange=>React.createElement(HIGProvider,{reducedMotion:true},React.createElement(SegmentedControl,{label:'Chart range',options,defaultValue:'0',onValueChange}));
 const tree=mount(group(change));
 const radio=tree.findAll(n=>n.props.accessibilityLabel==='Segment 7'&&typeof n.props.onPress==='function')[0];
 label.mockClear();
 act(()=>radio.props.onPress());
 expect(label).toHaveBeenCalledTimes(4);
 expect(change).toHaveBeenCalledWith('7');
 const replacement=jest.fn();
 act(()=>root.update(group(replacement)));
 const next=tree.findAll(n=>n.props.accessibilityLabel==='Segment 3'&&typeof n.props.onPress==='function')[0];
 act(()=>next.props.onPress());
 expect(replacement).toHaveBeenCalledWith('3');
 expect(change).toHaveBeenCalledTimes(1);
});

it('keeps native list validation and cell rendering stable during pagination',()=>{
 const {FlatList,Text}=require('react-native');
 const {List}=require('../../packages/hig/native/src/data');
 const items=Array.from({length:10000},(_,index)=>String(index));
 const keyFor=jest.fn(id=>id);
 const render=jest.fn(id=>React.createElement(Text,null,id));
 const element=loading=>React.createElement(List,{items,keyFor,render,loading});
 const tree=mount(element(false));
 const renderItem=tree.findByType(FlatList).props.renderItem;
 keyFor.mockClear();
 render.mockClear();
 act(()=>root.update(element(true)));
 const list=tree.findByType(FlatList);
 expect(list.props.accessibilityState.busy).toBe(true);
 expect(list.props.renderItem).toBe(renderItem);
 expect(keyFor.mock.calls.length).toBeLessThan(100);
 expect(render).not.toHaveBeenCalled();
});

it('keeps visible native cells stable when a page arrives and refreshes an edited cell',()=>{
 const {Text}=require('react-native');
 const {List}=require('../../packages/hig/native/src/data');
 const items=Array.from({length:40},(_,id)=>({id,value:id}));
 const keyFor=item=>String(item.id);
 const render=jest.fn(item=>React.createElement(Text,null,item.value));
 const list=rows=>React.createElement(List,{items:rows,keyFor,render});
 mount(list(items));
 expect(render.mock.calls.some(([item])=>item.id===7)).toBe(true);
 render.mockClear();
 const appended=[...items,{id:40,value:40}];
 act(()=>root.update(list(appended)));
 expect(render).not.toHaveBeenCalled();
 act(()=>root.update(list(appended.map(item=>item.id===7?{...item,value:77}:item))));
 expect(render.mock.calls.map(([item])=>item.value)).toEqual([77]);
});

it('uses a compact window only when offscreen row offsets are available',()=>{
 const {FlatList,Text}=require('react-native');
 const {List}=require('../../packages/hig/native/src/data');
 const resolveFromReactNative=require('node:module').createRequire(require.resolve('react-native/package.json'));
 const {computeWindowedRenderLimits}=require(resolveFromReactNative.resolve('@react-native/virtualized-lists/Lists/VirtualizeUtils'));
 const items=Array.from({length:1000},(_,index)=>String(index));
 const props={items,keyFor:String,render:id=>React.createElement(Text,null,id)};
 const tree=mount(React.createElement(List,props));
 const list=()=>tree.findByType(FlatList);
 expect(list().props.windowSize).toBeUndefined();
 expect(list().props.maxToRenderPerBatch).toBeUndefined();
 const getItemLayout=(_,index)=>({index,offset:index*60,length:60});
 act(()=>root.update(React.createElement(List,{...props,getItemLayout})));
 expect(list().props.getItemLayout).toBe(getItemLayout);
 const {ListFooterComponent,ListEmptyComponent,accessibilityState}=list().props;
 expect(ListFooterComponent).toBeNull();
 for(const viewport of [480,720]){
  act(()=>list().props.onLayout({nativeEvent:{layout:{height:viewport}}}));
  expect(list().props.ListFooterComponent).toBe(ListFooterComponent);
  expect(list().props.ListEmptyComponent).toBe(ListEmptyComponent);
  expect(list().props.accessibilityState).toBe(accessibilityState);
  const limits=windowSize=>computeWindowedRenderLimits({data:items,getItemCount:data=>data.length},list().props.maxToRenderPerBatch,windowSize,
   {first:0,last:999},{getCellMetricsApprox:index=>({index,offset:index*60,length:60})},{dt:16,offset:30001,velocity:1,visibleLength:viewport,zoomScale:1});
  const {windowSizeOrDefault}=require(resolveFromReactNative.resolve('@react-native/virtualized-lists/Lists/VirtualizedListProps'));
  const previous=limits(windowSizeOrDefault(undefined));
  expect(previous.last-previous.first+1).toBe(21*viewport/60+1);
  const window=limits(list().props.windowSize);
  expect(window).toEqual({first:496,last:500+viewport/60+4});
  expect(list().props.maxToRenderPerBatch).toBe(4);
  expect(list().props.updateCellsBatchingPeriod).toBe(16);
 }
});

it.each([40,1000])('refreshes one changed native search result among %i',count=>{
 const {Search}=require('../../packages/hig/native/src/navigation');
 const reads=jest.fn(),oldAction=jest.fn(),newAction=jest.fn();
 const results=Array.from({length:count},(_,i)=>({id:String(i),get label(){reads(i);return 'Result '+i;},onSelect:oldAction}));
 const tree=items=>React.createElement(Search,{query:'result',onQueryChange:()=>{},results:items});
 const view=mount(tree(results));
 reads.mockClear();
 act(()=>root.update(tree([{id:'0',get label(){reads(0);return 'Updated result';},onSelect:newAction},...results.slice(1)])));
 expect(reads.mock.calls).toEqual([[0]]);
 const first=view.findAllByType(Button)[0];expect(first.props.children).toBe('Updated result');
 act(()=>first.props.onPress());expect(newAction).toHaveBeenCalledTimes(1);expect(oldAction).not.toHaveBeenCalled();
});

it('skips the virtualized list on an unrelated host update and reflects changed items',()=>{
 const {FlatList,Text}=require('react-native');
 const {List}=require('../../packages/hig/native/src/data');
 const items=Array.from({length:1000},(_,index)=>({id:String(index),name:'Item '+index}));
 const keyFor=item=>item.id;
 const render=jest.fn(item=>React.createElement(Text,null,item.name));
 const draw=jest.spyOn(FlatList.prototype,'render');
 const scene=(data,label)=>React.createElement(React.Fragment,null,
  React.createElement(Text,null,label),React.createElement(List,{items:data,keyFor,render}));
 try{
  mount(scene(items,'Connecting'));
  expect(draw).toHaveBeenCalled();
  draw.mockClear();
  render.mockClear();
  act(()=>root.update(scene(items,'Connected')));
  expect(draw).not.toHaveBeenCalled();
  expect(render).not.toHaveBeenCalled();
  act(()=>root.update(scene([{...items[0],name:'Updated'},...items.slice(1)],'Connected')));
  expect(draw).toHaveBeenCalled();
  expect(render).toHaveBeenCalledTimes(1);
  expect(root.root.findAllByType(Text).some(node=>node.props.children==='Updated')).toBe(true);
 }finally{draw.mockRestore();}
});

it('updates translated list status without rendering the FlatList again',()=>{
 const {FlatList,Text}=require('react-native');
 const {HIGProvider}=require('../../packages/hig/native/src/provider');
 const {List}=require('../../packages/hig/native/src/data');
 const items=Array.from({length:1000},(_,index)=>String(index));
 const list=React.createElement(List,{items,keyFor:id=>id,render:id=>React.createElement(Text,null,id),loading:true});
 const draw=jest.spyOn(FlatList.prototype,'render');
 try{
  mount(React.createElement(HIGProvider,null,list));
  expect(draw).toHaveBeenCalled();
  draw.mockClear();
  act(()=>root.update(React.createElement(HIGProvider,{messages:{loadingItems:'Fetching balances'}},list)));
  expect(root.root.findAllByType(Text).some(node=>node.props.children==='Fetching balances')).toBe(true);
  expect(draw).not.toHaveBeenCalled();
 }finally{draw.mockRestore();}
});

it.each(['List','Search'])('%s renders only the edited virtualized cell on a data refresh',component=>{
 const {Text}=require('react-native');
 const CellRenderer=require(require.resolve('@react-native/virtualized-lists/Lists/VirtualizedListCellRenderer',{paths:[require.resolve('react-native')]})).default;
 const {List}=require('../../packages/hig/native/src/data');
 const {Search}=require('../../packages/hig/native/src/navigation');
 const onSelect=jest.fn();
 const rows=Array.from({length:1000},(_,index)=>({id:String(index),label:'Result '+index,onSelect}));
 const keyFor=item=>item.id;
 const render=item=>React.createElement(Text,null,item.label);
 const scene=items=>component==='List'?React.createElement(List,{items,keyFor,render}):React.createElement(Search,{results:items,query:'',onQueryChange:onSelect});
 const draw=jest.spyOn(CellRenderer.prototype,'render');
 try{
  mount(scene(rows));
  draw.mockClear();
  const edited=rows.slice();
  edited[2]={...rows[2],label:'Updated result'};
  act(()=>root.update(scene(edited)));
  expect(draw.mock.instances.map(cell=>cell.props.item.id)).toEqual(['2']);
 }finally{draw.mockRestore();}
});

it('formats trade reviews on demand and refreshes the amount on reopen',()=>{
 const {TradeEntry}=require('../../packages/hig/native/src/blocks');
 const {HIGProvider}=require('../../packages/hig/native/src/provider');
 const description=jest.fn((amount,asset)=>amount+' '+asset);
 const messages={confirmOrderDescription:description};
 const onConfirm=jest.fn();
 const scene=amount=>React.createElement(HIGProvider,{messages},React.createElement(TradeEntry,{amount,asset:'BTC',available:'1 BTC',onAmountChange:()=>{},onConfirm}));
 const view=mount(scene('0.1'));
 const press=label=>act(()=>view.findAllByType(Button).find(button=>button.props.children===label).props.onPress());
 act(()=>root.update(scene('0.2')));
 expect(description).not.toHaveBeenCalled();
 press('Review order');
 expect(description).toHaveBeenLastCalledWith('0.2','BTC');
 act(()=>root.update(scene('0.3')));
 expect(description).toHaveBeenLastCalledWith('0.3','BTC');
 press('Confirm order');expect(onConfirm).toHaveBeenCalledTimes(1);
 act(()=>view.findByType(Modal).props.onRequestClose());
 description.mockClear();
 act(()=>root.update(scene('0.4')));
 expect(description).not.toHaveBeenCalled();
 press('Review order');
 expect(description).toHaveBeenLastCalledWith('0.4','BTC');
});

it('keeps the native copy handler stable and updates the inherited monospace face and translation',()=>{
 const {InstallCommand}=require('../../packages/hig/native/src/blocks');
 const {HIGProvider}=require('../../packages/hig/native/src/provider');
 const {Text,StyleSheet}=require('react-native');
 const child=React.createElement(HIGProvider,null,React.createElement(InstallCommand,{command:'npm i',onCopy:jest.fn()}));
 const wrap=props=>React.createElement(HIGProvider,props,child);
 const tree=mount(wrap({monoFontFamily:'Mono A'}));
 const press=tree.findByType(Button).props.onPress;
 act(()=>root.update(wrap({monoFontFamily:'Mono A',density:'compact'})));
 expect(tree.findByType(Button).props.onPress).toBe(press);
 act(()=>root.update(wrap({monoFontFamily:'Mono B',messages:{copyInstallCommand:'Copier'}})));
 expect(tree.findByType(Button).props.children).toBe('Copier');
 const text=tree.findAllByType(Text).find(node=>node.props.selectable);
 expect(StyleSheet.flatten(text.props.style)).toMatchObject({fontFamily:'Mono B',writingDirection:'ltr'});
});

it('keeps list empty and footer elements stable on density changes and updates their translations',()=>{
 const {HIGProvider}=require('../../packages/hig/native/src/provider');
 const {List}=require('../../packages/hig/native/src/data');
 const {Text}=require('../../packages/hig/native/src/surface');
 const list=React.createElement(List,{items:[],keyFor:String,render:String,onLoadMore:jest.fn()});
 const wrap=props=>React.createElement(HIGProvider,props,list);
 const messages={noItems:'Empty',loadMore:'More'};
 const tree=mount(wrap({messages,density:'comfortable'}));
 const empty=tree.findAllByType(Text).find(n=>n.props.children==='Empty').props;
 const more=tree.findByType(Button).props;
 act(()=>root.update(wrap({messages,density:'compact'})));
 expect(tree.findAllByType(Text).find(n=>n.props.children==='Empty').props).toBe(empty);
 expect(tree.findByType(Button).props).toBe(more);
 act(()=>root.update(wrap({messages:{noItems:'Vide',loadMore:'Suite'}})));
 expect(tree.findAllByType(Text).some(n=>n.props.children==='Vide')).toBe(true);
 expect(tree.findByType(Button).props.children).toBe('Suite');
});

it('tracks exact row windows from list layout without a global dimension listener',()=>{
 const {Dimensions,FlatList,Text}=require('react-native');
 const {List}=require('../../packages/hig/native/src/data');
 const items=Array.from({length:1000},(_,i)=>String(i));
 const listener=jest.spyOn(Dimensions,'addEventListener');
 try{
  const view=mount(React.createElement(List,{items,keyFor:String,render:item=>React.createElement(Text,null,item),getItemLayout:(_,index)=>({index,length:60,offset:index*60})}));
  expect(listener.mock.calls.filter(([event])=>event==='change')).toHaveLength(0);
  const list=()=>view.findByType(FlatList).props;
  act(()=>list().onLayout({nativeEvent:{layout:{height:300}}}));
  expect(list().windowSize).toBeCloseTo(2.6);
 }finally{listener.mockRestore();}
});

it('shares the native motion listener and keeps a newer change over a pending initial query',async()=>{
 const {AccessibilityInfo}=require('react-native'),{HIGProvider,useReducedMotion}=require('../../packages/hig/native/src/provider');
 const seen=new Map(),remove=jest.fn();let change,resolve;
 const oldSubscribe=AccessibilityInfo.addEventListener,oldQuery=AccessibilityInfo.isReduceMotionEnabled;
 const subscribe=AccessibilityInfo.addEventListener=jest.fn((_event,notify)=>{change=notify;return {remove};});
 const query=AccessibilityInfo.isReduceMotionEnabled=jest.fn(()=>new Promise(done=>{resolve=done;}));
 function Probe({id}){seen.set(id,useReducedMotion());return null;}
 const tree=ids=>React.createElement(React.Fragment,null,ids.map(id=>React.createElement(HIGProvider,{key:id},React.createElement(Probe,{id}))));
 try{
  const ids=Array.from({length:40},(_,i)=>i);
  mount(tree(ids));expect(subscribe).toHaveBeenCalledTimes(1);expect(query).toHaveBeenCalledTimes(1);
  act(()=>change(true));await act(async()=>{resolve(false);});
  expect(ids.every(id=>seen.get(id)===true)).toBe(true);
  act(()=>root.update(tree([1,40])));expect(seen.get(40)).toBe(true);expect(remove).not.toHaveBeenCalled();
  act(()=>root.update(tree([])));expect(remove).toHaveBeenCalledTimes(1);
  act(()=>root.update(tree([41])));expect(query).toHaveBeenCalledTimes(2);
 }finally{act(()=>root.unmount());root=null;AccessibilityInfo.addEventListener=oldSubscribe;AccessibilityInfo.isReduceMotionEnabled=oldQuery;}
});
