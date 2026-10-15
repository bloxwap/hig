import {useFonts} from 'expo-font';
import {nativeColors} from '@bloxwap/hig-tokens';
import React,{useRef,useState} from 'react';
import {View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider,BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {HIGProvider} from '@bloxwap/hig-native/provider';
import {GestureSheet} from '@bloxwap/hig-native/gesture-sheet';
import {Button} from '@bloxwap/hig-native/button';
import {Text} from '@bloxwap/hig-native/surface';
/** Run with index-gesture.js; backend compilation does not certify OS gestures. */
export default function GestureSheetExample(){
 // Metro requires static asset references.
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const [loaded,error]=useFonts({BloxwapSansRegular:require('@bloxwap/hig-native-fonts/fonts/BloxwapSans.ttf'),BloxwapSansSemiBold:require('@bloxwap/hig-native-fonts/fonts/BloxwapSans-SemiBold.ttf')});
 const [open,setOpen]=useState(false),trigger=useRef<View>(null);
 if(error)return <Text>Font loading failed: {error.message}</Text>;if(!loaded)return <Text>Loading Bloxwap fonts…</Text>;
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><HIGProvider fontFamily='BloxwapSansRegular' fontFamilies={{400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'}}><BottomSheetModalProvider><SafeAreaView style={{flex:1,padding:24,backgroundColor:nativeColors.android.background}}><Text>Optional native gesture-sheet fixture</Text><Button ref={trigger} onPress={()=>setOpen(true)}>Open detent sheet</Button><GestureSheet open={open} onOpenChange={setOpen} title='Review details' description='Gesture dismissal can be canceled; Close and Android back remain explicit alternatives.' snapPoints={['50%','90%']} returnFocusRef={trigger}><BottomSheetTextInput style={{minHeight:48,color:nativeColors.android.text,fontFamily:'BloxwapSansRegular',fontSize:16,padding:12,borderWidth:1,borderColor:nativeColors.android.muted}} accessibilityLabel='Review note' placeholderTextColor={nativeColors.android.muted} placeholder='Optional review note'/><Text>Orientation and keyboard behavior are delegated to the native backend and require runtime observation.</Text></GestureSheet></SafeAreaView></BottomSheetModalProvider></HIGProvider></SafeAreaProvider></GestureHandlerRootView>;
}
