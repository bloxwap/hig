export interface Choice {value:string;label:string;/** Optional translated name or supporting text, shown below the option label. */description?:string;/** BCP-47 language of the label, for native pronunciation and shared-script punctuation. */lang?:string;disabled?:boolean}
export interface CheckedProps {label:string;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(v:boolean)=>void}
export interface ChoicesProps {label:string;options:readonly Choice[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(v:string)=>void}
