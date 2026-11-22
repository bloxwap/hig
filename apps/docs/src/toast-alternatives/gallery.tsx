'use client';
import './glows.css';
import React, {useState} from 'react';
import {NotificationCard, InfoCard, InfoPanel, type NotificationTone} from './notification-card';
import SpecializedToasts from './specialized';
import {basePath} from '../../lib/site';
const tones: NotificationTone[]=['neutral','success','error','warning','info'];
const toastTypes={
 'notification-pill':'Notification pill',
 'inline-action':'Inline action toast',
 'dual-action':'Dual action toast',
 'dismissible-panel':'Dismissible panel',
} as const;
type ToastType=keyof typeof toastTypes;
function previewTitle(type:ToastType,tone:NotificationTone){
 return <span id={`toast-${tone}-${type}`} data-toast-type={type}>{toastTypes[type]}</span>;
}
export default function ToastAlternatives(){
 const [message,setMessage]=useState('');
 const [closedTones,setClosedTones]=useState<NotificationTone[]>([]);
 const [closedPanels,setClosedPanels]=useState<NotificationTone[]>([]);
 const action={label:'Continue',appearance:'badge' as const,onClick:()=>setMessage('Demo action selected')};
 return <section className="not-prose" aria-label="Monorepo toast alternatives">
 <p>Feedback questions are in <a href={`${basePath}/docs/components/feedback-block/`}>Feedback Block</a>.</p><SpecializedToasts/><h2>App and mobile alternatives</h2><p>Toast presentations include: notification, info card, info panel, trend, and payout. Feedback questions now live in Feedback Block. Mobile call sites and states are included; these previews use web renderers.</p>
 <div style={{display:'grid',gap:32}}>{tones.map(tone=><section key={tone}><h3>{tone}</h3><div style={{display:'grid',gap:20,justifyItems:'start',padding:24}}>
 <NotificationCard tone={tone} title={previewTitle('notification-pill',tone)} description="Short outcome or confirmation" onClick={()=>setMessage(`${tone} pill selected`)}/>
 <InfoCard tone={tone} title={previewTitle('inline-action',tone)} action={action} onClose={()=>setMessage('Demo close selected')}/>
 <>{closedTones.includes(tone)?<button type="button" onClick={()=>setClosedTones(current=>current.filter(value=>value!==tone))}>Reset two-action preview</button>:<InfoCard tone={tone} title={previewTitle('dual-action',tone)} description="Choose how to proceed." action={{...action,appearance:'solid'}} secondaryAction={{label:'Close',onClick:()=>setClosedTones(current=>[...current,tone])}}/>}</>
 {closedPanels.includes(tone)?<button type="button" onClick={()=>setClosedPanels(current=>current.filter(value=>value!==tone))}>Reset multiline preview</button>:<InfoPanel tone={tone} title={previewTitle('dismissible-panel',tone)} description="A longer explanation that stays visible until dismissed." onClose={()=>setClosedPanels(current=>[...current,tone])}/>}
 </div></section>)}</div><p role="status">{message}</p>
 </section>;
}
