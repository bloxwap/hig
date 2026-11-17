'use client';
import React, {useEffect,useState} from 'react';
import {NotificationCard, InfoCard, InfoPanel, type NotificationTone} from './notification-card';
import SpecializedToasts from './specialized';
type ToastInstance={platform:string;file:string;line:number;api:string;code:string};
import {basePath} from '../../lib/site';
const tones: NotificationTone[]=['neutral','success','error','warning','info'];
export default function ToastAlternatives(){
 const [query,setQuery]=useState(''),[platform,setPlatform]=useState('All'),[message,setMessage]=useState('');
 const [closedTones,setClosedTones]=useState<NotificationTone[]>([]);
 const [closedPanels,setClosedPanels]=useState<NotificationTone[]>([]);
 const [instances,setInstances]=useState<ToastInstance[]>([]),[inventoryError,setInventoryError]=useState(false);
 useEffect(()=>{const abort=new AbortController();fetch(`${basePath}/toast-alternatives/instances.json`,{signal:abort.signal}).then(response=>{if(!response.ok)throw new Error('Inventory unavailable');return response.json();}).then(setInstances).catch(()=>{if(!abort.signal.aborted)setInventoryError(true);});return()=>abort.abort();},[]);
 const matching=instances.filter(row=>(platform==='All'||row.platform===platform)&&`${row.file} ${row.api} ${row.code}`.toLowerCase().includes(query.toLowerCase()));
 const action={label:'Continue',appearance:'badge' as const,onClick:()=>setMessage('Demo action selected')};
 return <section className="not-prose" aria-label="Monorepo toast alternatives">
 <p>Feedback questions are in <a href={`${basePath}/docs/components/feedback-block/`}>Feedback Block</a>.</p><SpecializedToasts/><h2>App and mobile alternatives</h2><p>Toast presentations include: notification, info card, info panel, trend, and payout. Feedback questions now live in Feedback Block. Mobile call sites and states are included; these previews use web renderers.</p>
 <div style={{display:'grid',gap:32}}>{tones.map(tone=><section key={tone}><h3>{tone}</h3><div style={{display:'grid',gap:20,justifyItems:'start',padding:24}}>
 <NotificationCard tone={tone} title="Notification pill" description="Short outcome or confirmation" onClick={()=>setMessage(`${tone} pill selected`)}/>
 <InfoCard tone={tone} title="Persistent information" action={action} onClose={()=>setMessage('Demo close selected')}/>
 <>{closedTones.includes(tone)?<button type="button" onClick={()=>setClosedTones(current=>current.filter(value=>value!==tone))}>Reset two-action preview</button>:<InfoCard tone={tone} title="Information with two actions" description="Choose how to proceed." action={{...action,appearance:'solid'}} secondaryAction={{label:'Close',onClick:()=>setClosedTones(current=>[...current,tone])}}/>}</>
 {closedPanels.includes(tone)?<button type="button" onClick={()=>setClosedPanels(current=>current.filter(value=>value!==tone))}>Reset multiline preview</button>:<InfoPanel tone={tone} title="Multiline information panel" description="A longer explanation that stays visible until dismissed." onClose={()=>setClosedPanels(current=>[...current,tone])}/>}
 </div></section>)}</div><p role="status">{message}</p>
 <h3>Isolated toast calls ({instances.length})</h3>{inventoryError?<p role="alert">Source inventory could not load. Reload this page to retry.</p>:instances.length===0?<p role="status">Loading source inventory…</p>:null}<p>Search titles, translation keys, source paths, and payloads. Each entry retains its original arguments, including specialized trade, signup, tournament, countdown, and update presentations.</p>
 <label>Platform <select value={platform} onChange={e=>setPlatform(e.target.value)}>{['All','App','Mobile'].map(p=><option key={p}>{p}</option>)}</select></label>{' '}
 <label>Search <input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><p>{matching.length} matching calls</p>
 {matching.map(row=><details key={`${row.file}:${row.line}:${row.code}`}><summary>{row.platform} · {row.file}:{row.line} · {row.api}</summary><pre style={{overflowX:'auto',maxHeight:400}}><code>{row.code}</code></pre></details>)}
 </section>;
}
