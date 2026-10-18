const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,TextInput,Switch:RNSwitch,StyleSheet,Platform,AccessibilityInfo,I18nManager}=require('react-native');
const {HIGProvider,useHIG,directionForLocale}=require('../../packages/native/src/provider');
const {Button}=require('../../packages/native/src/button');
const {Text,Surface}=require('../../packages/native/src/surface');
const {Alert}=require('../../packages/native/src/status');
const {Switch}=require('../../packages/native/src/switch');
const {Slider}=require('../../packages/native/src/slider');
const {Input}=require('../../packages/native/src/field');
const {nativeColors,nativeSrgb}=require('@bloxwap/hig-tokens');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}

it.each(['Working','En cours','처리 중','جارٍ التنفيذ',''])('keeps the visible busy Button name with suffix %s (#94)',busy=>{
 const tree=mount(h(HIGProvider,{messages:{busy}},h(Button,{busy:true},'Log ', 'out')));
 const control=tree.findAll(node=>node.props.accessibilityRole==='button')[0];
 expect(control.props.accessibilityLabel).toBe(`Log out${busy?` · ${busy}`:''}`);
 expect(control.props.accessibilityState).toEqual({busy:true,disabled:true});
 act(()=>root.update(h(Button,{busy:true,accessibilityLabel:'Host label'},'Log out')));
 expect(root.root.findAll(node=>node.props.accessibilityRole==='button')[0].props.accessibilityLabel).toBe('Host label');
});

it('applies registered families, script tracking, and text scale caps to both button runs (#92)',()=>{
 const example=cap=>h(HIGProvider,{fontFamily:'Sans',fontFamilies:{600:'SansSemiBold'},maxFontSizeMultiplier:2,letterSpacingByScript:{ko:-.05}},h(Button,{busy:true,busyLabel:'처리 중',maxFontSizeMultiplier:cap},'확인'));
 const tree=mount(example(undefined));
 for(const node of tree.findAllByType(RNText)){
  expect(node.props.maxFontSizeMultiplier).toBe(2);
  expect(StyleSheet.flatten(node.props.style)).toMatchObject({fontFamily:'SansSemiBold',fontWeight:'normal',letterSpacing:-.8});
 }
 act(()=>root.update(example(3)));
 expect(root.root.findAllByType(RNText).map(node=>node.props.maxFontSizeMultiplier)).toEqual([3,3]);
});

it('announces mixed ReactNode titles with the visible whitespace (#102)',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS');Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});
 const original=AccessibilityInfo.announceForAccessibilityWithOptions;
 const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();
 try{mount(h(Alert,{title:h(React.Fragment,null,'Display-only ',h(Text,null,'value'),' strings')},h(Text,null,'Read  carefully.')));expect(announce).toHaveBeenLastCalledWith('Display-only value strings. Read carefully.',{queue:true});}
 finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}
});

it('uses and inherits the canonical P3 palette throughout native controls (#93)',()=>{
 let env;function Probe(){env=useHIG();return null;}
 const tree=mount(h(HIGProvider,{colorSpace:'display-p3'},h(HIGProvider,null,h(Probe),h(Button,null,'Confirm'),h(Switch,{label:'Enabled',tone:'warning'}),h(Alert,{title:'Failure',severity:'error'}),h(Input,{testID:'input'}),h(Surface,{testID:'surface'}))));
 expect(env.colors).toBe(nativeColors.iosDisplayP3);
 expect(tree.findByType(RNSwitch).props.trackColor.true).toBe(nativeColors.iosDisplayP3.warning);
 expect(StyleSheet.flatten(tree.findByType(TextInput).props.style).color).toBe(env.colors.text);
 expect(tree.findAllByType(Surface).some(node=>StyleSheet.flatten(node.props.style)?.borderColor===env.colors.negative)).toBe(true);
 const buttonStyle=tree.findAll(node=>node.props.accessibilityRole==='button')[0].props.style;
 expect(StyleSheet.flatten(typeof buttonStyle==='function'?buttonStyle({pressed:false}):buttonStyle).backgroundColor).toBe(env.colors.action);
 act(()=>root.update(h(HIGProvider,{colorSpace:'srgb'},h(Probe))));expect(env.colors).toBe(nativeSrgb);
});

it('uses locale direction when Android falsely reports LTR, preserving explicit overrides (#86)',()=>{
 const original=I18nManager.isRTL;I18nManager.isRTL=false;
 let env;function Probe(){env=useHIG();return null;}
 try{
  mount(h(HIGProvider,{locale:'ar-EG'},h(Probe)));expect(env.direction).toBe('rtl');
  act(()=>root.update(h(HIGProvider,{locale:'he-IL'},h(Probe))));expect(env.direction).toBe('rtl');
  act(()=>root.update(h(HIGProvider,{locale:'ar-EG',direction:'ltr'},h(Probe))));expect(env.direction).toBe('ltr');
  expect(directionForLocale('az-Arab')).toBe('rtl');expect(directionForLocale('az-Latn')).toBe('ltr');
 }finally{I18nManager.isRTL=original;}
});
it('infers native app direction without changing the default number-formatting locale (#86)',()=>{
 const original=I18nManager.isRTL;I18nManager.isRTL=false;
 const dateTime=jest.spyOn(Intl,'DateTimeFormat').mockImplementation(()=>({resolvedOptions:()=>({locale:'ar-EG'})}));
 let env;function Probe(){env=useHIG();return null;}
 try{mount(h(HIGProvider,null,h(Probe)));expect(env.direction).toBe('rtl');expect(env.locale).toBe('en-US');}
 finally{I18nManager.isRTL=original;dateTime.mockRestore();}
});

it('labels native Slider adjustments from the host catalog and rejects disabled adjustments (#87)',()=>{
 const change=jest.fn();const example=disabled=>h(HIGProvider,{messages:{increment:'Augmenter',decrement:'Diminuer'}},h(Slider,{label:'Volume',value:40,disabled,onValueChange:change}));
 const tree=mount(example(false));const control=tree.find(node=>typeof node.props.onAccessibilityAction==='function'&&node.props.accessibilityRole==='adjustable');
 expect(control.props.accessibilityActions).toEqual([{name:'increment',label:'Augmenter'},{name:'decrement',label:'Diminuer'}]);
 act(()=>control.props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(change).toHaveBeenLastCalledWith(45);
 act(()=>root.update(example(true)));change.mockClear();act(()=>root.root.find(node=>typeof node.props.onAccessibilityAction==='function'&&node.props.accessibilityRole==='adjustable').props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(change).not.toHaveBeenCalled();
});
