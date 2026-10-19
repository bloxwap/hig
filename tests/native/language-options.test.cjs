const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,StyleSheet}=require('react-native');
const {HIGProvider}=require('../../packages/native/src/provider');
const {RadioGroup}=require('../../packages/native/src/radio-group');
const {Text}=require('../../packages/native/src/surface');
const h=React.createElement;
const fontFamiliesByScript={latin:{400:'SansRegular',600:'SansSemiBold'},ko:{400:'KRRegular',600:'KRSemiBold'},zh:{400:'SCRegular',600:'SCSemiBold'}};
const options=[{value:'ko',label:'한국어',description:'Korean',lang:'ko-KR'},{value:'zh',label:'简体中文',description:'Chinese',lang:'zh-Hans'},{value:'en',label:'English'}];
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}
function radios(tree){const controls=tree.findAll(node=>node.props.accessibilityRole==='radio'&&typeof node.props.onPress==='function');expect(controls).toHaveLength(3);return controls;}
function style(node){return StyleSheet.flatten(node.props.style);}

it('renders native names in registered companion faces and translated descriptions in the app face (#119)',()=>{
 const tree=mount(h(HIGProvider,{locale:'en-US',fontFamily:'SansRegular',fontFamilies:{400:'SansRegular'},fontFamiliesByScript},h(RadioGroup,{label:'Language',options,defaultValue:'ko'})));
 const [korean,chinese,english]=radios(tree);
 expect(korean.props).toMatchObject({accessible:true,accessibilityLabel:'한국어',accessibilityHint:'Korean',accessibilityLanguage:'ko-KR',accessibilityState:{checked:true,disabled:false},'aria-checked':true});
 expect(chinese.props.accessibilityLanguage).toBe('zh-Hans');expect(english.props.accessibilityHint).toBeUndefined();
 const runs=korean.findAllByType(RNText);const native=runs.find(node=>node.props.children==='한국어'),translated=runs.find(node=>node.props.children==='Korean');
 expect(style(native)).toMatchObject({fontFamily:'KRRegular',fontWeight:'normal',letterSpacing:0});
 expect(native.props.accessibilityLanguage).toBe('ko-KR');expect(native.props.accessible).toBe(false);
 expect(style(translated)).toMatchObject({fontFamily:'SansRegular',fontSize:14,lineHeight:20});
 expect(translated.props.accessibilityLanguage).toBe('en-US');
 expect(style(chinese.findAllByType(RNText).find(node=>node.props.children==='简体中文')).fontFamily).toBe('SCRegular');
 expect(tree.findAll(node=>node.props.accessibilityRole==='radiogroup')[0].props.accessibilityLabel).toBe('Language');
});

it('accepts the explicit native accessibility activate action once and rejects unrelated actions (#119)',()=>{
 const changed=jest.fn(),emit=jest.fn();const tree=mount(h(HIGProvider,{feedback:{emit}},h(RadioGroup,{label:'Language',options,defaultValue:'en',onValueChange:changed})));
 expect(radios(tree)[0].props.accessibilityActions).toContainEqual({name:'activate'});
 act(()=>radios(tree)[0].props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 expect(changed).toHaveBeenCalledTimes(1);expect(changed).toHaveBeenCalledWith('ko');
 expect(radios(tree)[0].props.accessibilityState.checked).toBe(true);expect(emit).toHaveBeenCalledTimes(1);expect(emit.mock.calls[0][0].intent).toBe('selection');
 act(()=>radios(tree)[0].props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 act(()=>radios(tree)[1].props.onAccessibilityAction({nativeEvent:{actionName:'longpress'}}));
 expect(changed).toHaveBeenCalledTimes(1);expect(emit).toHaveBeenCalledTimes(1);
 act(()=>radios(tree)[1].props.onPress());expect(changed).toHaveBeenLastCalledWith('zh');
});

it.each([true,false])('blocks touch and accessibility activation for disabled group %s and options (#119)',disabled=>{
 const changed=jest.fn();const tree=mount(h(RadioGroup,{label:'Language',disabled,options:options.map(option=>({...option,disabled:!disabled})),onValueChange:changed}));
 for(const radio of radios(tree)){
  expect(radio.props.disabled).toBe(true);expect(radio.props.accessibilityState.disabled).toBe(true);expect(radio.props['aria-disabled']).toBe(true);
  act(()=>radio.props.onPress());act(()=>radio.props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 }
 expect(changed).not.toHaveBeenCalled();
});

it('keeps controlled selection owned by the host for either activation path (#119)',()=>{
 const changed=jest.fn();const example=value=>h(RadioGroup,{label:'Language',value,options,onValueChange:changed});const tree=mount(example('en'));
 act(()=>radios(tree)[0].props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 expect(changed).toHaveBeenCalledWith('ko');expect(radios(tree)[2].props.accessibilityState.checked).toBe(true);
 act(()=>root.update(example('ko')));expect(radios(root.root)[0].props.accessibilityState.checked).toBe(true);
});

it('routes Text by its glyphs across app locales, using language for shared punctuation and inherited script maps (#119)',()=>{
 const tree=mount(h(HIGProvider,{locale:'zh-CN',fontFamiliesByScript},h(HIGProvider,{locale:'en-US'},
  h(Text,{testID:'ko'},'한국어'),h(Text,{testID:'zh'},'中文'),h(Text,{testID:'latin'},'English'),
  h(Text,{testID:'ko-punctuation',accessibilityLanguage:'ko-KR'},'（）'),h(Text,{testID:'zh-punctuation',accessibilityLanguage:'zh-CN'},'（）'),
  h(Text,{testID:'han-in-ko',accessibilityLanguage:'ko-KR'},'漢字'))));
 const actual=Object.fromEntries(tree.findAllByType(RNText).map(node=>[node.props.testID,style(node).fontFamily]));
 expect(actual).toEqual({ko:'KRRegular',zh:'SCRegular',latin:'SansRegular','ko-punctuation':'KRRegular','zh-punctuation':'SCRegular','han-in-ko':'SCRegular'});
});

it('keeps static script weights, explicit script/family overrides, scale caps and the legacy family fallback (#119)',()=>{
 const tree=mount(h(HIGProvider,{fontFamilies:{700:'LegacyBold'},fontFamiliesByScript,maxFontSizeMultiplier:2},
  h(Text,{testID:'nearest',style:{fontWeight:'bold'}},'한국어'),h(Text,{testID:'script',script:'zh',style:{fontWeight:'600'}},'한국어'),
  h(Text,{testID:'host',style:{fontFamily:'HostMono',fontWeight:'bold'},maxFontSizeMultiplier:3},'한국어')));
 const runs=Object.fromEntries(tree.findAllByType(RNText).map(node=>[node.props.testID,node]));
 expect(style(runs.nearest)).toMatchObject({fontFamily:'KRSemiBold',fontWeight:'normal'});expect(runs.nearest.props.maxFontSizeMultiplier).toBe(2);
 expect(style(runs.script).fontFamily).toBe('SCSemiBold');
 expect(style(runs.host)).toMatchObject({fontFamily:'HostMono',fontWeight:'bold'});expect(runs.host.props.maxFontSizeMultiplier).toBe(3);
 act(()=>root.update(h(HIGProvider,{fontFamilies:{700:'LegacyBold'}},h(Text,{style:{fontWeight:'bold'}},'한국어'))));
 expect(style(root.root.findByType(RNText))).toMatchObject({fontFamily:'LegacyBold',fontWeight:'normal'});
});
