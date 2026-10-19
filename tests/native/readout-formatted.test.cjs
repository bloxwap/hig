const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,StyleSheet}=require('react-native');
const {nativeSrgb}=require('@bloxwap/hig-tokens');
const {HIGProvider}=require('../../packages/native/src/provider');
const {NumberReadout,Usd,Percent}=require('../../packages/native/src/data');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
const mount=element=>{act(()=>{root=create(element);});return root.root.findByType(RNText);};
const reading=node=>node.props.children.join('');

it('preserves opaque static text while applying stale, label, semantic tone and protected typography',()=>{
 const text=mount(h(HIGProvider,{locale:'de-DE',messages:{stale:'(veraltet)'}},h(NumberReadout,{
  value:90,formattedValue:'01:30',stale:true,label:'Time remaining',tone:'negative',testID:'countdown',
  style:[{fontFamily:'HostMono',fontSize:20,lineHeight:28},{color:'red',fontVariant:['proportional-nums']}],maxFontSizeMultiplier:2,
 })));
 expect(reading(text)).toBe('01:30 (veraltet)');
 expect(text.props.accessibilityLabel).toBe('Time remaining: 01:30 (veraltet)');
 expect(text.props.testID).toBe('countdown');
 expect(text.props.maxFontSizeMultiplier).toBe(2);
 expect(StyleSheet.flatten(text.props.style)).toMatchObject({fontFamily:'HostMono',fontSize:20,lineHeight:28,color:nativeSrgb.negative,fontVariant:['tabular-nums']});
 expect(text.props.accessibilityLiveRegion).toBeUndefined();
});

it.each([null,undefined,NaN,Infinity,-Infinity])('does not let formatted text disguise an unknown %s value',value=>{
 const text=mount(h(NumberReadout,{value,formattedValue:'0.00',label:'Balance',stale:true}));
 expect(reading(text)).toBe('— (stale)');
 expect(text.props.accessibilityLabel).toBe('Balance: — (stale)');
});

it.each([undefined,''])('keeps canonical locale formatting when formattedValue is %p',formattedValue=>{
 const text=mount(h(HIGProvider,{locale:'de-DE'},h(NumberReadout,{value:1234.5,formattedValue,options:{minimumFractionDigits:2}})));
 expect(reading(text)).toBe('1.234,50');
});

it.each([[NumberReadout,0,'0.00'],[Usd,1234,'$1.23k'],[Percent,5,'+5.0%']])('forwards host text through %p without parsing or reformatting',(Component,value,formattedValue)=>{
 expect(reading(mount(h(Component,{value,formattedValue})))).toBe(formattedValue);
});
