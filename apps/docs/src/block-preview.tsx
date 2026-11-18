import {lazy,Suspense} from 'react';
import type {Entry} from './example-code';
import type {PreviewComponent} from './demo';
import {StateLinks} from './example-state-links';
const FeedbackBlock=lazy(()=>import('./feedback-block'));
/** A block on a clean canvas: the composed block alone, in the card it would occupy in a product. */
export function BlockPreview({entry,state,onStateChange,Preview}:{entry:Entry;state:string;onStateChange:(state:string)=>void;Preview:PreviewComponent}){
 return <section className='block-demo not-prose' aria-label={`${entry.name} examples`}>
  {entry.states.length>1&&<StateLinks entry={entry} state={state} onStateChange={onStateChange}/>}
  <div className='example-frame block-canvas'><div className='example-canvas block-card' data-component={entry.name} data-state={state}><Suspense fallback={<p role='status'>Loading preview…</p>}>{entry.name==='FeedbackBlock'?<FeedbackBlock key={state} state={state}/>:<Preview key={`${entry.name}:${state}`} name={entry.name} state={state}/>}</Suspense></div></div>
 </section>;
}
