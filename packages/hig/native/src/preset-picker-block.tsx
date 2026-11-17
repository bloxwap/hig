import React from 'react';
import {Pressable,View,type ScrollViewProps} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {PresetGroup,type PresetOption} from './preset-group.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
/** The row that opens the host's own entry of a value no quick choice holds, such as a keypad. */
export interface PresetPickerCustom {
 /** The row's text: Custom amount. */
 label:string;
 /** Called on a press; the host opens its own entry. */
 onSelect:()=>void;
 /** The value the host's entry set, as host text: `$75`. It is drawn on the trailing edge and the row reads as selected. */
 value?:string;
 /** Whether the row reads as selected. Defaults to whether `value` is given. */
 selected?:boolean;
 /** The row's accessible name, in place of its text (and value): Edit custom size, current $75. */
 accessibilityLabel?:string;
 /** The row's test ID, in place of `<testID>-custom`. */
 testID?:string;
}
/** Steps through the chips with the screen reader's adjust gesture (swipe up or down on iOS, volume keys on Android). */
export interface PresetPickerAdjustable {
 /** Name of the increment action: Increase leverage. */
 incrementLabel:string;
 /** Name of the decrement action: Decrease leverage. */
 decrementLabel:string;
 /** The adjustable view's test ID, in place of `<testID>-adjustable`. */
 testID?:string;
}
export interface PresetPickerBlockProps<T extends string|number=number> {
 /** Heading of the header. Leave it out for a pane whose host draws its own header: the block then starts at the headline figure. */
 title?:string;
 /** The headline figure, the value being chosen. `null` reads as unknown. */
 value:number|null;
 /** Format of the headline figure, such as `{style:'currency',currency:'USD',maximumFractionDigits:0}`. */
 valueOptions?:Intl.NumberFormatOptions;
 /** Text drawn before the figure. */
 valuePrefix?:string;
 /** Text drawn after the figure, such as `×` for leverage. */
 valueSuffix?:string;
 /** What the figure is read as before its value: Size. */
 valueLabel?:string;
 /** The quick choices as chips, in order: `{value, label, disabled?, testID?}`. Labels are host text: `$25`, `Max`, `40×`. A chip without `testID` takes `<testID>-preset-<value>`. */
 presets:readonly PresetOption<T>[];
 /** The chip shown selected; `null` selects none, such as for a custom value. */
 selected:T|null;
 /** Called with the chip taken. A press on the selected chip, or on a dimmed one, does nothing. */
 onPresetChange:(value:T)=>void;
 /** Accessible name of the chips, read as each chip's hint: Size. Defaults to `title`. */
 presetsLabel?:string;
 /** Chips per row. Defaults to every chip in one row. */
 columns?:number;
 /** Makes the chips one adjustable control that steps to the next or previous enabled chip, named by `presetsLabel` and valued by the selected chip's label. */
 adjustable?:PresetPickerAdjustable;
 /** The row that opens the host's own entry, drawn above the chips. */
 custom?:PresetPickerCustom;
 /** Fill of the selected chip, the selected custom row and the confirming action: `primary` (the default) or `destructive`. */
 intent?:'primary'|'destructive';
 /** Drawn as given between the chips and the actions, such as a muted note. */
 children?:React.ReactNode;
 /** Called on the confirming action. */
 onSubmit:()=>void;
 /** Text of the confirming action: Set Size. */
 submitLabel:string;
 submitDisabled?:boolean;
 /** The confirming action shows a spinner and ignores presses. */
 busy?:boolean;
 /** Shows Cancel on the leading side of the confirming action, the two sharing the row equally. */
 onCancel?:()=>void;
 /** Text of Cancel. Defaults to the built-in "Cancel". */
 cancelLabel?:string;
 /** Keeps the provider's feedback off the chips and both actions, for a host that plays its own cue. */
 suppressFeedback?:boolean;
 /** Shows Back on the leading edge of the header (needs `title`). */
 onBack?:()=>void;
 /** Pressable props for Back, such as `{android_disableSound: true}`. */
 backProps?:ScreenHeaderControlProps;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** `nativeID` of the title, so a sheet can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child. Needs `title`; place it in a bounded container. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** Prefix of the test IDs: `<testID>-header`, `-back`, `-title`, `-headline`, `-custom`, `-custom-value`, `-presets`, `-preset-<value>`, `-adjustable`, `-actions`, `-cancel` and `-confirm`. Defaults to `preset-picker`. */
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/**
 * Choose one value from quick choices as a screen: an optional header, the value as the headline figure, an optional row that opens the
 * host's own entry, the choices as chips, then Cancel and the confirming action. Draws a trade sheet's Size and Leverage panes. It reuses
 * TargetBlock's parts (the headline, the Custom row, PresetGroup and the actions row) without its price card and unit control.
 */
export function PresetPickerBlock<T extends string|number=number>({title,value,valueOptions,valuePrefix,valueSuffix,valueLabel,presets,selected,onPresetChange,presetsLabel,columns,adjustable,custom,intent='primary',children,onSubmit,submitLabel,submitDisabled,busy,onCancel,cancelLabel,suppressFeedback,onBack,backProps,headerAction,headingId,stickyHeader,stickyHeaderBackground,scrollComponent,testID='preset-picker'}:PresetPickerBlockProps<T>){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction}=useHIG();
 const id=(part:string)=>`${testID}-${part}`;
 const destructive=intent==='destructive',onFill=destructive?colors.background:colors.onAction;
 const customSelected=custom?(custom.selected??custom.value!==undefined):false;
 const chevron=(color:string)=><View style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={color}/></View>;
 const label=presetsLabel??title;
 const group=presets.length>0?<PresetGroup<T> testID={id('presets')} label={label} options={presets.map(option=>({...option,testID:option.testID??id(`preset-${option.value}`)}))} value={selected} onValueChange={onPresetChange} columns={columns} selectedIntent={intent} suppressFeedback={suppressFeedback}/>:null;
 // The adjust gesture steps from the selected chip (or the first, when none is) to the next enabled one.
 const enabled=presets.filter(option=>!option.disabled),at=enabled.findIndex(option=>selected!==null&&Object.is(option.value,selected));
 const step=(delta:number)=>{const next=enabled[at<0?0:Math.max(0,Math.min(enabled.length-1,at+delta))];if(next&&!Object.is(next.value,selected))onPresetChange(next.value);};
 const current=presets.find(option=>selected!==null&&Object.is(option.value,selected));
 const chips=adjustable&&group?<View testID={adjustable.testID??id('adjustable')} accessibilityRole='adjustable' accessibilityLabel={label} accessibilityValue={current?{text:current.label}:undefined} accessibilityActions={[{name:'increment',label:adjustable.incrementLabel},{name:'decrement',label:adjustable.decrementLabel}]} onAccessibilityAction={event=>step(event.nativeEvent.actionName==='increment'?1:-1)}>{group}</View>:group;
 const header=title!==undefined?<ScreenHeader title={title} onBack={onBack} backProps={backProps} action={headerAction} headingId={headingId} testID={testID}/>:null;
 const body=<>
  <View style={{alignItems:'center'}}><AnimatedNumberReadout testID={id('headline')} value={value} options={valueOptions} prefix={valuePrefix} suffix={valueSuffix} label={valueLabel} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/></View>
  {custom?<Pressable testID={custom.testID??id('custom')} accessibilityRole='button' accessibilityLabel={custom.accessibilityLabel??(custom.value!==undefined?`${custom.label}, ${custom.value}`:undefined)} accessibilityState={{selected:customSelected}} onPress={custom.onSelect} style={({pressed})=>({direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:48,paddingHorizontal:16,borderRadius:9999,backgroundColor:customSelected?(destructive?colors.negative:colors.action):pressed?fills.raised:fills.well,opacity:customSelected&&pressed?0.9:1})}>
   <Text {...hidden} numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'600',color:customSelected?onFill:colors.text}}>{custom.label}</Text>
   <View {...hidden} style={{direction,flexDirection:'row',alignItems:'center',gap:6,flexShrink:1}}>
    {custom.value!==undefined?<Text testID={id('custom-value')} numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',color:customSelected?onFill:colors.muted}}>{custom.value}</Text>:null}
    {chevron(customSelected?onFill:colors.muted)}
   </View>
  </Pressable>:null}
  {chips}
  {children}
  <View testID={id('actions')} style={{direction,flexDirection:'row',gap:8}}>
   {onCancel?<Button testID={id('cancel')} intent='secondary' suppressFeedback={suppressFeedback} onPress={onCancel} style={{flex:1,alignSelf:'auto'}}>{cancelLabel??t.cancel}</Button>:null}
   <Button testID={id('confirm')} intent={intent} disabled={submitDisabled} busy={busy} suppressFeedback={suppressFeedback} onPress={onSubmit} style={{flex:1,alignSelf:'auto'}}>{submitLabel}</Button>
  </View>
 </>;
 if(stickyHeader&&header)return <StickyHeaderLayout testID={testID} headerTestID={id('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
