import {useBlockHorizontalInset} from './sheet-header-glow.js';
import React,{useEffect,useRef} from 'react';
import {Platform,View,type ScrollViewProps} from 'react-native';
import {nativeMetrics as tokens} from '@bloxwap/hig/tokens';
import {NumberFlow} from './animated-number.js';
import {speak} from './announce.js';
import {Button,Link} from './button.js';
import {Checkbox} from './checkbox.js';
import {useColors} from './provider.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {Alert} from './status.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {Stack, Text} from './surface.js';
import {AddressReadout} from './address-readout.js';

/** Where the claim stands. `ready`: the prize can be claimed. `claiming`: the payout is being sent. `paid`, `expired` and `withheld` are final: the actions give way to a status line. */
export type ClaimRewardStatus = 'ready' | 'claiming' | 'paid' | 'expired' | 'withheld';
/** A link the block draws: host text and its URL. A press opens the URL through `Linking.openURL`; `onSelect` replaces that navigation (a router or an in-app browser), so one press never does both. */
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
    /** Why Claim is unavailable while the attestation is unticked. Not drawn; it is the button's accessibility hint. */
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
  /** Pressable props for the header's Back, such as `{android_disableSound: true}` when the host plays its own sound, as `ScreenHeader` takes them. */
  backProps?: ScreenHeaderControlProps;
  /** A control on the trailing edge of the header, usually an IconButton. */
  headerAction?: React.ReactNode;
  /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
  stickyHeader?: boolean;
  /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
  stickyHeaderBackground?: string;
  /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
  scrollComponent?: React.ComponentType<ScrollViewProps>;
  /** `nativeID` of the title, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android). */
  headingId?: string;
  /** Prefix of the test IDs: `<testID>-header`, `-back`, `-title`, `-note`, `-attestation`, `-link-<index>`, `-status`, `-transaction`, `-cancel`, `-claim` and `-done`. Defaults to `claim-reward`. */
  testID?: string;
}

/** A prize and how to claim it: the amount, its details, the wallet and chain it is paid to, then either Cancel and Claim or, with the claim step, the attestation, the claim itself and its outcome. */
export function ClaimRewardBlock({amount, symbol, walletAddress, chain, details, labels, onClaim, onCancel, note, attestation, status, transaction, error, onBack, backProps, headerAction, stickyHeader, stickyHeaderBackground, scrollComponent, headingId, testID = 'claim-reward'}: ClaimRewardBlockProps) {
  const horizontalInset = useBlockHorizontalInset();
  const colors = useColors();
  const id = (part: string) => `${testID}-${part}`;
  const state = status ?? 'ready';
  const final = state === 'paid' || state === 'expired' || state === 'withheld';
  const claiming = state === 'claiming';
  const line = state === 'ready' ? undefined : labels[state];
  const unticked = !!attestation && !attestation.checked;
  const disabled = !Number.isFinite(amount) || amount <= 0 || !walletAddress.trim() || !chain.trim() || unticked;
  const reason = unticked && !claiming ? labels.attestationRequired : undefined;
  // Android reads the status line as a live region; iOS has none, so a changed line is spoken. The line a pane opens with is read in place.
  const spoken = useRef(line);
  useEffect(() => {
    if (spoken.current === line) return;
    spoken.current = line;
    if (Platform.OS === 'ios' && line) speak(line, 'info');
  }, [line]);
  const gap = tokens.space.md;
  const info: readonly {label: string; value: string; address?: boolean}[] = [
    ...(details ?? []),
    {label: labels.wallet, value: walletAddress, address: true},
    {label: labels.chain, value: chain},
  ];
  const link = (item: ClaimRewardLink, part: string) =>
    <Link key={part} testID={id(part)} href={item.href} onPress={item.onSelect ? () => item.onSelect?.() : undefined}>{item.label}</Link>;
  const rules = attestation?.links?.map((item, index) => link(item, `link-${index}`));
  const receipt = transaction ? link(transaction, 'transaction') : null;
  const header = <ScreenHeader testID={testID} title={labels.title} onBack={onBack} backProps={backProps} action={headerAction} headingId={headingId}/>;
  const body = <>
    <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'center',flexWrap:'wrap',gap:8}}>
      <NumberFlow value={amount} options={{maximumFractionDigits:6}} style={{fontSize:44,lineHeight:50,fontWeight:'700'}}/>
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
    {note ? <Text testID={id('note')} tone="muted" style={{paddingHorizontal:4,fontSize:14,lineHeight:21}}>{note}</Text> : null}
    {attestation && !final ? <View testID={id('attestation')} style={{paddingHorizontal:4}}>
      <Checkbox label={attestation.label} checked={attestation.checked} disabled={claiming} onCheckedChange={attestation.onCheckedChange}/>
      {rules?.length ? <View style={{flexDirection:'row',flexWrap:'wrap',columnGap:16}}>{rules}</View> : null}
    </View> : null}
    {error && !final ? <Alert severity="error" title={error}/> : null}
    {status !== undefined ? <View testID={id('status')} accessibilityLiveRegion={Platform.OS === 'ios' ? 'none' : 'polite'} style={line ? {paddingHorizontal:4} : {marginTop:-gap}}>
      {line ? <Text style={{fontWeight:'600',textAlign:'center',color:state === 'paid' ? colors.positive : colors.muted}}>{line}</Text> : null}
    </View> : null}
    {final
      ? <>
        {state === 'paid' && receipt ? <View style={{alignItems:'center'}}>{receipt}</View> : null}
        {labels.done ? <Button testID={id('done')} intent="secondary" fullWidth onPress={onCancel}>{labels.done}</Button> : null}
      </>
      : <View style={{flexDirection:'row',gap:8}}>
        <Button testID={id('cancel')} style={{flex:1}} intent="secondary" onPress={onCancel}>{labels.cancel}</Button>
        <Button testID={id('claim')} style={{flex:1}} disabled={disabled} busy={claiming} accessibilityHint={reason} onPress={onClaim}>{labels.claim}</Button>
      </View>}
  </>;
  // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
  if (stickyHeader) return <StickyHeaderLayout horizontalInset={horizontalInset} testID={testID} headerTestID={id('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{gap,paddingTop:gap}}>{body}</StickyHeaderLayout>;
  return <Stack testID={testID} style={{paddingHorizontal:horizontalInset}}>
    {header}
    {body}
  </Stack>;
}
