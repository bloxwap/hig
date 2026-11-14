/** Where transient notices go. `Toaster` from `@bloxwap/hig/react/toast` registers itself here on mount, so components
 *  can raise a toast without importing the optional Sonner backend. */
export interface NotifyOptions {severity?:'info'|'success'|'warning'|'error';/** Accessible name of the notice's close button. */dismissName?:string;duration?:number;id?:string|number}
type Notifier=(message:string,options?:NotifyOptions)=>unknown;
const notifiers=new Set<Notifier>();
/** Registers a notifier; returns its unregister function. */
export function registerNotifier(notifier:Notifier):()=>void{notifiers.add(notifier);return()=>{notifiers.delete(notifier);};}
/** Raises a notice on the most recently mounted notifier. Returns false when none is mounted, so the caller can show the result inline. */
export function notify(message:string,options?:NotifyOptions):boolean{const notifier=[...notifiers].pop();if(!notifier)return false;notifier(message,options);return true;}
