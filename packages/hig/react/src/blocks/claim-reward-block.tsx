"use client";
import React,{useId} from 'react';
import {NumberFlow} from '../animated-number.js';
import {Button,Link} from '../button.js';
import {Checkbox} from '../selection.js';
import {Alert} from '../status.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {AddressReadout} from './address-readout.js';

/** Where the claim stands. `ready`: the prize can be claimed. `claiming`: the payout is being sent. `paid`, `expired` and `withheld` are final: the actions give way to a status line. */
export type ClaimRewardStatus = 'ready' | 'claiming' | 'paid' | 'expired' | 'withheld';
/** A link the block draws: host text and its URL. It opens in a new tab; `onSelect` replaces that navigation, so one click never does both. */
export interface ClaimRewardLink {label: string; href: string; onSelect?: () => void}
/** The statement the winner must tick before the prize can be claimed. The host owns the words and the checked state. */
export interface ClaimRewardAttestation {
  /** The statement beside the checkbox, as one sentence. */
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Links under the statement, such as the official rules. */
  links?: readonly ClaimRewardLink[];
}
export interface ClaimRewardBlockProps {
  amount: number;
  symbol: string;
  walletAddress: string;
  chain: string;
  details?: readonly {label: string; value: string}[];
  labels: {title: string; claim: string; cancel: string; wallet: string; chain: string;
    /** The status line while `status` is `claiming`: Sending your prize… */
    claiming?: string;
    /** The status line when `status` is `paid`. */
    paid?: string;
    /** The status line when `status` is `expired`. */
    expired?: string;
    /** The status line when `status` is `withheld`, such as a prize under review. */
    withheld?: string;
    /** Why Claim is unavailable while the attestation is unticked. Not drawn; it is the button's description for assistive technology. */
    attestationRequired?: string;
    /** In a final status, shows one full-width button with this text that calls `onCancel`. Omitted, a final status draws no button. */
    done?: string};
  /** Without the claim step (no `attestation` or `status`): open the host's confirmation screen for this prize. With it: claim the prize; the host sends the payout and sets `status`. */
  onClaim: () => void;
  onCancel: () => void;
  /** Plain text under the details, such as where the prize is paid. */
  note?: string;
  /** A checkbox the winner must tick: Claim is unavailable until `checked` is true. Not drawn in a final status. */
  attestation?: ClaimRewardAttestation;
  /** Where the claim stands. Defaults to `ready`. Pass it from the first render, `ready` included, so the status line is announced when it changes. */
  status?: ClaimRewardStatus;
  /** A link under the status line when `status` is `paid`, such as the payout on a block explorer. */
  transaction?: ClaimRewardLink;
  /** A failed claim, drawn as an error alert above the actions. Claim stays available for another try. */
  error?: string;
  /** Shows Back on the leading edge of the header. */
  onBack?: () => void;
  /** Attributes for the header's Back `<button>`, such as a `data-testid`, as `ScreenHeader` takes them. */
  backProps?: ScreenHeaderControlProps;
  /** A control on the trailing edge of the header, usually an `IconButton`. */
  headerAction?: React.ReactNode;
  /** Pins the header to the top of the nearest scroller: transparent at rest, filled once content scrolls under it. See Pinned headers. */
  stickyHeader?: boolean;
  /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
  headingId?: string;
}

function link({label, href, onSelect}: ClaimRewardLink) {
  return <Link key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={onSelect ? event => { event.preventDefault(); onSelect(); } : undefined}>{label}</Link>;
}

/** A prize and how to claim it: the amount, its details, the wallet and chain it is paid to, then either Cancel and Claim or, with the claim step, the attestation, the claim itself and its outcome. */
export function ClaimRewardBlock({amount, symbol, walletAddress, chain, details, labels, onClaim, onCancel, note, attestation, status, transaction, error, onBack, backProps, headerAction, stickyHeader, headingId}: ClaimRewardBlockProps) {
  const reasonId = useId();
  const state = status ?? 'ready';
  const final = state === 'paid' || state === 'expired' || state === 'withheld';
  const claiming = state === 'claiming';
  const line = state === 'ready' ? undefined : labels[state];
  const unticked = !!attestation && !attestation.checked;
  const disabled = !Number.isFinite(amount) || amount <= 0 || !walletAddress.trim() || !chain.trim() || unticked;
  const reason = unticked && !claiming ? labels.attestationRequired : undefined;
  return <section className="hig-confirm hig-claim-reward-block" data-status={status}>
    <ScreenHeader title={labels.title} onBack={onBack} backProps={backProps} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>
    <p className="hig-confirm-amount"><NumberFlow value={amount} options={{maximumFractionDigits:6}}/> <span className="hig-confirm-symbol">{symbol}</span></p>
    <dl className="hig-confirm-details">
      {details?.map(detail => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
      <div style={{flexWrap:'wrap'}}><dt>{labels.wallet}</dt><dd style={{marginInlineStart:'auto'}}><AddressReadout address={walletAddress}/></dd></div>
      <div><dt>{labels.chain}</dt><dd>{chain}</dd></div>
    </dl>
    {note ? <p className="hig-claim-note">{note}</p> : null}
    {attestation && !final ? <div className="hig-claim-attestation">
      <Checkbox label={attestation.label} checked={attestation.checked} disabled={claiming} onCheckedChange={attestation.onCheckedChange}/>
      {attestation.links?.length ? <p className="hig-claim-links">{attestation.links.map(link)}</p> : null}
    </div> : null}
    {error && !final ? <Alert severity="error" title={error}/> : null}
    {status !== undefined ? <div className="hig-claim-status" role="status">{line ? <p>{line}</p> : null}</div> : null}
    {final
      ? <>
        {state === 'paid' && transaction ? <p className="hig-claim-links hig-claim-transaction">{link(transaction)}</p> : null}
        {labels.done ? <Button intent="secondary" fullWidth onClick={onCancel}>{labels.done}</Button> : null}
      </>
      : <div className="hig-confirm-actions">
        <Button intent="secondary" onClick={onCancel}>{labels.cancel}</Button>
        <Button disabled={disabled} busy={claiming} aria-describedby={reason ? reasonId : undefined} onClick={onClaim}>{labels.claim}</Button>
        {reason ? <span id={reasonId} className="hig-sr-only">{reason}</span> : null}
      </div>}
  </section>;
}
