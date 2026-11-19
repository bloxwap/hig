import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {useColors,useHIG} from './provider.js';
import {IconButton} from './button.js';
import {SeverityIcon} from './icons.js';
import {Text} from './surface.js';

export interface HeaderInfoProps {
 /** Accessible name of the info button: About Papertrade. */
 label:string;
 /** What the popover says. Host text. */
 children:React.ReactNode;
 /** `warning` and `negative` lead the popover with that severity's symbol in its colour. Default `muted`. */
 tone?:'muted'|'warning'|'negative';
 /** Test ID of the button; the popover is `<testID>-popover`. Default `header-info`. */
 testID?:string;
}
/**
 * An info button for the trailing edge of a header that shows a note in a popover hanging under it, as
 * TargetBlock's info does. The button toggles it and a press on the popover closes it. It lives in the
 * header, so it works when the header is pinned over a scroller.
 */
export function HeaderInfo({label,children,tone='muted',testID='header-info'}:HeaderInfoProps){
 const colors=useColors(),{direction}=useHIG();const [open,setOpen]=useState(false);
 const toneColor=tone==='warning'?colors.warning:tone==='negative'?colors.negative:null;
 return <View>
  <IconButton intent='ghost' label={label} suppressFeedback testID={testID} accessibilityState={{expanded:open}} onPress={()=>setOpen(current=>!current)}><SeverityIcon kind='info' color={colors.text}/></IconButton>
  {open?<Pressable testID={`${testID}-popover`} accessibilityLiveRegion='polite' onPress={()=>setOpen(false)} style={{position:'absolute',top:48,...(direction==='rtl'?{left:0}:{right:0}),width:280,zIndex:10,elevation:10,flexDirection:'row',alignItems:'flex-start',gap:8,padding:12,borderRadius:14,backgroundColor:colors.nested}}>
   {toneColor?<View accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><SeverityIcon kind={tone==='warning'?'warning':'error'} color={toneColor}/></View>:null}
   <Text style={{flex:1,color:colors.text,fontSize:14,lineHeight:21}}>{children}</Text>
  </Pressable>:null}
 </View>;
}
