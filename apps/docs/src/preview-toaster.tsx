import {Toaster,type ToastPosition} from '@bloxwap/hig/react/toast';

export function PreviewToaster({state}:{state:string}){
 const toasterPosition:ToastPosition=["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"].includes(state)?state as ToastPosition:'bottom-center';
 return <Toaster position={toasterPosition}/>;
}
