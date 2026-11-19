import React from 'react';
import {QRCode} from './qr-code.js';
import {WalletAddress as WalletAddressCore,WalletAddressFrame,type WalletAddressCoreProps} from './wallet-address-core.js';
export {VerticalAddress,addressKind,type AddressKind} from './data.js';
export type {WalletAddressCoreProps} from './wallet-address-core.js';
export interface WalletAddressProps extends Omit<WalletAddressCoreProps,'qr'> {
 /** QR payload when it differs from the address, e.g. an EIP-681 or Solana Pay URI. Defaults to the address. */
 qrValue?:string;
 /** Image URL shown in the centre of the QR. */
 arena?:string;
 /** The host's own QR drawing in place of HIG's code; `qrValue` and `arena` are then unused and nothing is encoded. A host that draws every code itself can import `WalletAddress` from `wallet-address-core`, which loads no SVG. */
 qr?:React.ReactNode;
}
/**
 * A wallet address to scan or copy: HIG's own `QRCode` (round dots, rounded finder patterns, no tile) beside the address
 * as a monospace column exactly as tall as the code. Ethereum (`0x…`) lays out 6 characters a row and Solana 4. With
 * `onCopy` the whole component is one button and a Tap to copy hint sits under it. Needs the optional
 * `react-native-svg` peer, as `QRCode` does, and no QR package.
 */
export function WalletAddress({qrValue,arena,qr,...props}:WalletAddressProps){
 // As on web, `null` falls back to HIG's code like a missing `qr`.
 if(qr!=null)return <WalletAddressCore {...props} qr={qr}/>;
 return <WalletAddressFrame {...props} code={<QRCode value={qrValue??props.address} arena={arena} size={props.size??196} quietZone={0} background='none' testID='wallet-address-qr'/>}/>;
}
