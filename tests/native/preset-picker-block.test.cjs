/** Native PresetPickerBlock: an optional header, the headline figure, the Custom row, the chips, then Cancel beside the confirming action. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet}=require('react-native');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {PresetPickerBlock}=require('../../packages/hig/native/src/preset-picker-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {PresetGroup}=require('../../packages/hig/native/src/preset-group');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const h=React.createElement;
let root;
const steps=[25,50,100,250,500,1000];
const sizeOptions=max=>[{value:'max',label:'Max',disabled:max==null||max<=0,testID:'size-lev-size-max'},...steps.map(step=>({value:step,label:`$${step.toLocaleString('en-US')}`,disabled:max==null||step>max,testID:`size-lev-size-${step}`}))];
const usd0={style:'currency',currency:'USD',maximumFractionDigits:0};
const base={value:100,valueOptions:usd0,presets:sizeOptions(300),selected:100,onPresetChange:()=>{},onSubmit:()=>{},submitLabel:'Set Size'};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(PresetPickerBlock,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
const pressable=(view,id)=>all(view,id).find(node=>typeof node.props.onPress==='function'&&node.props.accessibilityRole==='button');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('draws the Size pane under the host prefix: no header without a title, the figure, Custom amount, the chips, then Cancel beside Set Size',()=>{
 const preset=jest.fn(),custom=jest.fn(),submit=jest.fn(),cancel=jest.fn();
 const view=mount({testID:'size-lev-size',presetsLabel:'Size',columns:4,onPresetChange:preset,custom:{label:'Custom amount',onSelect:custom},onSubmit:submit,onCancel:cancel,cancelLabel:'Cancel',suppressFeedback:true});
 expect(has(view,'size-lev-size-header')).toBe(false);expect(has(view,'size-lev-size-title')).toBe(false);
 expect(view.findAllByType(AnimatedNumberReadout)[0].props).toMatchObject({value:100,options:usd0});expect(text(host(view,'size-lev-size-headline'))).toBe('$100');
 const row=pressable(view,'size-lev-size-custom');expect(row.props.accessibilityState).toEqual({selected:false});expect(has(view,'size-lev-size-custom-value')).toBe(false);
 expect(flat(row).backgroundColor).not.toBe(nativeSrgb.action);
 act(()=>row.props.onPress());expect(custom).toHaveBeenCalledTimes(1);
 const group=view.findByType(PresetGroup);expect(group.props).toMatchObject({testID:'size-lev-size-presets',label:'Size',columns:4,value:100,selectedIntent:'primary',suppressFeedback:true});
 // Host test IDs on the chips are kept.
 expect(group.props.options.map(option=>option.testID)).toEqual(['size-lev-size-max',...steps.map(step=>`size-lev-size-${step}`)]);
 expect(button(view,'size-lev-size-500').props.disabled).toBe(true);
 act(()=>button(view,'size-lev-size-max').props.onPress());expect(preset).toHaveBeenCalledWith('max');
 expect(text(host(view,'size-lev-size-cancel'))).toBe('Cancel');expect(text(host(view,'size-lev-size-confirm'))).toBe('Set Size');
 expect(button(view,'size-lev-size-confirm').props).toMatchObject({intent:'primary',suppressFeedback:true});expect(button(view,'size-lev-size-cancel').props.suppressFeedback).toBe(true);
 act(()=>button(view,'size-lev-size-cancel').props.onPress());act(()=>button(view,'size-lev-size-confirm').props.onPress());expect(cancel).toHaveBeenCalledTimes(1);expect(submit).toHaveBeenCalledTimes(1);
});

it('fills the Custom row with its value when the host holds a custom value, and reads it',()=>{
 const view=mount({selected:null,value:75,custom:{label:'Custom amount',value:'$75',onSelect:()=>{}}});
 const row=pressable(view,'preset-picker-custom');
 expect(row.props.accessibilityState).toEqual({selected:true});expect(row.props.accessibilityLabel).toBe('Custom amount, $75');
 expect(flat(row).backgroundColor).toBe(nativeSrgb.action);expect(text(host(view,'preset-picker-custom-value'))).toBe('$75');
 // A host accessibility label and test ID replace the defaults.
 const own=mount({custom:{label:'Custom amount',value:'$75',selected:false,onSelect:()=>{},accessibilityLabel:'Edit custom size, current $75',testID:'my-custom'}});
 expect(pressable(own,'my-custom').props.accessibilityLabel).toBe('Edit custom size, current $75');expect(pressable(own,'my-custom').props.accessibilityState).toEqual({selected:false});
 // pressProps reach the row (a host that plays its own sound silences Android's click), and HIG keeps its own press and name.
 const host2=jest.fn(),silent=mount({custom:{label:'Custom amount',onSelect:host2,pressProps:{android_disableSound:true,accessibilityLabel:'ignored',onPress:()=>{}}}});
 const quiet=pressable(silent,'preset-picker-custom');expect(quiet.props.android_disableSound).toBe(true);
 act(()=>quiet.props.onPress());expect(host2).toHaveBeenCalledTimes(1);
});

it('draws the Leverage pane with a suffix, a default chip test ID and an adjustable group that steps through enabled chips',()=>{
 const preset=jest.fn();
 const presets=[1,5,10,20,{value:30,disabled:true},40].map(step=>typeof step==='number'?{value:step,label:`${step}×`}:{...step,label:`${step.value}×`});
 const view=mount({testID:'size-lev-leverage',value:10,valueOptions:undefined,valueSuffix:'×',presets,selected:10,presetsLabel:'Leverage',columns:3,onPresetChange:preset,adjustable:{incrementLabel:'Increase leverage',decrementLabel:'Decrease leverage',testID:'size-lev-sheet-leverage-slider'}});
 expect(text(host(view,'size-lev-leverage-headline'))).toBe('10×');expect(has(view,'size-lev-leverage-custom')).toBe(false);
 expect(has(view,'size-lev-leverage-preset-40')).toBe(true);
 const adjustable=host(view,'size-lev-sheet-leverage-slider');
 // `accessible` makes the View one element, so VoiceOver and TalkBack focus it and offer the adjust gesture.
 expect(adjustable.props).toMatchObject({accessible:true,accessibilityRole:'adjustable',accessibilityLabel:'Leverage',accessibilityValue:{text:'10×'}});
 expect(adjustable.props.accessibilityActions).toEqual([{name:'increment',label:'Increase leverage'},{name:'decrement',label:'Decrease leverage'}]);
 act(()=>adjustable.props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(preset).toHaveBeenLastCalledWith(20);
 act(()=>adjustable.props.onAccessibilityAction({nativeEvent:{actionName:'decrement'}}));expect(preset).toHaveBeenLastCalledWith(5);
 // The disabled chip is skipped, and the last chip does not step past the end.
 const top=mount({testID:'lev',presets,selected:20,onPresetChange:preset,adjustable:{incrementLabel:'+',decrementLabel:'-'}});
 act(()=>host(top,'lev-adjustable').props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(preset).toHaveBeenLastCalledWith(40);
 const end=mount({testID:'lev',presets,selected:40,onPresetChange:preset,adjustable:{incrementLabel:'+',decrementLabel:'-'}});preset.mockClear();
 act(()=>host(end,'lev-adjustable').props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));expect(preset).not.toHaveBeenCalled();
});

it('draws a header with title, Back and backProps, pins it with stickyHeader, takes destructive, children and busy, and is exported from blocks',()=>{
 const back=jest.fn(),pressIn=jest.fn();
 const view=mount({title:'Leverage',headingId:'lev-heading',onBack:back,backProps:{onPressIn:pressIn},intent:'destructive',busy:true,onCancel:()=>{},children:h('Text',{testID:'host-note'},'Funds convert first.')},{messages:{cancel:'Annuler'}});
 expect(text(host(view,'preset-picker-title'))).toBe('Leverage');expect(host(view,'preset-picker-title').props.nativeID).toBe('lev-heading');
 const backButton=all(view,'preset-picker-back').find(node=>typeof node.props.onPressIn==='function');act(()=>backButton.props.onPressIn());act(()=>backButton.props.onPress());expect([back,pressIn].map(fn=>fn.mock.calls.length)).toEqual([1,1]);
 expect(view.findByType(PresetGroup).props.selectedIntent).toBe('destructive');expect(button(view,'preset-picker-confirm').props).toMatchObject({intent:'destructive',busy:true});
 expect(text(host(view,'preset-picker-cancel'))).toBe('Annuler');expect(has(view,'host-note')).toBe(true);
 const sticky=mount({title:'Leverage',stickyHeader:true});expect(has(sticky,'preset-picker-sticky-header')).toBe(true);
 // Without a title, stickyHeader has nothing to pin.
 const plain=mount({stickyHeader:true});expect(has(plain,'preset-picker-sticky-header')).toBe(false);
 expect(blocks.PresetPickerBlock).toBe(PresetPickerBlock);
});

it('reports min, max and now on the adjustable group with a range, and draws the host formattedValue as the headline',()=>{
 const presets=[1,5,10,20,40].map(step=>({value:step,label:`${step}×`}));
 let view=mount({testID:'lev',value:10,valueOptions:undefined,valueSuffix:'×',presets,selected:10,presetsLabel:'Leverage',adjustable:{incrementLabel:'Increase leverage',decrementLabel:'Decrease leverage',min:1,max:40}});
 expect(host(view,'lev-adjustable').props.accessibilityValue).toEqual({min:1,max:40,now:10,text:'10×'});
 view=mount({testID:'lev',value:10,valueSuffix:'×',presets,selected:null,adjustable:{incrementLabel:'Up',decrementLabel:'Down',min:1,max:40,now:12}});
 expect(host(view,'lev-adjustable').props.accessibilityValue).toEqual({min:1,max:40,now:12});
 // Without a range the value stays the chip's label alone.
 view=mount({testID:'lev',value:10,presets,selected:10,adjustable:{incrementLabel:'Up',decrementLabel:'Down'}});
 expect(host(view,'lev-adjustable').props.accessibilityValue).toEqual({text:'10×'});
 view=mount({testID:'size',value:1250.5,formattedValue:'$1,250.50',valueLabel:'Size'});
 const readout=view.findAllByType(AnimatedNumberReadout).find(node=>node.props.testID==='size-headline');expect(readout.props.formattedValue).toBe('$1,250.50');
});

it('keeps preset choices mounted without rereading them on headline updates',()=>{
 let reads=0;
 const presets=steps.map(value=>({value,get label(){reads++;return String(value);}}));
 const tree=value=>h(HIGProvider,{reducedMotion:true},h(PresetPickerBlock,{...base,presets,value}));
 act(()=>{root=render(tree(100));});
 expect(reads).toBeGreaterThan(0);
 reads=0;
 act(()=>root.update(tree(125)));
 expect(reads).toBe(0);
 expect(text(host(root.root,'preset-picker-headline'))).toBe('$125');
});

it('reuses unchanged Back and action buttons across preset selections',()=>{
 const props={...base,title:'Size',onBack:jest.fn(),onCancel:jest.fn()};
 const update=changes=>h(HIGProvider,{reducedMotion:true},h(PresetPickerBlock,{...props,...changes}));
 act(()=>{root=render(update({}));});
 const controls=['preset-picker-back','preset-picker-cancel','preset-picker-confirm'];
 const previous=controls.map(id=>button(root.root,id).props);
 act(()=>root.update(update({selected:50,value:50})));
 const changed=controls.filter((id,index)=>button(root.root,id).props!==previous[index]);
 expect(changed).toEqual([]);
 const submit=jest.fn();
 act(()=>root.update(update({selected:50,value:50,onSubmit:submit,submitLabel:'Confirm'})));
 expect(text(host(root.root,'preset-picker-confirm'))).toBe('Confirm');
 act(()=>button(root.root,'preset-picker-confirm').props.onPress());
 expect(submit).toHaveBeenCalledTimes(1);
});
