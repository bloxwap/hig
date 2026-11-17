'use client';
import {useState} from 'react';
import {FeedbackCard} from './feedback-card';

/** Question and answer block with local demo feedback. */
export default function FeedbackBlock({state='default'}:{state?:string}) {
 const [answer,setAnswer]=useState('');
 const title=state==='return'?'What stopped you last time?':"That didn't work. What got in the way?";
 return <><FeedbackCard prompt={{reasons:['It was confusing','Too slow','I hit an error','Just looking','Something else']}} title={title} optional="Optional · one tap" label={reason=>reason} onAnswer={reason=>setAnswer(`Thanks, that helps. Answer: ${reason}`)}/>{answer&&<p role="status">{answer}</p>}</>;
}
