const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,View:RNView,PixelRatio,StyleSheet}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {createNumberReelModel,numberTrendDirection,safeNumberLayout}=require('../../packages/hig/native/src/animated-number-model');
const h=React.createElement;
let root;

beforeEach(()=>{
 const state=global.__numberReanimated;state.values.length=0;state.animations.length=0;state.cancel.mockClear();state.timing.mockClear();
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
function mount(element){act(()=>{root=create(element);});return root.root;}
function update(element){act(()=>root.update(element));}
function example(props={},provider={}){return h(HIGProvider,provider,h(AnimatedNumberReadout,{value:1,label:'Price',testID:'price',...props}));}
function finalText(){return root.root.findAllByType(RNText).find(node=>node.props.testID==='price');}
function measure(width=24,height=56){
 const probes=root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function');expect(probes).toHaveLength(10);
 act(()=>{for(const probe of probes)probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width,height}}});});
}

it('reconstructs canonical scientific parts and stable numeric place keys without reordering',()=>{
 const locale='en-US-u-nu-mathmono',options={notation:'scientific',signDisplay:'always',minimumFractionDigits:2};
 const model=createNumberReelModel(-1234.5,locale,options,undefined,'ltr'),expected=new Intl.NumberFormat(locale,options).format(-1234.5);
 const expectedDigits=Array.from({length:10},(_,digit)=>new Intl.NumberFormat(locale,{numberingSystem:'mathmono',useGrouping:false}).format(digit));
 expect(safeNumberLayout(expected,'ltr',expectedDigits)).toBe(true);
 expect(require('../../packages/hig/native/src/animated-number-model').formatNumberReadout(-1234.5,locale,options).core).toBe(expected);
 expect(model).not.toBeNull();expect(model.canonical).toBe(expected);expect(model.tokens.map(token=>token.value).join('')).toBe(expected);
 expect(model.digits).toEqual(Array.from({length:10},(_,digit)=>new Intl.NumberFormat(locale,{numberingSystem:'mathmono',useGrouping:false}).format(digit)));
 expect(model.tokens.filter(token=>token.kind==='digit').map(token=>token.key)).toEqual(['integer:0','fraction:0','fraction:1','fraction:2','exponentInteger:0']);
 expect(model.tokens.filter(token=>token.kind==='static').map(token=>token.value)).toEqual(['-','.','E']);
});

it.each(['en-US-u-nu-arab','bn-BD','my-MM'])('maps localized decimal reels in verified LTR layouts for %s',locale=>{
 const model=createNumberReelModel(1234.5,locale,{useGrouping:false},undefined,'ltr');
 expect(model).not.toBeNull();expect(model.digits).toHaveLength(10);expect(model.tokens.filter(token=>token.kind==='digit')).toHaveLength(5);
 expect(model.tokens.map(token=>token.value).join('')).toBe(new Intl.NumberFormat(locale,{useGrouping:false}).format(1234.5));
 expect(model.tokens.filter(token=>token.kind==='digit').map(token=>token.value)).not.toEqual(['1','2','3','4','5']);
});

it('falls back for opaque, unknown, RTL, bidi, unmappable, and missing-part layouts',()=>{
 for(const value of [null,undefined,NaN,Infinity,-Infinity])expect(createNumberReelModel(value,'en-US',{},undefined,'ltr')).toBeNull();
 expect(createNumberReelModel(90,'en-US',{},'01:30','ltr')).toBeNull();
 expect(createNumberReelModel(90,'en-US',{},undefined,'rtl')).toBeNull();
 expect(createNumberReelModel(-1234.5,'ar-EG',{notation:'scientific'},undefined,'ltr')).toBeNull();
 expect(createNumberReelModel(123,'nqo',{useGrouping:false},undefined,'ltr')).toBeNull();
 expect(safeNumberLayout('\u202e123','ltr')).toBe(false);expect(safeNumberLayout('مبلغ 123','ltr')).toBe(false);
 const Original=Intl.NumberFormat;
 jest.spyOn(Intl,'NumberFormat').mockImplementation(function(locale,options){const formatter=new Original(locale,options);return {format:formatter.format.bind(formatter),resolvedOptions:formatter.resolvedOptions.bind(formatter)};});
 expect(createNumberReelModel(12,'en-US',{},undefined,'ltr')).toBeNull();
});

it('resolves explicit and callback trends from previous and current finite values',()=>{
 expect(numberTrendDirection(undefined,1,2)).toBe(1);expect(numberTrendDirection(undefined,2,1)).toBe(-1);expect(numberTrendDirection(0,1,2)).toBe(0);
 const trend=jest.fn(()=>-1);expect(numberTrendDirection(trend,4,9)).toBe(-1);expect(trend).toHaveBeenCalledWith(4,9);
 expect(numberTrendDirection(trend,9,9)).toBe(0);expect(numberTrendDirection(trend,null,9)).toBe(0);expect(trend).toHaveBeenCalledTimes(1);
});

it('keeps opaque and unknown animated values static with one quiet accessible final text and affix rules',()=>{
 mount(example({value:90,formattedValue:'01:30',prefix:'<',suffix:'>',stale:true,label:'Time remaining'}));
 expect(finalText().props.children.join('')).toBe('<01:30> (stale)');expect(finalText().props.accessibilityLabel).toBe('Time remaining: <01:30> (stale)');
 expect(finalText().props.accessibilityLiveRegion).toBeUndefined();expect(root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function')).toHaveLength(0);
 update(example({value:null,formattedValue:'0.00',prefix:'$',suffix:' USD',label:'Balance'}));
 expect(finalText().props.children.join('')).toBe('—');expect(finalText().props.accessibilityLabel).toBe('Balance: —');expect(root.root.findAllByType(RNText)).toHaveLength(1);
});

it('uses actual scaled glyph metrics for clipped LTR reels and hides only the visual copy',()=>{
 jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(2);
 mount(example({value:1234.5,prefix:'$',suffix:' USD',style:{fontSize:20,lineHeight:28},maxFontSizeMultiplier:2}));
 expect(StyleSheet.flatten(finalText().props.style).opacity).toBeUndefined();measure();
 expect(StyleSheet.flatten(finalText().props.style).opacity).toBeUndefined();expect(StyleSheet.flatten(finalText().props.style).color).toBe('transparent');expect(finalText().props.accessibilityLabel).toBe('Price: $1,234.5 USD');
 const clips=root.root.findAllByType(RNView).filter(node=>{const style=StyleSheet.flatten(node.props.style);return style?.overflow==='hidden'&&style.width===24&&style.height===56;});
 expect(clips).toHaveLength(5);
 const visual=root.root.findAllByType(RNView).find(node=>node.props.accessibilityElementsHidden===true&&StyleSheet.flatten(node.props.style)?.direction==='ltr');
 expect(visual.props.importantForAccessibility).toBe('no-hide-descendants');expect(StyleSheet.flatten(visual.props.style).flexDirection).toBe('row');
 expect(root.root.findAllByType(RNText).filter(node=>node.props.testID==='price')).toHaveLength(1);expect(finalText().props.accessibilityLiveRegion).toBeUndefined();
 expect(global.__numberReanimated.timing).not.toHaveBeenCalled();
});

it('animates non-Latin digits in a verified LTR layout',()=>{
 mount(example({value:1},{locale:'bn-BD',direction:'ltr'}));measure();update(example({value:2},{locale:'bn-BD',direction:'ltr'}));
 expect(global.__numberReanimated.animations).toHaveLength(1);expect(global.__numberReanimated.animations[0].toValue).toBe(2);
 expect(finalText().props.accessibilityLabel).toBe('Price: ২');
});

it('retargets from the current reel position, snaps for reduced motion, and cancels on cleanup',()=>{
 const motion=jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(1);void motion;
 mount(example({value:9,trend:1,duration:900},{reducedMotion:false}));measure();const state=global.__numberReanimated;
 update(example({value:10,trend:1,duration:900},{reducedMotion:false}));
 expect(state.animations).toHaveLength(1);expect(state.animations[0].toValue).toBe(10);expect(state.animations[0].config).toMatchObject({duration:600,reduceMotion:'never'});
 const position=state.animations[0].value;expect(position.value).toBe(9);position.value=9.4;
 update(example({value:11,trend:1,duration:900},{reducedMotion:false}));
 expect(state.animations).toHaveLength(2);expect(state.animations[1].toValue).toBe(11);expect(state.animations[1].value).toBe(position);expect(position.value).toBe(9.4);
 update(example({value:12,trend:1,duration:900},{reducedMotion:true}));
 expect(state.animations).toHaveLength(2);expect(position.value).toBe(2);expect(state.cancel).toHaveBeenCalled();
 const cancellations=state.cancel.mock.calls.length;act(()=>root.unmount());root=null;expect(state.cancel.mock.calls.length).toBeGreaterThan(cancellations);
});

it('uses each digit’s own signed direction for a neutral trend',()=>{
 mount(example({value:9,trend:0}));measure();update(example({value:10,trend:0}));
 expect(global.__numberReanimated.animations).toHaveLength(1);expect(global.__numberReanimated.animations[0].toValue).toBe(0);
});

it('keeps RTL and invalid native metrics on the static final reading',()=>{
 mount(example({value:12,prefix:'$',suffix:' USD'},{direction:'rtl'}));
 expect(root.root.findAllByType(RNText)).toHaveLength(1);expect(StyleSheet.flatten(finalText().props.style).opacity).toBeUndefined();
 act(()=>root.unmount());root=null;mount(example({value:12}));
 const probes=root.root.findAllByType(RNText).filter(node=>typeof node.props.onLayout==='function');
 act(()=>{for(const probe of probes)probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width:0,height:28}}});});
 expect(StyleSheet.flatten(finalText().props.style).opacity).toBeUndefined();expect(global.__numberReanimated.timing).not.toHaveBeenCalled();
});
