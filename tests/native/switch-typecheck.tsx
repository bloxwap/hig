import React from 'react';
import {Text,View} from 'react-native';
import {SwitchRow} from '../../packages/native/src/switch.js';
export function NotificationSetting(){return <SwitchRow label='Notifications' checked={false} disabled accessibilityHint='Order updates' accessibilityState={{busy:true}} testID='notifications' style={({pressed})=>({padding:16,opacity:pressed?.7:1})} onCheckedChange={()=>{}}><View><Text>Notifications</Text><Text>Order updates</Text><View style={{width:48,height:28}}/></View></SwitchRow>;}
// @ts-expect-error host content still requires an accessible name
const unnamed=<SwitchRow><Text>Notifications</Text></SwitchRow>;
// @ts-expect-error HIG owns switch activation
const duplicate=<SwitchRow label='Notifications' onPress={()=>{}}><Text>Notifications</Text></SwitchRow>;
// @ts-expect-error HIG owns switch role
const wrongRole=<SwitchRow label='Notifications' accessibilityRole='button'><Text>Notifications</Text></SwitchRow>;
void unnamed;void duplicate;void wrongRole;
