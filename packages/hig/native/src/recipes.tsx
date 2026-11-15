import React,{useState} from 'react';
import {Platform} from 'react-native';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useHIG} from './provider.js';
import {Button,Link} from './button.js';
import {Surface,Stack,Heading,Text} from './surface.js';
import {Field,Input} from './field.js';
import {Dialog} from './overlay.js';
import {Row,Usd,Percent,List} from './data.js';
import {Toast,useTransientNotice} from './status.js';
export function MarketRow({symbol,name,price,change,onSelect}: {symbol:string;name:string;price:number|null;change:number|null;onSelect:()=>void}){return <Row><Button intent='ghost' onPress={onSelect}>{name} ({symbol})</Button><Usd value={price}/><Percent value={change}/></Row>;}
export function BalanceCard({label,balance,stale}: {label:string;balance:number|null;stale?:boolean}){const colors=useColors();return <Surface style={{gap:8}}><Text style={{color:colors.muted,fontSize:14,lineHeight:21}}>{label}</Text><Usd value={balance} stale={stale} style={{fontSize:24,lineHeight:30,fontWeight:'600'}}/></Surface>;}
/** The call to action that closes a form sits a double step, 16dp, below it (the Stack gap is 12). */
const formAction={marginTop:4};
/** In a dialog the confirm action is 16dp below the content and 8dp above the dialog's own closing button, which adds 4dp itself. */
const dialogAction={marginTop:4,marginBottom:-8};
export function TradeEntry({asset,amount,onAmountChange,onConfirm,busy,error,available}: {asset:string;amount:string;onAmountChange:(v:string)=>void;onConfirm:()=>void;busy?:boolean;error?:string;available:string}){const {messages}=useHIG();const [review,setReview]=useState(false);return <Surface><Stack><Heading>{(messages.reviewAssetOrder??en.reviewAssetOrder)(asset)}</Heading><Field label={(messages.amountInAsset??en.amountInAsset)(asset)} description={(messages.availableAmount??en.availableAmount)(available)} error={error}><Input keyboardType='decimal-pad' value={amount} onChangeText={onAmountChange} editable={!busy}/></Field><Button fullWidth style={formAction} disabled={!amount||!!error} busy={busy} onPress={()=>setReview(true)}>{messages.reviewOrder??en.reviewOrder}</Button><Dialog open={review} onOpenChange={setReview} title={messages.confirmOrder??en.confirmOrder} description={(messages.confirmOrderDescription??en.confirmOrderDescription)(amount,asset)}><Button busy={busy} disabled={!!error} style={dialogAction} onPress={onConfirm}>{messages.confirmOrder??en.confirmOrder}</Button>{error&&<Text accessibilityLiveRegion='polite'>{error}</Text>}</Dialog></Stack></Surface>;}
/** Code and commands stay monospace and left-to-right inside RTL roots. */
function useCodeStyle(){const env=useHIG();return {fontFamily:env.monoFontFamily??Platform.select({ios:'Menlo',default:'monospace'}),writingDirection:'ltr' as const,textAlign:'left' as const};}
/** A copy outcome shows as a transient toast capsule (about 4s, dismissible) and is announced the way Toast announces any notice. */
export function InstallCommand({command,onCopy}: {command:string;onCopy:()=>Promise<void>|void}){const {messages}=useHIG();const {notice,show,dismiss}=useTransientNotice();const code=useCodeStyle();
 return <Surface style={{gap:12}}><Text selectable style={code}>{command}</Text><Button intent='secondary' onPress={()=>{Promise.resolve().then(onCopy).then(()=>show(messages.copied??en.copied,'success')).catch(()=>show(messages.copyFailed??en.copyFailed,'error'));}}>{messages.copyInstallCommand??en.copyInstallCommand}</Button>{notice&&<Toast notices={[notice]} onDismiss={dismiss}/>}</Surface>;}
export function CodeWindow({language,children}:React.PropsWithChildren<{language:string}>){const code=useCodeStyle();return <Surface><Text>{language}</Text><Text selectable style={code}>{children}</Text></Surface>;}
export function MarketingHero({title,description,href,cta}: {title:string;description:string;href:string;cta:string}){return <Stack><Heading>{title}</Heading><Text>{description}</Text><Link href={href}>{cta}</Link></Stack>;}
export function ActivityList({items}: {items:readonly {id:string;label:string;status:string}[]}){const {messages}=useHIG();return <List items={items} keyFor={i=>i.id} render={i=><Row><Text>{i.label}</Text><Text>{i.status}</Text></Row>} empty={messages.noActivity??en.noActivity}/>;}
export {FromPicker,ToPicker,type FromPickerProps,type ToPickerProps,type PickerListProps} from './pickers.js';
export {SwapKeypad,SwapCapsule} from './swap-parts.js';
export {SwapPanel,swapAction,type SwapPanelProps,type SwapToken,type SwapArtwork,type SwapChain,type SwapAction,type SwapDenomination,type SwapWallet,type SwapFee,type SwapFigure,type SwapReceive,type SwapDestination,type SwapDetail,type SwapView} from './swap-panel.js';
