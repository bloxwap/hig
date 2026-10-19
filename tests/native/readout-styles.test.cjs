const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,StyleSheet,Animated}=require('react-native');
const {nativeColors,nativeSrgb}=require('@bloxwap/hig-tokens');
const {HIGProvider}=require('../../packages/native/src/provider');
const {NumberReadout,Usd,Percent}=require('../../packages/native/src/data');
const {AnimatedNumberReadout}=require('../../packages/native/src/animated-number');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
function mount(element){act(()=>{root=create(element);});return root.root;}
const reading=node=>node.props.children.join('');
const text=()=>root.root.findByType(RNText);

it.each(['text','positive','negative','muted'])('uses the explicit %s number tone from the selected native palette (#117)',tone=>{
 const example=(value,colorSpace)=>h(HIGProvider,{colorSpace},h(NumberReadout,{value,tone,testID:'pnl'}));
 mount(example(-5,'srgb'));
 expect(text().props.testID).toBe('pnl');
 expect(StyleSheet.flatten(text().props.style)).toMatchObject({color:nativeSrgb[tone],fontVariant:['tabular-nums']});
 act(()=>root.update(example(5,'display-p3')));
 expect(StyleSheet.flatten(text().props.style).color).toBe(nativeColors.iosDisplayP3[tone]);
});

it('accepts registered and array typography styles on the text while preserving semantic and numeric styles (#117)',()=>{
 const registered=StyleSheet.create({equity:{fontFamily:'BloxwapMonoSemiBold',fontSize:18,fontWeight:'normal',lineHeight:28}});
 mount(h(HIGProvider,{fontFamily:'SansRegular',fontFamilies:{600:'SansSemiBold'},maxFontSizeMultiplier:3},h(NumberReadout,{
  value:10,tone:'positive',testID:'equity',maxFontSizeMultiplier:2,
  style:[registered.equity,false,null,[{fontSize:20,letterSpacing:.25,textAlign:'right'}],{color:'red',fontVariant:['proportional-nums'],opacity:0,width:0}],
 })));
 expect(StyleSheet.flatten(text().props.style)).toMatchObject({fontFamily:'BloxwapMonoSemiBold',fontSize:20,fontWeight:'normal',lineHeight:28,letterSpacing:.25,textAlign:'right',color:nativeSrgb.positive,fontVariant:['tabular-nums']});
 expect(StyleSheet.flatten(text().props.style).opacity).toBeUndefined();
 expect(StyleSheet.flatten(text().props.style).width).toBeUndefined();
 expect(text().props.maxFontSizeMultiplier).toBe(2);
 expect(text().props.allowFontScaling).not.toBe(false);
});

it('keeps Text defaults, registered font weights, and inherited font scaling for readouts (#117)',()=>{
 const example=style=>h(HIGProvider,{fontFamily:'SansRegular',fontFamilies:{400:'SansRegular',600:'SansSemiBold'},maxFontSizeMultiplier:3},h(NumberReadout,{value:0,tone:'#ff0000',style}));
 mount(example(undefined));
 expect(reading(text())).toBe('0');
 expect(StyleSheet.flatten(text().props.style)).toMatchObject({fontFamily:'SansRegular',fontSize:16,lineHeight:24,color:nativeSrgb.text,fontVariant:['tabular-nums']});
 expect(text().props.maxFontSizeMultiplier).toBe(3);
 act(()=>root.update(example({fontWeight:'600',fontSize:20,lineHeight:28})));
 expect(StyleSheet.flatten(text().props.style)).toMatchObject({fontFamily:'SansSemiBold',fontWeight:'normal',fontSize:20,lineHeight:28});
});

it('preserves localized visible and accessible final numbers with styled stale readouts (#117)',()=>{
 mount(h(HIGProvider,{locale:'de-DE',messages:{stale:'(veraltet)'}},h(NumberReadout,{value:-1234.5,label:'PnL',tone:'negative',stale:true,options:{signDisplay:'always',minimumFractionDigits:2},style:{fontSize:20}})));
 expect(reading(text())).toBe('-1.234,50 (veraltet)');
 expect(text().props.accessibilityLabel).toBe('PnL: -1.234,50 (veraltet)');
 expect(text().props.accessibilityLiveRegion).toBeUndefined();
});

it.each([null,undefined,NaN,Infinity,-Infinity])('keeps unknown %s values distinct from zero with custom typography (#117)',value=>{
 mount(h(NumberReadout,{value,style:{fontFamily:'HostMono',fontSize:20},testID:'unknown'}));
 expect(reading(text())).toBe('—');
 expect(text().props.testID).toBe('unknown');
});

it.each([[Usd,12.5,'$12.50'],[Percent,5,'5%']])('forwards typography, tone, and testID through %p without changing formatting (#117)',(Component,value,expected)=>{
 mount(h(Component,{value,tone:'muted',testID:'amount',style:{fontFamily:'HostMono',fontSize:20},options:Component===Percent?{style:'decimal'}:undefined}));
 expect(reading(text())).toBe(expected);
 expect(text().props.testID).toBe('amount');
 expect(StyleSheet.flatten(text().props.style)).toMatchObject({fontFamily:'HostMono',fontSize:20,color:nativeSrgb.muted,fontVariant:['tabular-nums']});
});

it('styles and identifies the final animated number while preserving motion limits and reduced motion (#117)',()=>{
 const start=jest.fn(),stop=jest.fn();
 const timing=jest.spyOn(Animated,'timing').mockReturnValue({start,stop,reset:jest.fn()});
 const clock=jest.spyOn(Date,'now').mockReturnValue(1000);
 const example=(value,tone='positive',reducedMotion=false)=>h(HIGProvider,{reducedMotion},h(AnimatedNumberReadout,{value,tone,label:'Price',testID:'price',duration:900,style:{fontFamily:'HostMonoSemiBold',fontSize:20,lineHeight:28},maxFontSizeMultiplier:2}));
 mount(example(1));
 expect(timing).not.toHaveBeenCalled();
 act(()=>root.update(example(2)));
 expect(timing).toHaveBeenCalledTimes(1);
 expect(timing.mock.calls[0][1]).toMatchObject({duration:600,useNativeDriver:true});
 expect(start).toHaveBeenCalledTimes(1);
 expect(text().props.testID).toBe('price');
 expect(text().props.accessibilityLabel).toBe('Price: 2');
 expect(text().props.maxFontSizeMultiplier).toBe(2);
 expect(StyleSheet.flatten(text().props.style)).toMatchObject({fontFamily:'HostMonoSemiBold',fontSize:20,lineHeight:28,color:nativeSrgb.positive});
 expect(root.root.findAll(node=>typeof node.type==='string'&&node.props.testID==='price').every(node=>node.type==='Text')).toBe(true);
 clock.mockReturnValue(1010);
 act(()=>root.update(example(3,'negative')));
 expect(stop).toHaveBeenCalledTimes(1);
 expect(timing).toHaveBeenCalledTimes(1);
 clock.mockReturnValue(2000);
 act(()=>root.update(example(4,'negative',true)));
 expect(timing).toHaveBeenCalledTimes(1);
 expect(text().props.accessibilityLabel).toBe('Price: 4');
 expect(StyleSheet.flatten(text().props.style).color).toBe(nativeSrgb.negative);
 expect(text().props.accessibilityLiveRegion).toBeUndefined();
});
