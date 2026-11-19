"use client";
import React from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useHIG} from '../provider.js';
import {Button} from '../button.js';
import {PresetGroup,type PresetOption} from '../preset-group.js';
import {NumberFlow} from '../animated-number.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {SwapIcon} from './swap/shared.js';
const PickerHeader = React.memo(ScreenHeader);
const PickerAction = React.memo(Button);

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
 /** The row's accessible name, in place of its text: Edit custom size, current $75. */
 accessibilityLabel?:string;
 /** The row's `data-testid`. */
 testID?:string;
}
export interface PresetPickerBlockProps<T extends string|number=number> extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading of the header. Leave it out for a pane whose host draws its own header: the block then starts at the headline figure. */
 title?:string;
 /** The headline figure, the value being chosen. `null` reads as unknown. */
 value:number|null;
 /** Format of the headline figure, such as `{style:'currency',currency:'USD',maximumFractionDigits:0}`. */
 valueOptions?:Intl.NumberFormatOptions;
 /** Text drawn before the figure, such as a sign the format does not draw. */
 valuePrefix?:string;
 /** Text drawn after the figure, such as `×` for leverage. */
 valueSuffix?:string;
 /** What the figure is read as before its value: Size. */
 valueLabel?:string;
 /** The host's own text for the figure, in place of formatting `value` with `valueOptions`, for a host with its own number table: `$1,250.50`. Drawn static unless `animateFormatted`; `value` still decides known or unknown and the direction of a move. As `NumberFlow` `formattedValue`. */
 formattedValue?:string;
 /** With `formattedValue`, rolls each of its digits in place, counted from the end, as `NumberFlow` `animateFormatted`. */
 animateFormatted?:boolean;
 /** The quick choices as chips, in order: `{value, label, disabled?, testID?}`. Labels are host text: `$25`, `Max`, `40×`. */
 presets:readonly PresetOption<T>[];
 /** The chip shown selected; `null` selects none, such as for a custom value. */
 selected:T|null;
 /** Called with the chip taken. A press on the selected chip, or on a dimmed one, does nothing. */
 onPresetChange:(value:T)=>void;
 /** Accessible name of the chips' group, not drawn: Size. Defaults to `title`. */
 presetsLabel?:string;
 /** Chips per row. Defaults to every chip in one row. */
 columns?:number;
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
 /** Text of Cancel. Defaults to the built-in “Cancel”. */
 cancelLabel?:string;
 /** The confirming action's `data-testid`. */
 submitTestID?:string;
 /** Cancel's `data-testid`. */
 cancelTestID?:string;
 /** Keeps the provider's feedback off the chips and both actions, for a host that plays its own cue. */
 suppressFeedback?:boolean;
 /** Shows Back on the leading edge of the header (needs `title`). */
 onBack?:()=>void;
 /** Attributes for the header's Back `<button>`. */
 backProps?:ScreenHeaderControlProps;
 /** A control on the trailing edge of the header, usually an `IconButton`. */
 headerAction?:React.ReactNode;
 /** `id` of the header's heading, so a dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Pins the header to the top of the nearest scroller. See Pinned headers. */
 stickyHeader?:boolean;
}
/**
 * Choose one value from quick choices: an optional header, the value as the headline figure, an optional row that opens the host's own
 * entry, the choices as chips, then Cancel and the confirming action. Draws a trade sheet's Size and Leverage panes. It reuses
 * TargetBlock's parts (the headline, the Custom row, PresetGroup and the actions row) without its price card and unit control.
 */
export function PresetPickerBlock<T extends string|number=number>({title,value,valueOptions,valuePrefix,valueSuffix,valueLabel,formattedValue,animateFormatted,presets,selected,onPresetChange,presetsLabel,columns,custom,intent='primary',children,onSubmit,submitLabel,submitDisabled,busy,onCancel,cancelLabel,submitTestID,cancelTestID,suppressFeedback,onBack,backProps,headerAction,headingId,stickyHeader,className,...rest}:PresetPickerBlockProps<T>){
 const {messages}=useHIG();
 const customSelected=custom?(custom.selected??custom.value!==undefined):false;
 return <section {...rest} className={`hig-preset-picker${className?` ${className}`:''}`} data-intent={intent==='destructive'?intent:undefined}>
  {title!==undefined&&<PickerHeader title={title} onBack={onBack} backProps={backProps} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>}
  <p className='hig-target-amount'><NumberFlow value={value} options={valueOptions} formattedValue={formattedValue} animateFormatted={animateFormatted} prefix={valuePrefix} suffix={valueSuffix} label={valueLabel}/></p>
  {custom&&<button type='button' className='hig-swap-setting' aria-pressed={customSelected} aria-label={custom.accessibilityLabel} data-testid={custom.testID} onClick={custom.onSelect}><span>{custom.label}</span>{custom.value!==undefined?<span className='hig-swap-setting-value'>{custom.value}<SwapIcon name='chevron' size={16}/></span>:<SwapIcon name='chevron' size={16}/>}<PressDecoration kind='row'/></button>}
  {presets.length>0&&<PresetGroup<T> label={presetsLabel??title} options={presets} value={selected} onValueChange={onPresetChange} columns={columns} selectedIntent={intent} suppressFeedback={suppressFeedback}/>}
  {children}
  <div className='hig-target-actions'>
   {onCancel&&<PickerAction fullWidth intent='secondary' suppressFeedback={suppressFeedback} data-testid={cancelTestID} onClick={onCancel}>{cancelLabel??messages.cancel??en.cancel}</PickerAction>}
   <PickerAction fullWidth intent={intent} disabled={submitDisabled} busy={busy} suppressFeedback={suppressFeedback} data-testid={submitTestID} onClick={onSubmit}>{submitLabel}</PickerAction>
  </div>
 </section>;
}
