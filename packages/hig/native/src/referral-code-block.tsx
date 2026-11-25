import React from 'react';
import {normalizeReferralCode,referralCodeMaxLength,referralCopiedMs,referralProgress,referralStage,referralVolumeFormat,type ReferralCodeBlockProps} from '@bloxwap/hig/contracts/referral';
export type {ReferralCodeBlockProps,ReferralCodeLabels,ReferralStage} from '@bloxwap/hig/contracts/referral';
export {normalizeReferralCode,referralProgress,referralStage} from '@bloxwap/hig/contracts/referral';
import {View} from 'react-native';
import {formatNumber} from './number-format.js';
import {useColors,useFills,useLayoutDirection,useMonoFontFamily,useNumberLocale,usePresentNumber} from './provider.js';
import {Surface,Text} from './surface.js';
import {NumberFlow} from './animated-number.js';
import {Button} from './button.js';
import {Field,Input} from './field.js';
import {Checkbox} from './checkbox.js';
import {InlineNotice} from './status.js';
import {ScreenHeader} from './screen-header.js';
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/**
 * A referral code in three stages. Trading towards the goal: the traded volume rolling with NumberFlow over a bar that fills to it.
 * Goal met: a field for the code, then a confirmation the trader must acknowledge, since a code is set once. Code set: the code and
 * its link, with Copy and Share.
 */
export function ReferralCodeBlock({volume,goal,volumeOptions=referralVolumeFormat,code,labels,onSetCode,busy,error,normalizeCode=normalizeReferralCode,shareUrl,onCopy,onShare,onBack,headingId}:ReferralCodeBlockProps){
 const colors=useColors();const fills=useFills();const direction=useLayoutDirection();const mono=useMonoFontFamily();
 const locale=useNumberLocale();const present=usePresentNumber();
 const stage=referralStage(volume,goal,code);
 const [draft,setDraft]=React.useState('');
 const [confirming,setConfirming]=React.useState(false);
 const [acknowledged,setAcknowledged]=React.useState(false);
 const [copied,setCopied]=React.useState(false);
 React.useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),referralCopiedMs);return()=>clearTimeout(timer);},[copied]);
 // A set code ends the confirmation, whoever set it.
 React.useEffect(()=>{if(code){setConfirming(false);setAcknowledged(false);}},[code]);
 const money=present(volumeOptions);
 const format=(value:number)=>formatNumber(value,locale,money);
 const confirm=()=>{if(!acknowledged||busy||!draft)return;Promise.resolve().then(()=>onSetCode(draft)).catch(()=>{/* The host's `error` explains; the confirmation stays open. */});};
 const share=referralProgress(volume,goal);
 const muted={fontSize:15,lineHeight:22,color:colors.muted} as const;
 const eyebrow={fontSize:12,lineHeight:16,letterSpacing:1.4,textTransform:'uppercase' as const,color:colors.muted};
 const codeStyle={padding:16,borderRadius:16,backgroundColor:fills.well,color:colors.text,fontFamily:mono,fontSize:30,lineHeight:36,fontWeight:'700' as const,letterSpacing:3,textAlign:'center' as const};
 const actions={direction,flexDirection:'row' as const,gap:8};
 return <View testID='referral-code' style={{gap:16}}>
  <ScreenHeader title={labels.title} onBack={onBack} backDisabled={busy} headingId={headingId}/>
  {stage==='progress'?<Surface testID='referral-code-progress' style={{gap:12}}>
   <Text style={eyebrow}>{labels.volume}</Text>
   <View accessible accessibilityLabel={`${volume==null?'':format(volume)} ${labels.goal(format(goal))}`} accessibilityRole='progressbar' accessibilityValue={{min:0,max:100,now:Math.round(share*100)}} style={{gap:4}}>
    <View {...hidden} style={{alignItems:'flex-start'}}><NumberFlow value={volume} options={money} tone='text' style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9}}/></View>
    <Text {...hidden} style={{...muted,fontFamily:mono}}>{labels.goal(format(goal))}</Text>
   </View>
   <View {...hidden} testID='referral-code-track' style={{direction,flexDirection:'row',height:8,borderRadius:4,backgroundColor:fills.raised,overflow:'hidden'}}>
    <View testID='referral-code-fill' style={{width:`${share*100}%`,minWidth:8,borderRadius:4,backgroundColor:colors.action}}/>
   </View>
   <View style={{direction,flexDirection:'row',justifyContent:'space-between',gap:12}}>
    <Text style={{fontSize:15,lineHeight:22,fontWeight:'600',fontFamily:mono,flexShrink:1}}>{labels.remaining(format(Math.max(0,goal-(volume??0))))}</Text>
    <Text style={{...muted,fontFamily:mono}}>{Math.floor(share*100)}%</Text>
   </View>
   {labels.progressNote?<Text style={muted}>{labels.progressNote}</Text>:null}
  </Surface>:null}
  {stage==='create'&&!confirming?<Surface testID='referral-code-create' style={{gap:12}}>
   <Text style={{fontSize:20,lineHeight:26,fontWeight:'700',color:colors.positive}}>{labels.unlocked}</Text>
   {labels.unlockedNote?<Text style={muted}>{labels.unlockedNote}</Text>:null}
   <Field label={labels.field} description={labels.fieldHint} error={error}>
    <Input testID='referral-code-input' value={draft} autoCapitalize='characters' autoCorrect={false} autoComplete='off' maxLength={referralCodeMaxLength*2}
     onChangeText={text=>setDraft(normalizeCode(text))} onSubmitEditing={()=>{if(draft)setConfirming(true);}} style={{fontFamily:mono,letterSpacing:1.5}}/>
   </Field>
   <Button testID='referral-code-set' fullWidth disabled={!draft} onPress={()=>setConfirming(true)}>{labels.set}</Button>
  </Surface>:null}
  {stage==='create'&&confirming?<Surface testID='referral-code-confirm' style={{gap:12}}>
   <Text accessibilityRole='header' style={{fontSize:20,lineHeight:26,fontWeight:'700'}}>{labels.confirmTitle(draft)}</Text>
   <Text {...hidden} style={codeStyle}>{draft}</Text>
   <InlineNotice severity='warning' title={labels.oneTime} description={labels.confirmWarning}/>
   <Checkbox label={labels.acknowledge} checked={acknowledged} disabled={busy} onCheckedChange={setAcknowledged}/>
   {error?<Text accessibilityLiveRegion='polite' style={{fontSize:15,lineHeight:22,color:colors.negative}}>{error}</Text>:null}
   <View style={actions}>
    <View style={{flex:1}}><Button testID='referral-code-cancel' intent='secondary' fullWidth disabled={busy} onPress={()=>{setConfirming(false);setAcknowledged(false);}}>{labels.cancel}</Button></View>
    <View style={{flex:1}}><Button testID='referral-code-confirm-button' fullWidth busy={busy} disabled={!acknowledged} onPress={confirm}>{labels.confirm}</Button></View>
   </View>
  </Surface>:null}
  {stage==='share'&&code?<Surface testID='referral-code-share' style={{gap:12}}>
   <Text style={eyebrow}>{labels.yourCode}</Text>
   <Text selectable style={codeStyle}>{code}</Text>
   {shareUrl?<Text selectable style={{fontSize:14,lineHeight:20,color:colors.muted,fontFamily:mono,textAlign:'center'}}>{shareUrl.replace(/^https?:\/\//,'')}</Text>:null}
   {labels.shareNote?<Text style={muted}>{labels.shareNote}</Text>:null}
   {onCopy||onShare?<View style={actions}>
    {onCopy?<View style={{flex:1}}><Button testID='referral-code-copy' intent='secondary' fullWidth onPress={()=>{Promise.resolve().then(()=>onCopy(code)).then(()=>setCopied(true),()=>{});}}>{copied?labels.copied:labels.copy}</Button></View>:null}
    {onShare?<View style={{flex:1}}><Button testID='referral-code-share-button' fullWidth onPress={()=>onShare(code,shareUrl)}>{labels.share}</Button></View>:null}
   </View>:null}
  </Surface>:null}
 </View>;
}
