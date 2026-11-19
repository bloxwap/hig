'use client';
import React from 'react';
import {receive, sendNetwork} from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {WalletAddress} from '../wallet-address.js';
import {SegmentedControl} from '../selection.js';
import {ScreenHeader} from './screen-header.js';

export type ReceiveNetwork = 'solana' | 'ethereum';

export type ReceiveBlockProps = {
  title?: string;
  onBack?: () => void;
  headingId?: string;
  onCopy?: (network: ReceiveNetwork, address: string) => void | Promise<void>;
} & (
  | {mode?: 'both'; solanaAddress: string; ethereumAddress: string}
  | {mode: 'solana'; solanaAddress: string; ethereumAddress?: string}
  | {mode: 'ethereum'; ethereumAddress: string; solanaAddress?: string}
);

const names = {solana: 'Solana', ethereum: 'Ethereum'};
// Ethereum leads: it is the first segment and the network shown until the viewer picks the other.
const options = [
  {value: 'ethereum', label: names.ethereum},
  {value: 'solana', label: names.solana},
];

export function ReceiveBlock({mode = 'both', solanaAddress, ethereumAddress, title, onBack, headingId, onCopy}: ReceiveBlockProps) {
  const {messages} = useHIG();
  const [selected, setSelected] = React.useState<ReceiveNetwork>('ethereum');
  const network = mode === 'both' ? selected : mode;
  const address = network === 'solana' ? solanaAddress : ethereumAddress;
  return <section className="hig-receive-block">
    <ScreenHeader title={title ?? messages.receive ?? receive} onBack={onBack} headingId={headingId}/>
    <div className="hig-receive-network">
      {mode !== 'both' && <h3>{names[network]}</h3>}
      {address && <WalletAddress key={network} kind={network} address={address} size={144}
        onCopy={onCopy && (() => onCopy(network, address))}/>}
    </div>
    {mode === 'both' && <SegmentedControl hideLabel label={messages.sendNetwork ?? sendNetwork} options={options}
      value={network} onValueChange={value => setSelected(value as ReceiveNetwork)}/>}
  </section>;
}
