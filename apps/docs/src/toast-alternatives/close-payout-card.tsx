'use client';
import { singleRowLayout, toastWidth } from './toast-layout';
import {Share, X} from 'lucide-react';
import {NumberReadout} from '@bloxwap/hig/react/data';
import {basePath} from '../../lib/site';

/** Compact payout alternative; sharing stays local to the gallery. */
export function ClosePayoutCard({pnlUsd, liquidated=false, onShare, onDismiss}:{
 pnlUsd:number; liquidated?:boolean; onShare:()=>void; onDismiss:()=>void;
}) {
 const win=pnlUsd>=0;
 return <div aria-label={liquidated?'Liquidated position payout':'Closed position payout'} className={`pointer-events-auto flex ${toastWidth} select-none items-center gap-3 rounded-full border-2 bg-background/95 ${singleRowLayout} pl-2 pr-2.5 ${win?'border-(--hig-up) toast-glow-up':'border-(--hig-down) toast-glow-down'}`}>
  <img src={`${basePath}/toast-alternatives/BTC.svg`} alt="Bitcoin" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full"/>
  <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap font-mono text-lg font-bold text-foreground [scrollbar-width:none]">
   <NumberReadout value={pnlUsd} options={{style:'currency',currency:'USD',signDisplay:'exceptZero',minimumFractionDigits:2,maximumFractionDigits:2}}/>
  </span>
  {win && !liquidated && <button type="button" aria-label={`Share BTC ${liquidated?'liquidation':'payout'}`} onClick={onShare} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-(--hig-up)/15 px-3 text-sm font-extrabold text-(--hig-up) hover:bg-(--hig-up)/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hig-up)"><Share size={16} aria-hidden="true"/>Share</button>}
  <button type="button" aria-label="Dismiss payout" onClick={onDismiss} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"><X size={16}/></button>
 </div>;
}
