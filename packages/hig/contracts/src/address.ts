export type AddressKind='ethereum'|'solana'|'bitcoin';
export type AddressOrientation='vertical'|'horizontal';

/** Layout inference only. Pass kind for ambiguous base58 addresses. */
export function addressKind(address:string):AddressKind {
 if(/^0x/i.test(address))return 'ethereum';
 if(/^(?:bc1|tb1|bcrt1)/i.test(address))return 'bitcoin';
 return 'solana';
}
export function addressGrid(address:string,kind:AddressKind,orientation:AddressOrientation){
 const verticalWidth={ethereum:6,bitcoin:5,solana:4}[kind];
 const width=orientation==='horizontal'?Math.max(1,Math.ceil(address.length/2)):verticalWidth;
 const head=orientation==='vertical'&&kind==='ethereum'?6:4;
 const tail=Math.max(head,address.length-4);
 const rows:{leading:string;middle:string;trailing:string}[]=[];
 for(let start=0;start<address.length;start+=width){
  const end=Math.min(start+width,address.length);
  rows.push({leading:address.slice(start,Math.min(head,end)),middle:address.slice(Math.max(start,head),Math.min(end,tail)),trailing:address.slice(Math.max(start,tail),end)});
 }
 return rows;
}
