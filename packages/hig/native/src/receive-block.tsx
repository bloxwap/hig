import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useMessages} from './provider.js';
import {Text} from './surface.js';
import {WalletAddress} from './wallet-address.js';
import {SegmentedControl} from './radio-group.js';
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

const styles = StyleSheet.create({
  block: {gap: 16},
  network: {alignItems: 'center', gap: 4},
  label: {fontSize: 16, fontWeight: '600'},
});

export function ReceiveBlock({mode = 'both', solanaAddress, ethereumAddress, title, onBack, headingId, onCopy}: ReceiveBlockProps) {
  const messages = useMessages();
  const [selected, setSelected] = React.useState<ReceiveNetwork>('ethereum');
  const network = mode === 'both' ? selected : mode;
  const address = network === 'solana' ? solanaAddress : ethereumAddress;
  return <View style={styles.block}>
    <ScreenHeader title={title ?? messages.receive} onBack={onBack} headingId={headingId}/>
    <View style={styles.network}>
      {mode !== 'both' && <Text accessibilityRole="header" style={styles.label}>{names[network]}</Text>}
      {address && <WalletAddress key={network} kind={network} address={address} size={144}
        onCopy={onCopy && (() => onCopy(network, address))}/>}
    </View>
    {mode === 'both' && <SegmentedControl hideLabel label={messages.sendNetwork} options={options}
      value={network} onValueChange={value => setSelected(value as ReceiveNetwork)}/>}
  </View>;
}
