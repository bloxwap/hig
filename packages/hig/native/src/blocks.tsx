import React,{useState} from 'react';
import {Platform} from 'react-native';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG} from './provider.js';
import {Button,Link} from './button.js';
import {Surface,Stack,Heading,Text} from './surface.js';
import {Field,Input} from './field.js';
import {Dialog} from './overlay.js';
import {Toast,useTransientNotice} from './status.js';
export {MarketRow,type MarketRowProps} from './market-row.js';
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
export function MarketingHero({title,description,href,cta}: {title:string;description:string;href:string;cta:string}){return <Stack><Heading>{title}</Heading><Text>{description}</Text><Link href={href}>{cta}</Link></Stack>;}
export {AccountBlock,accountRows,accountSectionRows,accountSectionTotal,assetValue,AssetBalanceRow,type AccountBlockProps,type AccountAsset,type AccountSection,type AccountOrder,type AccountRowsOptions,type AssetArtwork,type AssetBalanceRowProps} from './account-block.js';
export {LanguageBlock,filterLanguages,type LanguageBlockProps,type LanguageOption} from './language-block.js';
export {TokenActionBlock,tokenActionLabel,type TokenActionBlockProps,type TokenAction,type TokenActionId} from './token-action-block.js';
export {ManagePositionBlock,positionCorridor,type ManagePositionBlockProps,type ManagePositionBlockLabels,type ManagePositionBlockAction,type ManagePositionBlockSummary,type ManagePositionBlockFigure,type ManagePositionIcon} from './manage-position-block.js';
export {TradeHistoryListBlock,tradeHistorySide,type TradeHistoryListBlockProps,type TradeHistoryListLabels,type TradeHistoryItem} from './trade-history-list-block.js';
export {TradeHistoryDetailBlock,type TradeHistoryDetailBlockProps,type TradeHistoryDetailLabels,type TradeHistoryDetail,type TradeHistoryAction} from './trade-history-detail-block.js';
export {TargetBlock,targetLayout,targetFormat,targetPresets,targetUnits,type TargetBlockProps,type TargetBlockLabels,type TargetKind,type TargetUnit,type TargetPrice,type TargetPreset,type TargetUnitOption} from './target-block.js';
export {AssetsBlock,filterAssets,type AssetsBlockProps,type AssetItem,type AssetCategory,type AssetSignal,type AssetsView} from './assets-block.js';
export {ProfileBlock,type ProfileBlockProps,type ProfileRow,type ProfileSection,type ProfileStatus,type ProfileAction,type ProfileFigure} from './profile-block.js';
export {PositionBlock,PositionBlockHeader,type PositionBlockProps,type PositionBlockHeaderProps,type PositionBlockDetail,type PositionBlockFigure,type PositionBlockRow,type PositionBlockFlag,type PositionBlockFlagAction} from './position-block.js';
export {RewardBlock,rewardProgress,type RewardBlockProps,type RewardPromo,type RewardEntry} from './reward-block.js';
export {SoundHapticsBlock,soundLevel,type SoundHapticsBlockProps,type SoundSection,type SoundVolume,type SettingAction} from './sound-haptics-block.js';
export {SignalsBlock,type SignalsBlockProps,type SignalsGroup,type SignalsItem} from './signals-block.js';
export {NotificationsBlock,type NotificationsBlockProps,type NotificationsItem} from './notifications-block.js';
export {FromPickerBlock,ToPickerBlock,FromPicker,ToPicker,type FromPickerBlockProps,type ToPickerBlockProps,type FromPickerProps,type ToPickerProps,type PickerListProps,type PickerInputProps,SwapHostContext} from './pickers.js';
export {SwapKeypad,SwapCapsule} from './swap-parts.js';
export {SwapPanelBlock,SwapPanel,swapAction,type SwapPanelBlockProps,type SwapPanelProps,type SwapToken,type SwapArtwork,type SwapChain,type SwapAction,type SwapDenomination,type SwapWallet,type SwapFee,type SwapFigure,type SwapReceive,type SwapDestination,type SwapDetail,type SwapView} from './swap-panel-block.js';
