import type {Entry} from './example-code';

export function stateLabel(value:string,name?:string){
 if(name==='WalletAddress'){
  if(value==='default')return 'Ethereum horizontal (default)';
  if(value==='vertical')return 'Ethereum vertical';
  if(value==='host-qr')return 'Host QR';
  value=value.replace('-',' ');
 }
 return value[0].toUpperCase()+value.slice(1);
}
/** One link per example: each is a real URL (?state=…), so an example can be opened in a new tab, shared or cited. */
export function StateLinks({entry,state,onStateChange}:{entry:Entry;state:string;onStateChange:(state:string)=>void}){
 const current=entry.states.includes(state)?state:'default';
 return <nav className='example-links' aria-label={`${entry.name} examples`}>{entry.states.map(value=><a key={value} href={value==='default'?'?':`?state=${value}`} aria-current={current===value?'true':undefined} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onStateChange(value);}}>{stateLabel(value,entry.name)}</a>)}</nav>;
}
