import React from 'react';

/** The address as the two rows the block draws: split at the middle, with `anchor` on the characters people compare, the first 4 (6 when it starts with `0x`) and the last 4. An address too short to have a middle is all anchor. */
export function confirmAddressRows(address:string):{text:string;anchor:boolean}[][]{
 const characters=Array.from(address),head=address.startsWith('0x')?6:4,tail=characters.length-4,split=Math.ceil(characters.length/2);
 return [characters.slice(0,split),characters.slice(split)].map((row,rowIndex)=>{const parts:{text:string;anchor:boolean}[]=[];
  row.forEach((character,index)=>{const position=rowIndex*split+index,anchor=position<head||position>=tail,last=parts[parts.length-1];if(last&&last.anchor===anchor)last.text+=character;else parts.push({text:character,anchor});});
  return parts;});
}

export function AddressReadout({address}:{address:string}){
 return <span className='hig-confirm-address' dir='ltr' translate='no'><span className='hig-sr-only'>{address}</span><span aria-hidden='true'>{confirmAddressRows(address).map((row,index)=><span key={index}>{row.map((part,offset)=><span key={offset} data-anchor={part.anchor||undefined}>{part.text}</span>)}</span>)}</span></span>;
}
