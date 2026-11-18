"use client";
import React from 'react';
import {NumberFlow} from '../animated-number.js';
import {Button} from '../button.js';
import {ScreenHeader} from './screen-header.js';
import {AddressReadout} from './address-readout.js';

export interface ClaimRewardBlockProps {
  amount: number;
  symbol: string;
  walletAddress: string;
  chain: string;
  details?: readonly {label: string; value: string}[];
  labels: {title: string; claim: string; cancel: string; wallet: string; chain: string};
  /** Open the host's confirmation screen for this prize. */
  onClaim: () => void;
  onCancel: () => void;
}

export function ClaimRewardBlock({amount, symbol, walletAddress, chain, details, labels, onClaim, onCancel}: ClaimRewardBlockProps) {
  const disabled = !Number.isFinite(amount) || amount <= 0 || !walletAddress.trim() || !chain.trim();
  return <section className="hig-confirm hig-claim-reward-block">
    <ScreenHeader title={labels.title}/>
    <p className="hig-confirm-amount"><NumberFlow motion="slide" value={amount} options={{maximumFractionDigits:6}}/> <span className="hig-confirm-symbol">{symbol}</span></p>
    <dl className="hig-confirm-details">
      {details?.map(detail => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
      <div style={{flexWrap:'wrap'}}><dt>{labels.wallet}</dt><dd style={{marginInlineStart:'auto'}}><AddressReadout address={walletAddress}/></dd></div>
      <div><dt>{labels.chain}</dt><dd>{chain}</dd></div>
    </dl>
    <div className="hig-confirm-actions">
      <Button intent="secondary" onClick={onCancel}>{labels.cancel}</Button>
      <Button disabled={disabled} onClick={onClaim}>{labels.claim}</Button>
    </div>
  </section>;
}
