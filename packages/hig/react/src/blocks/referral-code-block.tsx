"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts/format';
import {normalizeReferralCode,referralCodeMaxLength,referralCopiedMs,referralProgress,referralStage,referralVolumeFormat,type ReferralCodeBlockProps} from '@bloxwap/hig/contracts/referral';
export type {ReferralCodeBlockProps,ReferralCodeLabels,ReferralStage} from '@bloxwap/hig/contracts/referral';
export {normalizeReferralCode,referralProgress,referralStage} from '@bloxwap/hig/contracts/referral';
import {useNumberLocale,usePresentNumber} from '../provider.js';
import {NumberFlow} from '../animated-number.js';
import {Button} from '../button.js';
import {Field,Input} from '../field.js';
import {Checkbox} from '../selection.js';
import {InlineNotice} from '../status.js';
import {ScreenHeader} from './screen-header.js';
/**
 * A referral code in three stages. Trading towards the goal: the traded volume rolling with NumberFlow over a bar that fills to it.
 * Goal met: a field for the code, then a confirmation the trader must acknowledge, since a code is set once. Code set: the code and
 * its link, with Copy and Share.
 */
export function ReferralCodeBlock({volume,goal,volumeOptions=referralVolumeFormat,code,labels,onSetCode,busy,error,normalizeCode=normalizeReferralCode,shareUrl,onCopy,onShare,onBack,headingId}:ReferralCodeBlockProps){
 const locale=useNumberLocale();const present=usePresentNumber();
 const stage=referralStage(volume,goal,code);
 const [draft,setDraft]=React.useState('');
 const [confirming,setConfirming]=React.useState(false);
 const [acknowledged,setAcknowledged]=React.useState(false);
 const [copied,setCopied]=React.useState(false);
 React.useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),referralCopiedMs);return()=>clearTimeout(timer);},[copied]);
 // A set code ends the confirmation, whoever set it.
 React.useEffect(()=>{if(code){setConfirming(false);setAcknowledged(false);}},[code]);
 const money=present(volumeOptions);
 const format=(value:number)=>formatNumber(value,locale,money);
 const confirm=()=>{if(!acknowledged||busy||!draft)return;Promise.resolve().then(()=>onSetCode(draft)).catch(()=>{/* The host's `error` explains; the confirmation stays open. */});};
 const share=referralProgress(volume,goal);
 return <section className='hig-referral' data-stage={confirming&&stage==='create'?'confirm':stage}>
  <ScreenHeader title={labels.title} onBack={onBack} backDisabled={busy} headingId={headingId}/>
  {stage==='progress'&&<div className='hig-surface hig-referral-card'>
   <p className='hig-referral-eyebrow'>{labels.volume}</p>
   <p className='hig-referral-figure'><NumberFlow value={volume} options={money}/></p>
   <p className='hig-referral-caption hig-number'>{labels.goal(format(goal))}</p>
   <div className='hig-referral-track' role='progressbar' aria-label={labels.volume} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share*100)} aria-valuetext={volume==null?undefined:`${format(volume)} ${labels.goal(format(goal))}`}>
    <span style={{'--hig-referral-fill':`${share*100}%`} as React.CSSProperties}/>
   </div>
   <p className='hig-referral-remaining hig-number'>{labels.remaining(format(Math.max(0,goal-(volume??0))))}<span>{Math.floor(share*100)}%</span></p>
   {labels.progressNote&&<p className='hig-referral-note'>{labels.progressNote}</p>}
  </div>}
  {stage==='create'&&!confirming&&<form className='hig-surface hig-referral-card' onSubmit={event=>{event.preventDefault();if(draft)setConfirming(true);}}>
   <p className='hig-referral-unlocked'>{labels.unlocked}</p>
   {labels.unlockedNote&&<p className='hig-referral-note'>{labels.unlockedNote}</p>}
   <Field label={labels.field} description={labels.fieldHint} error={error}>
    <Input className='hig-referral-input' value={draft} autoCapitalize='characters' autoComplete='off' spellCheck={false} maxLength={referralCodeMaxLength*2}
     onChange={event=>setDraft(normalizeCode(event.currentTarget.value))}/>
   </Field>
   <Button type='submit' fullWidth disabled={!draft}>{labels.set}</Button>
  </form>}
  {stage==='create'&&confirming&&<div className='hig-surface hig-referral-card'>
   <h3 className='hig-referral-confirm-title'>{labels.confirmTitle(draft)}</h3>
   <p className='hig-referral-code' aria-hidden='true'>{draft}</p>
   <InlineNotice severity='warning' title={labels.oneTime} description={labels.confirmWarning}/>
   <Checkbox label={labels.acknowledge} checked={acknowledged} disabled={busy} onCheckedChange={setAcknowledged}/>
   {error&&<p className='hig-referral-error' role='alert'>{error}</p>}
   <div className='hig-referral-actions'>
    <Button intent='secondary' disabled={busy} onClick={()=>{setConfirming(false);setAcknowledged(false);}}>{labels.cancel}</Button>
    <Button busy={busy} disabled={!acknowledged} onClick={confirm}>{labels.confirm}</Button>
   </div>
  </div>}
  {stage==='share'&&code&&<div className='hig-surface hig-referral-card'>
   <p className='hig-referral-eyebrow'>{labels.yourCode}</p>
   <p className='hig-referral-code'>{code}</p>
   {shareUrl&&<p className='hig-referral-link hig-number'>{shareUrl.replace(/^https?:\/\//,'')}</p>}
   {labels.shareNote&&<p className='hig-referral-note'>{labels.shareNote}</p>}
   {(onCopy||onShare)&&<div className='hig-referral-actions'>
    {onCopy&&<Button intent='secondary' onClick={()=>{Promise.resolve().then(()=>onCopy(code)).then(()=>setCopied(true),()=>{});}}><span aria-live='polite'>{copied?labels.copied:labels.copy}</span></Button>}
    {onShare&&<Button onClick={()=>onShare(code,shareUrl)}>{labels.share}</Button>}
   </div>}
  </div>}
 </section>;
}
