const React=require('react');
const {act,create}=require('react-test-renderer');
const {View,Text:RNText,StyleSheet}=require('react-native');
const {nativeSrgb,nativeMetrics}=require('@bloxwap/hig-tokens');
const {HIGProvider}=require('../../packages/native/src/provider');
const {EmptyState}=require('../../packages/native/src/status');
const {Button}=require('../../packages/native/src/button');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}

it('retains default Surface anatomy, provider text/palette, heading role and supplied action',()=>{
 const press=jest.fn();const tree=mount(h(HIGProvider,{direction:'rtl',fontFamily:'HostSans',maxFontSizeMultiplier:1.6},h(EmptyState,{title:'No markets',description:'Try another category',action:h(Button,{onPress:press},'Browse all')})));
 const surface=tree.findAllByType(View).find(node=>StyleSheet.flatten(node.props.style)?.backgroundColor===nativeSrgb.surface);
 expect(StyleSheet.flatten(surface.props.style)).toMatchObject({backgroundColor:nativeSrgb.surface,direction:'rtl',padding:nativeMetrics.space.xl,borderRadius:nativeMetrics.radius.xl});
 const title=tree.findAllByType(RNText).find(node=>node.props.children==='No markets');
 expect(title.props.accessibilityRole).toBe('header');expect(title.props.maxFontSizeMultiplier).toBe(1.6);
 expect(StyleSheet.flatten(title.props.style)).toMatchObject({color:nativeSrgb.text,fontFamily:'HostSans',fontSize:24,lineHeight:30,fontWeight:'600'});
 expect(tree.findAllByType(RNText).find(node=>node.props.children==='Try another category').props.maxFontSizeMultiplier).toBe(1.6);
 act(()=>tree.findByType(Button).props.onPress());expect(press).toHaveBeenCalledTimes(1);
});

it.each([undefined,''])('omits the supporting text when description is %p',description=>{
 const tree=mount(h(EmptyState,{title:'No matches',description}));
 expect(tree.findAllByType(RNText).map(node=>node.props.children)).toEqual(['No matches']);
});

it('forwards host View props and text styles while isolating the decorative illustration from AX',()=>{
 const layout=jest.fn(),press=jest.fn();
 const mark=h(View,{testID:'brand-art',accessible:true,accessibilityLabel:'Decorative mark',style:{width:64,height:64}});
 const tree=mount(h(HIGProvider,{maxFontSizeMultiplier:1.2},h(EmptyState,{
  title:'No matches',description:'Change filters',illustration:mark,testID:'market-empty',onLayout:layout,
  style:[{backgroundColor:'transparent',alignItems:'center',padding:0,gap:12},{flex:1}],
  titleStyle:[{fontSize:20,lineHeight:28},{fontWeight:'700',textAlign:'center'}],descriptionStyle:{fontSize:14,lineHeight:20,textAlign:'center'},maxFontSizeMultiplier:2,
  action:h(Button,{onPress:press},'Clear filters'),
 })));
 const surface=tree.findAllByType(View).find(node=>node.props.testID==='market-empty');
 expect(StyleSheet.flatten(surface.props.style)).toMatchObject({backgroundColor:'transparent',alignItems:'center',padding:0,gap:12,flex:1});
 act(()=>surface.props.onLayout({nativeEvent:{layout:{width:320,height:240}}}));expect(layout).toHaveBeenCalledTimes(1);
 const illustration=tree.findAllByType(View).find(node=>node.props.importantForAccessibility==='no-hide-descendants');
 expect(illustration.props.accessible).toBe(false);expect(illustration.props.accessibilityElementsHidden).toBe(true);
 expect(illustration.findAllByType(View).some(node=>node.props.testID==='brand-art')).toBe(true);
 const title=tree.findAllByType(RNText).find(node=>node.props.children==='No matches'),description=tree.findAllByType(RNText).find(node=>node.props.children==='Change filters');
 expect(title.props.accessibilityRole).toBe('header');expect(title.props.maxFontSizeMultiplier).toBe(2);expect(description.props.maxFontSizeMultiplier).toBe(2);
 expect(StyleSheet.flatten(title.props.style)).toMatchObject({fontSize:20,lineHeight:28,fontWeight:'700',textAlign:'center',color:nativeSrgb.text});
 expect(StyleSheet.flatten(description.props.style)).toMatchObject({fontSize:14,lineHeight:20,textAlign:'center',color:nativeSrgb.text});
 act(()=>tree.findByType(Button).props.onPress());expect(press).toHaveBeenCalledTimes(1);
});
