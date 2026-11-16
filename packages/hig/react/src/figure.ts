import {formatNumber} from '@bloxwap/hig/contracts';
/**
 * A number the host supplies as a number so it updates place by place: `{value:0.53,options:{style:'currency',currency:'USD'}}`.
 * `null` reads as unknown. `formattedValue` is the host's own text for the value, drawn and read in place of Intl's, which
 * still moves place by place: use it where the browser's Intl does not match the host's number table. Never parse it back.
 */
export interface Figure {value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;formattedValue?:string}
/** The props of an `AnimatedNumberReadout` that draws a figure: its host text, when given, moves place by place too. */
export function figureProps(figure:Figure):{value:number|null;options?:Intl.NumberFormatOptions;prefix?:string;suffix?:string;formattedValue?:string;animateFormatted?:boolean}{
 const {value,options,prefix,suffix,formattedValue}=figure;
 return formattedValue?{value,options,prefix,suffix,formattedValue,animateFormatted:true}:{value,options,prefix,suffix};
}
/** What a figure reads as, with the provider's money format already merged into `options` by the caller. Unknown values read as the dash, without affixes. */
export function figureReading(figure:Figure,locale:string,options?:Intl.NumberFormatOptions):string{
 if(figure.value==null||!Number.isFinite(figure.value))return '—';
 return `${figure.prefix??''}${figure.formattedValue||formatNumber(figure.value,locale,options)}${figure.suffix??''}`;
}
