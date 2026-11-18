import {formatSignedNumber} from '@bloxwap/hig/contracts';

/**
 * Native number display. Hermes on iOS ignores `signDisplay` (`exceptZero` drew `12.34%` where Android drew `+12.34%`), so every
 * native figure composes its sign in HIG's own code instead of asking Intl for it: iOS and Android draw the same string, and it is
 * the string an Intl that honours `signDisplay` draws. Display only.
 */
export function formatNumber(value:number|null|undefined,locale='en-US',options?:Intl.NumberFormatOptions):string{
 return formatSignedNumber(value,locale,options);
}
