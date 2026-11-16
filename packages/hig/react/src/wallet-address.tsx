"use client";
import React from 'react';
import {Cuer} from 'cuer';
import {WalletAddress as WalletAddressCore,type WalletAddressCoreProps} from './wallet-address-core.js';
export {VerticalAddress,addressKind,type AddressKind} from './data.js';
export type {WalletAddressCoreProps} from './wallet-address-core.js';
export interface WalletAddressProps extends Omit<WalletAddressCoreProps,'qr'> {
 /** QR payload when it differs from the address, for example an EIP-681 or Solana Pay URI. Defaults to the address. */
 qrValue?:string;
 /** Image URL shown in the centre of the QR; the code then uses high error correction. */
 arena?:string;
 /** The host's own QR drawing in place of the Cuer code; `qrValue` and `arena` are then unused. Without `cuer` installed, import `WalletAddress` from `wallet-address-core` instead. */
 qr?:React.ReactNode;
}
/**
 * A wallet address to scan or copy: a Cuer QR code beside the address in HIG's vertical style, for Ethereum-style and
 * Solana addresses. Needs the optional `cuer` peer. The host owns the clipboard through `onCopy`.
 */
export function WalletAddress({qrValue,arena,qr,...props}:WalletAddressProps){
 const code=qr??<Cuer.Root value={qrValue??props.address} errorCorrection={arena?'high':'medium'} color='currentColor' aria-hidden='true'><Cuer.Finder/><Cuer.Cells/>{arena&&<Cuer.Arena><img src={arena} alt='' style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:1}}/></Cuer.Arena>}</Cuer.Root>;
 return <WalletAddressCore {...props} qr={code}/>;
}
