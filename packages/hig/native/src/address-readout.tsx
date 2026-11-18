import React from 'react';
import {Platform} from 'react-native';
import {useColors,useHIG} from './provider.js';
import {Text} from './surface.js';

/** The address as the two rows the block draws: split at the middle, with `anchor` on the characters people compare, the first 4 (6 when it starts with `0x`) and the last 4. An address too short to have a middle is all anchor. */
export function confirmAddressRows(address:string):{text:string;anchor:boolean}[][]{
 const characters=Array.from(address),head=address.startsWith('0x')?6:4,tail=characters.length-4,split=Math.ceil(characters.length/2);
 return [characters.slice(0,split),characters.slice(split)].map((row,rowIndex)=>{const parts:{text:string;anchor:boolean}[]=[];
  row.forEach((character,index)=>{const position=rowIndex*split+index,anchor=position<head||position>=tail,last=parts[parts.length-1];if(last&&last.anchor===anchor)last.text+=character;else parts.push({text:character,anchor});});
  return parts;});
}

export function AddressReadout({address}:{address:string}){
 const colors=useColors(),{monoFontFamily}=useHIG();
 const type={fontFamily:monoFontFamily??Platform.select({ios:'Menlo',default:'monospace'}),fontSize:15,lineHeight:22};
 return <Text accessible={false} maxFontSizeMultiplier={1.2} style={{...type,writingDirection:'ltr',textAlign:'left'}}>{confirmAddressRows(address).map((row,index)=><React.Fragment key={index}>{index>0?'\n':null}{row.map((part,offset)=><Text key={offset} maxFontSizeMultiplier={1.2} style={{...type,color:part.anchor?colors.text:colors.muted,fontWeight:part.anchor?'700':'500'}}>{part.text}</Text>)}</React.Fragment>)}</Text>;
}
