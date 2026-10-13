export interface Choice {value:string;label:string;disabled?:boolean}
export interface CheckedProps {label:string;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(v:boolean)=>void}
export interface ChoicesProps {label:string;options:readonly Choice[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(v:string)=>void}
