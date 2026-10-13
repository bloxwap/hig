"use client";
import React,{useState} from 'react';
import {Button,Link} from './button.js';
import {Surface,Stack,Heading,Text} from './surface.js';
import {Field,AmountInput} from './field.js';
import {Dialog} from './overlay.js';
import {Row,Usd,Percent} from './data.js';
import {Alert} from './status.js';
export function MarketRow({symbol,name,price,change,onSelect}: {symbol:string;name:string;price:number|null;change:number|null;onSelect:()=>void}){return <Row><Button intent='ghost' onClick={onSelect}>{name} ({symbol})</Button><Usd value={price}/><Percent value={change}/></Row>;}
export function BalanceCard({label,balance,stale}: {label:string;balance:number|null;stale?:boolean}){return <Surface><Text>{label}</Text><Usd value={balance} stale={stale}/></Surface>;}
/** Host validates and submits. Opening review never submits a transaction. */
export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}: {asset:string;amount:string;onAmountChange:(v:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string}){const [review,setReview]=useState(false);return <Surface><Stack><Heading>Review {asset} order</Heading><Field label={`Amount (${asset})`} description={`Available: ${available}`} error={error}><AmountInput value={amount} onChange={e=>onAmountChange(e.target.value)} readOnly={busy}/></Field><Button fullWidth disabled={!amount||!!error} busy={busy} onClick={()=>setReview(true)}>Review order</Button><Dialog open={review} onOpenChange={setReview} title='Confirm order' description={`Amount: ${amount} ${asset}. Verify the host-provided terms before submission.`}><Button busy={busy} disabled={!!error} onClick={onConfirm}>Confirm order</Button>{error&&<Alert title='Order unavailable' severity='error'><p>{error}</p></Alert>}</Dialog></Stack></Surface>;}
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const [status,setStatus]=useState('');return <Surface><pre tabIndex={0}><code>{command}</code></pre><Button intent='secondary' onClick={()=>{Promise.resolve().then(onCopy).then(()=>setStatus('Copied')).catch(()=>setStatus('Copy failed. Select the command and copy manually.'));}}>Copy install command</Button><p role='status'>{status}</p></Surface>;}
export function CodeWindow({language,children}:React.PropsWithChildren<{language:string}>){return <Surface><Text>{language}</Text><pre tabIndex={0}><code>{children}</code></pre></Surface>;}
export function MarketingHero({title,description,href,cta}: {title:string;description:string;href:string;cta:string}){return <section><Heading level={1}>{title}</Heading><Text>{description}</Text><Link href={href}>{cta}</Link></section>;}
export function ActivityList({items}: {items:readonly {id:string;label:string;status:string}[]}){return items.length?<ul>{items.map(i=><li key={i.id}><strong>{i.label}</strong> — {i.status}</li>)}</ul>:<Text>No activity yet</Text>;}
