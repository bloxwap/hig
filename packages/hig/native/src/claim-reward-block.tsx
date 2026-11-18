import React from 'react';
import {View} from 'react-native';
import {AnimatedNumberReadout} from './animated-number.js';
import {Button} from './button.js';
import {ScreenHeader} from './screen-header.js';
import {Stack, Text} from './surface.js';
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
  const info: readonly {label: string; value: string; address?: boolean}[] = [
    ...(details ?? []),
    {label: labels.wallet, value: walletAddress, address: true},
    {label: labels.chain, value: chain},
  ];
  return <Stack>
    <ScreenHeader title={labels.title}/>
    <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'center',flexWrap:'wrap',gap:8}}>
      <AnimatedNumberReadout value={amount} options={{maximumFractionDigits:6}} style={{fontSize:44,lineHeight:50,fontWeight:'700'}}/>
      <Text tone="muted" style={{fontSize:24,fontWeight:'600'}}>{symbol}</Text>
    </View>
    <View style={{gap:12,paddingHorizontal:4}}>
      {info.map(detail =>
        <View key={detail.label} accessible accessibilityLabel={`${detail.label}, ${detail.value}`}
          style={{flexDirection:'row',flexWrap:'wrap',alignItems:'baseline',justifyContent:'space-between',gap:8}}>
          <Text tone="muted">{detail.label}</Text>
          <View style={{marginStart:'auto',maxWidth:'100%'}}>
            {detail.address ? <AddressReadout address={walletAddress}/> : <Text>{detail.value}</Text>}
          </View>
        </View>)}
    </View>
    <View style={{flexDirection:'row',gap:8}}>
      <Button style={{flex:1}} intent="secondary" onPress={onCancel}>{labels.cancel}</Button>
      <Button style={{flex:1}} disabled={disabled} onPress={onClaim}>{labels.claim}</Button>
    </View>
  </Stack>;
}
