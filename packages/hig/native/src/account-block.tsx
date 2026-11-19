import React from 'react';
import {View,VirtualizedList,type FlatListProps,type ScrollViewProps} from 'react-native';
import {ListWithIntro,PickerFlatList,sectionCellCount,sectionForCell} from './picker-flat-list.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {ChevronIcon,QrIcon} from './icons.js';
import {NumberFlow} from './animated-number.js';
import {AssetBalanceRow,type AssetArtwork} from './asset-balance-row.js';
export {AssetBalanceRow,type AssetArtwork,type AssetBalanceRowProps} from './asset-balance-row.js';
/** One holding in the account. The host supplies every value; HIG sorts, formats and lays it out. */
export interface AccountAsset {
 id:string;name:string;symbol:string;icon?:AssetArtwork;
 /** Holding in token units. */
 balance?:number|null;
 /** USD per unit. */
 price?:number|null;
 /** USD value; defaults to balance × price. */
 value?:number|null;
 /** Set false to draw no units line, for a holding whose units are the same figure as its value. */
 units?:boolean;
 /** Set false to draw this row plain even when the block has `onAssetSelect`. */
 selectable?:boolean;
 /** Format of the units figure; default `{maximumFractionDigits:6}`. */
 unitsOptions?:Intl.NumberFormatOptions;
 /** Host text after the units figure, such as ` PAPER`. */
 unitsSuffix?:string;
 /** Short muted host text under the figures, such as the ledger the holding sits in (Perp, Spot, Staked). */
 tag?:string;
 /** When the value is unknown but the balance is known: `units` (the default) headlines the units; `dash` shows the unknown dash over the units, for a value that is still loading. */
 unknownValue?:'units'|'dash';
}
/** Row order after the pinned asset: `value` (largest first, the default) or `given` (the order the host passed). */
export type AccountOrder='value'|'given';
/** How `accountRows` picks and orders: `order` after the pinned asset, and `pinnedId`, an asset id pinned in place of the symbol match. */
export interface AccountRowsOptions {order?:AccountOrder;pinnedId?:string}
/** A titled group of holdings with its own total, such as one ledger of the account. */
export interface AccountSection {
 id:string;
 /** Heading over the group. */
 title:string;
 /** The group's total in dollars, on the trailing edge of its heading; defaults to the sum of its asset values. `null` shows it as unknown. */
 total?:number|null;
 assets:readonly AccountAsset[];
 /** Row order in this group; defaults to the block's `order`. */
 order?:AccountOrder;
 /** Id of the asset that leads this group; defaults to the block's `pinnedId`, then the `pinnedSymbol` match. */
 pinnedId?:string;
}
export interface AccountBlockProps {
 /** Defaults to the localized "Account". */
 title?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** Shows a QR button on the trailing edge of the header, above the deposit action. The host shows the account address, for example with WalletAddress. */
 onShowAddress?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. Replaces the QR button. */
 headerAction?:React.ReactNode;
 /** Total in dollars; defaults to the sum of the asset values (with `sections`, the sum of the totals of the sections that are drawn, which is unknown when any of those totals is). `null` shows it as unknown. */
 balance?:number|null;
 /** Every holding as one list: the pinned asset, then the rest by value. Ignored when `sections` is set. */
 assets?:readonly AccountAsset[];
 /** Titled groups, each with its own total, drawn in the order given in place of the flat `assets` list. */
 sections?:readonly AccountSection[];
 /** Symbol of the asset pinned first; default 'USDC'. */
 pinnedSymbol?:string;
 /** Id of the asset pinned first, in place of the `pinnedSymbol` match, for a holding whose symbol is not unique. */
 pinnedId?:string;
 /** Order of the rows after the pinned one: `value` (largest first, the default) or `given` (the order passed). */
 order?:AccountOrder;
 /** Shows the deposit action beside the total. */
 onDeposit?:()=>void;
 depositLabel?:string;
 /** Makes each row a button that reports its asset, and with `sections` the section it is in. */
 onAssetSelect?:(asset:AccountAsset,section?:AccountSection)=>void;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** `nativeID` of the title, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 testID?:string;
}
const usdc='USDC',usdCoin='USD Coin';
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
/** An asset's dollar value: its own `value`, else balance × price, else unknown. */
export const assetValue=(asset:AccountAsset):number|null=>{
 const explicit=asset.value;
 const value=explicit!==undefined?explicit:asset.balance!=null&&asset.price!=null?asset.balance*asset.price:null;
 return value!=null&&Number.isFinite(value)?value:null;
};
/** The pinned asset (the one with `options.pinnedId`, else the first with `pinnedSymbol`, else a zero placeholder) and the rest by dollar value, largest first, unknown values last, ties by name, or with `options.order` `given` in the order passed. */
export function accountRows(assets:readonly AccountAsset[],pinnedSymbol:string=usdc,options:AccountRowsOptions={}):{pinned:AccountAsset;rest:AccountAsset[]}{
 const wanted=pinnedSymbol.toLowerCase();
 const found=(options.pinnedId===undefined?undefined:assets.find(asset=>asset.id===options.pinnedId))??assets.find(asset=>asset.symbol.toLowerCase()===wanted);
 const pinned=found??{id:pinnedSymbol,name:pinnedSymbol===usdc?usdCoin:pinnedSymbol,symbol:pinnedSymbol,balance:0,value:0};
 const others=assets.filter(asset=>asset!==found);
 if(options.order==='given'||others.length<2)return {pinned,rest:others};
 // Hermes sorts typed numeric keys without a JavaScript comparator. Only ties need collation.
 const groups=new Map<number,AccountAsset|AccountAsset[]>();
 for(const asset of others){
  const value=assetValue(asset)??-Infinity;
  const previous=groups.get(value);
  if(Array.isArray(previous))previous.push(asset);
  else groups.set(value,previous?[previous,asset]:asset);
 }
 const values=Float64Array.from(groups.keys()).sort();
 const rest:AccountAsset[]=[];
 let compare:((a:string,b:string)=>number)|undefined;
 for(let i=values.length-1;i>=0;i--){
  const group=groups.get(values[i])!;
  if(!Array.isArray(group)){rest.push(group);continue;}
  compare??=typeof Intl!=='undefined' && typeof Intl.Collator==='function'?new Intl.Collator().compare:(a,b)=>a.localeCompare(b);
  const compareNames=compare;
  group.sort((a,b)=>compareNames(a.name,b.name));
  for(const asset of group)rest.push(asset);
 }
 return {pinned,rest};
}
const sum=(assets:readonly AccountAsset[]):number|null=>{let total=0;for(const asset of assets){const value=assetValue(asset);if(value==null||!Number.isFinite(value))return null;total+=value;}return Number.isFinite(total)?total:null;};
/** A section's total: its own `total`, or the sum of its asset values. */
export const accountSectionTotal=(section:AccountSection):number|null=>section.total!==undefined?(section.total!=null&&Number.isFinite(section.total)?section.total:null):sum(section.assets);
/** The block total for `sections`: the sum of the section totals, or unknown (`null`) when any of them is unknown. Pass only the sections that are drawn. */
const accountSectionsTotal=(sections:readonly AccountSection[],readTotal:typeof accountSectionTotal):number|null=>{let all=0;for(const section of sections){const total=readTotal(section);if(total===null)return null;all+=total;}return Number.isFinite(all)?all:null;};
/** A section's rows in display order: the pinned asset first when the section holds it (no placeholder), then the rest by value as in `accountRows`. */
export function accountSectionRows(assets:readonly AccountAsset[],pinnedSymbol:string=usdc,options:AccountRowsOptions={}):{pinned:AccountAsset|null;rest:AccountAsset[]}{
 const {pinned,rest}=accountRows(assets,pinnedSymbol,options);return {pinned:assets.includes(pinned)?pinned:null,rest};
}
type SelectHolding=((asset:AccountAsset,sectionId?:string)=>void)|undefined;
const HoldingRow=React.memo(function HoldingRow({asset,pin=false,pinId,sectionId,onAssetSelect}:{
 asset:AccountAsset;pin?:boolean;pinId?:string;sectionId?:string;onAssetSelect:SelectHolding;
}){
 const prefix=sectionId===undefined?'account-asset':`account-section-${sectionId}-asset`;
 // A row pinned by symbol is the dollar balance, so its units would repeat its value; a row pinned by id keeps its own units setting.
 const value=assetValue(asset),units=(!pin||asset.id===pinId)&&asset.units!==false;
 const select=onAssetSelect&&asset.selectable!==false?()=>onAssetSelect(asset,sectionId):undefined;
 return <AssetBalanceRow testID={`${prefix}-${asset.id}`} name={asset.name} symbol={asset.symbol} icon={asset.icon} value={value} balance={units?asset.balance??null:undefined} balanceOptions={asset.unitsOptions} unitsSuffix={asset.unitsSuffix} tag={asset.tag} headline={units&&value===null&&asset.balance!=null&&asset.unknownValue!=='dash'?'units':undefined} onSelect={select}/>;
});

const SectionHeader = React.memo(function SectionHeader({section,total}:{section:AccountSection;total:number|null}){
 const {muted}=useColors();
 const prefix=`account-section-${section.id}`;
 return <View testID={`${prefix}-header`} style={{flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12,paddingHorizontal:4}}>
     <Text accessibilityRole='header' testID={`${prefix}-title`} style={{flexShrink:1,color:muted,fontSize:14,lineHeight:20,fontWeight:'500'}}>{section.title}</Text>
     <NumberFlow value={total} options={usd} tone='muted' testID={`${prefix}-total`} style={{fontSize:14,lineHeight:20,fontWeight:'500'}}/>
    </View>;
});

type AccountCell =
 | {kind:'summary'}
 | {kind:'heading';sectionId:string;sectionIndex:number;start:number;end:number;holding:(index:number)=>AccountCell}
 | {kind:'asset';asset:AccountAsset;sectionId?:string;pinned:boolean;pinId?:string};

const flatHoldingKey=(asset:AccountAsset|null)=>asset?'asset:'+asset.id:'summary';
function cellKey(cell:AccountCell){
 if(cell.kind==='summary')return 'summary';
 if(cell.kind==='heading')return 'heading:'+cell.sectionId;
 // Prefix the section length so arbitrary ledger and asset IDs have distinct boundaries.
 const section=cell.sectionId;
 return section===undefined?'asset:'+cell.asset.id:'ledger:'+section.length+':'+section+cell.asset.id;
}

type LedgerHeading=Extract<AccountCell,{kind:'heading'}>;
const summaryCell:AccountCell={kind:'summary'};
function ledgerItem(ledgers:readonly LedgerHeading[],index:number):AccountCell{
 if(index===0)return summaryCell;
 const heading=sectionForCell(ledgers,index);
 return index===heading.start?heading:heading.holding(index-heading.start-1);
}
function LedgerList(props:FlatListProps<AccountCell>){
 return <VirtualizedList {...props} getItemCount={sectionCellCount} getItem={ledgerItem}/>;
}

function createSectionListReader(pinnedSymbol:string,pinnedId:string|undefined,order:AccountOrder|undefined){
 type Group={id:string;assets:readonly AccountAsset[];pinId?:string;order?:AccountOrder;holding:(index:number)=>AccountCell};
 let groups:Group[]=[];
 let byId=new Map<string,Group>();
 let data:LedgerHeading[]=[];

 return (sections:readonly AccountSection[])=>{
  const next=sections.map(section=>{
   const pinId=section.pinnedId??pinnedId;
   const sectionOrder=section.order??order;
   const previous=byId.get(section.id);
   if(previous && previous.assets===section.assets && previous.pinId===pinId && previous.order===sectionOrder)return previous;
   const {assets,id}=section;
   let ordered:ReturnType<typeof accountSectionRows>|undefined;
   const cells:AccountCell[]=[];
   const holding=(index:number):AccountCell=>{
    if(cells[index])return cells[index];
    ordered??=accountSectionRows(assets,pinnedSymbol,{order:sectionOrder,pinnedId:pinId});
    const pinned=index===0&&ordered.pinned!==null;
    const asset=pinned?ordered.pinned!:ordered.rest[index-(ordered.pinned?1:0)];
    return cells[index]={kind:'asset',asset,pinned,pinId,sectionId:id};
   };
   return {id,assets,pinId,order:sectionOrder,holding};
  });
  if(next.length===groups.length && next.every((group,index)=>group===groups[index]))return data;
  let end=1;
  const result=next.map((group,sectionIndex):LedgerHeading=>{
   const start=end;
   end+=1+group.assets.length;
   return {kind:'heading',sectionId:group.id,sectionIndex,start,end,holding:group.holding};
  });
  groups=next;
  byId=new Map(next.map(group=>[group.id,group]));
  data=result;
  return result;
 };
}

const WalletHoldings=React.memo(function WalletHoldings({section,total,pinnedSymbol,pinId,order,onAssetSelect}:{
 section:AccountSection;total:number|null;pinnedSymbol:string;pinId?:string;order?:AccountOrder;
 onAssetSelect:SelectHolding;
}){
 const {assets}=section;
 const {pinned,rest}=React.useMemo(()=>accountSectionRows(assets,pinnedSymbol,{order,pinnedId:pinId}),[assets,pinnedSymbol,order,pinId]);
 const prefix=`account-section-${section.id}`;
 return <View testID={prefix} style={{gap:8}}>
  <SectionHeader section={section} total={total}/>
  <View testID={`${prefix}-assets`} style={{gap:8}}>{pinned?<HoldingRow key={pinned.id} asset={pinned} pin pinId={pinId} sectionId={section.id} onAssetSelect={onAssetSelect}/>:null}{rest.map(asset=><HoldingRow key={asset.id} asset={asset} pinId={pinId} sectionId={section.id} onAssetSelect={onAssetSelect}/>)}</View>
 </View>;
});

const noAssets:readonly AccountAsset[]=[];

/** The account as one screen: a header, the total with the deposit action, the pinned asset, then every other holding by value. */
export function AccountBlock({title,onBack,onShowAddress,headerAction,balance,assets=noAssets,sections,pinnedSymbol=usdc,pinnedId,order,onDeposit,depositLabel,onAssetSelect:hostSelect,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID}:AccountBlockProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const selection=React.useRef({hostSelect,sections});
 React.useLayoutEffect(()=>{selection.current={hostSelect,sections};},[hostSelect,sections]);
 const select=React.useCallback((asset:AccountAsset,sectionId?:string)=>{
  const current=selection.current;
  if(sectionId===undefined)current.hostSelect?.(asset);
  else{
   const section=current.sections?.find(wallet=>wallet.id===sectionId);
   if(section)current.hostSelect?.(asset,section);
  }
 },[]);
 const onAssetSelect=hostSelect?select:undefined;
 const shown=React.useMemo(()=>sections?.filter(section=>section.assets.length>0),[sections]);
 // An explicit balance lets offscreen section totals stay unevaluated until their headings mount.
 const holdingsTotal=React.useMemo(()=>{
  const totals=new WeakMap<readonly AccountAsset[],number|null>();
  return (holdings:readonly AccountAsset[])=>{
   const cached=totals.get(holdings);
   if(cached!==undefined)return cached;
   const value=sum(holdings);
   totals.set(holdings,value);
   return value;
  };
 },[]);
 const readTotal=React.useCallback((section:AccountSection)=>section.total===undefined?holdingsTotal(section.assets):accountSectionTotal(section),[holdingsTotal]);
 const total=React.useMemo(()=>balance!==undefined?balance:shown?accountSectionsTotal(shown,readTotal):holdingsTotal(assets),[balance,shown,assets,readTotal,holdingsTotal]);
 const flat=React.useMemo(()=>shown?null:accountRows(assets,pinnedSymbol,{order,pinnedId}),[shown,assets,pinnedSymbol,order,pinnedId]);
 const holdingCount=React.useMemo(()=>shown?shown.reduce((count,section)=>count+section.assets.length,0):flat!.rest.length+1,[shown,flat]);
 const windowed=!!stickyHeader && holdingCount>50;
 const windowSections=windowed && shown!==undefined;
 const readSections=React.useMemo(()=>windowSections?createSectionListReader(pinnedSymbol,pinnedId,order):undefined,[pinnedSymbol,pinnedId,order,windowSections]);
 const ledgers=React.useMemo(()=>shown&&readSections?readSections(shown):undefined,[shown,readSections]);
 const flatHoldings=React.useMemo(()=>windowed&&flat?[flat.pinned].concat(flat.rest):undefined,[windowed,flat]);
 const list=React.useMemo(()=>{
  if(windowed)return null;
  if(shown)return <View testID='account-sections' style={{gap:24,marginTop:16}}>{shown.map(section=>
   <WalletHoldings key={section.id} section={section} total={readTotal(section)} pinnedSymbol={pinnedSymbol}
    pinId={section.pinnedId??pinnedId} order={section.order??order} onAssetSelect={onAssetSelect}/>
  )}</View>;
  const {pinned,rest}=flat!;
  return <View testID='account-assets' style={{gap:8,marginTop:16}}><HoldingRow key={pinned.id} asset={pinned} pin pinId={pinnedId} onAssetSelect={onAssetSelect}/>{rest.map(asset=><HoldingRow key={asset.id} asset={asset} pinId={pinnedId} onAssetSelect={onAssetSelect}/>)}</View>;
 },[windowed,flat,shown,pinnedSymbol,pinnedId,order,onAssetSelect,readTotal]);
 const header=<View testID='account-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='account-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
  <Text testID='account-title' nativeID={headingId} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title??t.account}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction??(onShowAddress?<IconButton intent='ghost' label={t.showAddress} testID='account-address' onPress={onShowAddress}><QrIcon color={colors.text}/></IconButton>:null)}</View>
 </View>;
 const summary=<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginTop:8}}>
   <View style={{flexShrink:1}}><NumberFlow value={total} options={usd} label={t.accountBalance} testID='account-balance' style={{fontSize:32,lineHeight:40,fontWeight:'600'}}/></View>
   {onDeposit?<Button testID='account-deposit' onPress={onDeposit}>{depositLabel??t.deposit}</Button>:null}
  </View>;
 const listProps={testID,header,headerTestID:'account-sticky-header',sticky:true,scrollComponent,background:stickyHeaderBackground,direction,inset:16,rowHeight:68};
 if(flatHoldings)return <PickerFlatList<AccountAsset|null> {...listProps} listComponent={ListWithIntro<AccountAsset>} data={flatHoldings}
  keyExtractor={flatHoldingKey} renderItem={({item,index})=><View style={{paddingHorizontal:16,paddingTop:index===0?0:index===1?16:8}}>
   {item?<HoldingRow asset={item} pin={index===1} pinId={pinnedId} onAssetSelect={onAssetSelect}/>:summary}
  </View>}/>;
 if(ledgers)return <PickerFlatList<AccountCell> {...listProps} listComponent={LedgerList} data={ledgers} keyExtractor={cellKey} renderItem={({item,index})=>{
   const paddingTop=index===0?0:index===1?16:item.kind==='heading'?24:8;
   let content;
   if(item.kind==='heading'){
    const section=shown![item.sectionIndex];
    content=<SectionHeader section={section} total={readTotal(section)}/>;
   }else if(item.kind==='asset'){
    content=<HoldingRow asset={item.asset} pin={item.pinned} pinId={item.pinId} sectionId={item.sectionId} onAssetSelect={onAssetSelect}/>;
   }else content=summary;
   return <View style={{paddingHorizontal:16,paddingTop}}>{content}</View>;
  }}/>;
 const body=<>{summary}{list}</>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='account-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
