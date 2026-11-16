import React from 'react';
import {Platform,Pressable,Switch as RNSwitch,View} from 'react-native';
import {nativeMetrics as tokens} from '@bloxwap/hig/tokens';
import {Text} from './surface.js';
import {useColors,useControllable,useFills,useHIG} from './provider.js';
import type {CheckedProps} from './selection-types.js';
import {roleColor,type AccentRole} from './roles.js';
export type {AccentRole} from './roles.js';
/** react-native-web passes CSS transitions through style. */
const webEase={transitionProperty:'transform, background-color',transitionDuration:'150ms'} as object;
export interface SwitchProps extends CheckedProps {/** Token role for the on track; defaults to `action`. */tone?:AccentRole;/** Draws the track alone: `label` still names the switch but is not shown, for a switch whose row already shows its name (such as a ListRow `trailing` control). */hideLabel?:boolean;testID?:string}
/** The off track is the dark `border` grey, so it reads as off on the page and on a card. On iOS/Android the whole labeled row is one 48dp switch target; the platform track is a hidden visual indicator. */
export function Switch({label,checked,defaultChecked=false,disabled,tone,hideLabel,testID,onCheckedChange}:SwitchProps){const env=useHIG();const colors=useColors();const fills=useFills();const track={true:roleColor(tone,'action',colors),false:fills.raised};
 const [current,set]=useControllable(checked,defaultChecked,onCheckedChange);const web=Platform.OS==='web';const toggle=()=>{if(!disabled)set(!current);};
 // One pressable row is the switch on every platform; what sits inside is decoration. iOS/Android show the platform track (Android
 // otherwise paints the thumb with the app theme accent, Material teal, so it takes `text`). react-native-web's own Switch draws a
 // Material thumb wider than its track in that off-palette teal and would nest a second control, so web draws the 40×24 capsule of
 // @bloxwap/hig/react: an 18dp thumb inset 3dp that slides and eases over 150ms. RN Web presses on Enter; Space is handled here.
 return <Pressable testID={testID} accessibilityRole='switch' accessibilityLabel={label} accessibilityState={{checked:current,disabled:!!disabled}} aria-checked={current} aria-disabled={!!disabled} disabled={disabled} onPress={toggle} {...(web?{onKeyDown:(event:{key:string;repeat?:boolean;preventDefault():void})=>{if(event.key===' '){event.preventDefault();if(!event.repeat)toggle();}}}:null)} style={{direction:env.direction,minHeight:48,flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:tokens.space.md,opacity:web&&disabled?0.5:1}}>{hideLabel?null:<Text>{label}</Text>}<View pointerEvents='none' accessibilityElementsHidden importantForAccessibility='no-hide-descendants' aria-hidden={web||undefined} style={web?[{width:40,height:24,borderRadius:12,padding:3,backgroundColor:track[current?'true':'false']},webEase]:undefined}>{web?<View style={[{width:18,height:18,borderRadius:9,backgroundColor:current?colors.onAction:colors.text,transform:[{translateX:(current?16:0)*(env.direction==='rtl'?-1:1)}]},webEase]}/>:<RNSwitch value={current} disabled={disabled} onValueChange={next=>{if(!disabled)set(next);}} trackColor={track} thumbColor={Platform.OS==='android'?colors.text:undefined} ios_backgroundColor={fills.raised}/>}</View></Pressable>;}
export {SwitchRow,type SwitchRowProps} from './switch-row.js';
