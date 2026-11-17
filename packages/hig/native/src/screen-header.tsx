import React from 'react';
import {View,type PressableProps,type StyleProp,type ViewStyle} from 'react-native';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {ChevronIcon,CloseIcon} from './icons.js';
import {Badge} from './status.js';
import {stickyHeaderFill} from './sticky-header.js';
export {ChevronIcon} from './icons.js';
export {useStickyHeaderScroll,type StickyHeaderScroll} from './sticky-header.js';
/** Pressable props passed through to a header control, such as `android_disableSound` or `onPressIn`. HIG keeps its own name, role, state, target and press. */
export type ScreenHeaderControlProps=Omit<PressableProps,'children'|'onPress'|'disabled'|'style'|'accessibilityLabel'|'accessibilityRole'|'accessibilityState'|'testID'>;
export interface ScreenHeaderProps {
 /** The heading, centred. Host text. */
 title:string;
 /** Shows Back on the leading edge. */
 onBack?:()=>void;
 /** Draws Back unavailable: dimmed, read as disabled and not pressable, for example while a close is being signed. */
 backDisabled?:boolean;
 /** Pressable props for Back, such as `{android_disableSound: true}` when the host plays its own sound. */
 backProps?:ScreenHeaderControlProps;
 /** A control on the trailing edge, usually an `IconButton`. */
 action?:React.ReactNode;
 /** Prefix of the test IDs: `<testID>-header`, `<testID>-back` and `<testID>-title`. Omitted, the header sets none. */
 testID?:string;
 /** Sets `nativeID` on the title, so a sheet around the pane can name itself with `accessibilityLabelledBy` (Android). Omitted, the title has none. */
 headingId?:string;
 /** A ref to the heading's accessible element (the title, or the title and badge as one header), for example to move accessibility focus to it when the pane opens. */
 titleRef?:React.Ref<React.ComponentRef<typeof View>>;
 /** Short host text in a badge beside the title, read as part of the heading after a pause: Demo. */
 badge?:string;
 /** A kicker over the title, centred in small muted capitals: Builder fee. Host text, read before the heading as its own element (test ID `<testID>-eyebrow`). The header grows to fit it. */
 eyebrow?:string;
 /** Hides the title visually while it stays the accessible heading, for a host that draws its own visible title and must not have it read twice. The header keeps its height. */
 hideTitle?:boolean;
 /** Host text that describes the pane, never drawn and read after the heading as its accessibility hint, such as a sheet's description. */
 description?:string;
 /** Marks the header as pinned in the host's scroller: it is transparent at rest and takes `stickyHeaderBackground` once `scrolled` is true. Get `scrolled` from `useStickyHeaderScroll()` on that scroller. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: content has scrolled under the header, so it draws its fill. */
 scrolled?:boolean;
 /** With `stickyHeader`: the fill once content is under the header. Defaults to the background role; in a sheet pass the sheet's fill (`useColors().overlay`). */
 stickyHeaderBackground?:string;
 /** With `stickyHeader`: space kept inside the fill above the row and to each side of it, such as the blocks' 16, so the inset fills with the header once content scrolls under it. Pass the inset here, not as `style` padding: React Native moves a sticky child's `style` onto its own wrapper, outside the fill. */
 inset?:number;
 /** Style of the header's container. With `stickyHeader` it sits outside the fill (React Native moves it onto the sticky slot's wrapper once pinned); put an inset in `inset`. */
 style?:StyleProp<ViewStyle>;
}
/** Pressable props for a header Close: those of `ScreenHeaderControlProps`, plus `disabled`, which draws Close unavailable (a faint glyph, read as disabled, not pressable), for example while the pane's action is being signed. */
export type HeaderCloseProps=ScreenHeaderControlProps&{disabled?:boolean};
/** The block header's Close control, shared by the blocks that draw one. */
export function HeaderClose({onClose,label,testID,closeProps}:{onClose:()=>void;label:string;testID?:string;closeProps?:HeaderCloseProps}){
 const colors=useColors(),off=!!closeProps?.disabled;
 return <IconButton {...closeProps} disabled={off} intent='ghost' label={label} suppressFeedback testID={testID} onPress={onClose}><CloseIcon color={off?colors.faint:colors.text}/></IconButton>;
}
/**
 * The header of a block that is its own screen: Back on the leading edge, the title centred, an optional control on the trailing
 * edge. The settings blocks (Notifications, Signals, Sound & Haptics) draw it; the other native blocks draw a header that matches
 * it. Import it from `@bloxwap/hig/native/screen-header` for a host pane that has no block.
 */
export function ScreenHeader({title,onBack,backDisabled,backProps,action,testID,headingId,titleRef,badge,eyebrow,hideTitle,description,stickyHeader,scrolled,stickyHeaderBackground,inset,style}:ScreenHeaderProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const id=(part:string)=>testID===undefined?undefined:`${testID}-${part}`;
 // Clear white stays in the accessibility tree where opacity 0 might not; the title keeps its line so the header keeps its height.
 const ink=hideTitle?'#ffffff00':colors.text;
 const heading={textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:ink} as const;
 const fill=stickyHeader?stickyHeaderFill(!!scrolled,stickyHeaderBackground??colors.background):undefined;
 const pad=stickyHeader&&inset?inset:0,height=44+pad;
 // Beside the sides the title fills the middle; under an eyebrow it sits in a column at its own height.
 const grow=eyebrow?null:{flex:1};
 const titleNode=badge?<View ref={titleRef} nativeID={headingId} accessible accessibilityRole='header' accessibilityLabel={`${title}, ${badge}`} accessibilityHint={description} style={{...grow,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,minWidth:0}}>
   <Text testID={id('title')} accessible={false} numberOfLines={1} style={{...heading,flexShrink:1}}>{title}</Text>
   {hideTitle?null:<View testID={id('badge')} style={{flexShrink:0}}><Badge><Text style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.text}}>{badge}</Text></Badge></View>}
  </View>:<Text ref={titleRef as unknown as React.Ref<React.ComponentRef<typeof Text>>} testID={id('title')} nativeID={headingId} accessibilityRole='header' accessibilityHint={description} numberOfLines={1} style={{...grow,...heading}}>{title}</Text>;
 const row=<View testID={id('header')} style={[{flexDirection:'row',alignItems:'center',minHeight:height},pad?{paddingTop:pad,paddingHorizontal:pad}:undefined,fill,stickyHeader?undefined:style]}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton {...backProps} intent='ghost' label={t.back} disabled={backDisabled} suppressFeedback testID={id('back')} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={backDisabled?colors.faint:colors.text}/></View></IconButton>:null}</View>
  {eyebrow?<View style={{flex:1,minWidth:0,gap:2}}><Text testID={id('eyebrow')} numberOfLines={1} style={{textAlign:'center',fontSize:12,lineHeight:16,letterSpacing:1.5,textTransform:'uppercase',color:colors.muted}}>{eyebrow}</Text>{titleNode}</View>:titleNode}
  <View style={{minWidth:44,alignItems:'flex-end'}}>{action}</View>
 </View>;
 // A pinned header is the host scroller's sticky child: React Native moves its `style` prop onto the slot's own wrapper and passes flex:1 in its
 // place, which in that column measures the child at its minimum height alone (0 plus padding). So the outer view carries only what may move
 // (the host's style) and a minimum height of the whole row, and the row, the inset and the fill sit on the inner view, pinned or not.
 return stickyHeader?<View style={[{minHeight:height},style]}>{row}</View>:row;
}
