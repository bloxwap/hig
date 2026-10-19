import React,{useEffect,useRef,useState} from 'react';
import {getLoadedFonts,useFonts} from 'expo-font';
import {Linking,ScrollView,View,Text as RNText,useWindowDimensions} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider,BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {HIGProvider,useColors} from '@bloxwap/hig-native/provider';
import {Heading,Text,Stack} from '@bloxwap/hig-native/surface';
import {Button} from '@bloxwap/hig-native/button';
import {RadioGroup} from '@bloxwap/hig-native/radio-group';
import {NumberReadout} from '@bloxwap/hig-native/data';
import {AnimatedNumberReadout} from '@bloxwap/hig-native/animated-number';
import {Toast,type Notice} from '@bloxwap/hig-native/status';
import {GestureSheet} from '@bloxwap/hig-native/gesture-sheet';

type Section='type'|'toast'|'sheet';
const families={400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'};
const scriptFamilies={ko:{400:'BloxwapSansKRRegular',600:'BloxwapSansKRSemiBold'},zh:{400:'BloxwapSansSCRegular',600:'BloxwapSansSCSemiBold'}};
const registered=['BloxwapSansRegular','BloxwapSansSemiBold','BloxwapMonoRegular','BloxwapSansKRRegular','BloxwapSansKRSemiBold','BloxwapSansSCRegular','BloxwapSansSCSemiBold'];

/** Optional, isolated #117–#121 adoption fixture; index-adoption.js avoids adding CJK assets to the gallery. */
function Checks(){
 const colors=useColors(),{fontScale}=useWindowDimensions();
 const [section,setSection]=useState<Section>('type'),[result,setResult]=useState('Ready'),[language,setLanguage]=useState('ko'),[value,setValue]=useState(1250.25),[dismissed,setDismissed]=useState<string[]>([]);
 const [open,setOpen]=useState(false),[card,setCard]=useState<'account'|'activity'>('account');
 const titleRef=useRef<RNText>(null),triggerRef=useRef<View>(null);
 useEffect(()=>{
  const apply=(url:string|null)=>{const requested=url?.match(/[?&]section=(type|toast|sheet)(?:&|$)/)?.[1] as Section|undefined;if(requested){setSection(requested);setResult('Ready');setOpen(false);setDismissed([]);}};
  void Linking.getInitialURL().then(apply);const subscription=Linking.addEventListener('url',({url})=>apply(url));return()=>subscription.remove();
 },[]);
 const notices:Notice[]=Array.from({length:8},(_,index):Notice=>({id:String(index+1),message:`Request ${index+1} failed`,description:'Check your connection before retrying.',severity:'error',closable:index!==1,action:<Button testID={`adoption-retry-${index+1}`} onPress={()=>setResult(`Recovered request ${index+1}`)}>{`Retry ${index+1}`}</Button>})).filter(notice=>!dismissed.includes(notice.id));
 const isAccount=card==='account',title=isAccount?'Account':'Activity';
 return <SafeAreaView style={{flex:1,backgroundColor:colors.background,padding:16,gap:12}}>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{(['type','toast','sheet'] as const).map(item=><Button key={item} intent='secondary' maxFontSizeMultiplier={1.3} onPress={()=>{setSection(item);setResult('Ready');}}>{item==='type'?'Type':item==='toast'?'Notices':'Sheet'}</Button>)}</View>
  <Text testID='adoption-ready' maxFontSizeMultiplier={1.3} style={{fontSize:14,lineHeight:20}}>{`Adoption ${section} · scale ${fontScale.toFixed(2)} · locale en-US`}</Text>
  <Text testID='adoption-result' maxFontSizeMultiplier={1.3} style={{fontSize:14,lineHeight:20}}>{result}</Text>
  {section==='type'?<ScrollView testID='adoption-type-scroll' contentContainerStyle={{gap:16}}>
   <Text testID='adoption-font-registration' maxFontSizeMultiplier={1.3} style={{fontSize:12,lineHeight:18}}>{`Registered faces: ${registered.filter(face=>getLoadedFonts().includes(face)).join(', ')}`}</Text>
   <RadioGroup label='Display language' value={language} onValueChange={setLanguage} options={[{value:'ko',label:'한국어',description:'Korean companion; English provider.',lang:'ko'},{value:'zh',label:'中文',description:'Chinese companion; English provider.',lang:'zh-Hans'},{value:'en',label:'English',description:'Latin face.',lang:'en'}]}/>
   <Text testID='adoption-ko-regular'>한국어 한국어</Text><Heading testID='adoption-ko-semibold'>한국어</Heading>
   <Text testID='adoption-zh-regular'>中文 中文</Text><Heading testID='adoption-zh-semibold'>中文</Heading>
   <NumberReadout value={1250.25} tone='positive' label='Positive balance' testID='adoption-positive' style={{fontFamily:'BloxwapMonoRegular',fontSize:20,lineHeight:30}} options={{minimumFractionDigits:2}}/>
   <NumberReadout value={-250.5} tone='negative' label='Negative change' testID='adoption-negative' style={{fontFamily:'BloxwapMonoRegular',fontSize:20,lineHeight:30}} options={{minimumFractionDigits:2}}/>
   <AnimatedNumberReadout value={value} tone='positive' label='Animated balance' testID='adoption-animated' style={{fontFamily:'BloxwapMonoRegular',fontSize:20,lineHeight:30}} options={{minimumFractionDigits:2}}/>
   <Button onPress={()=>setValue(current=>current+1)}>Update number</Button>
   <Button busy testID='adoption-busy'>Log out</Button>
  </ScrollView>:section==='toast'?<Toast testID='adoption-toast' notices={notices} onDismiss={id=>{setDismissed(current=>[...current,id]);setResult(`Dismissed request ${id}`);}}/>:<Stack>
   <Button ref={triggerRef} testID='adoption-open-sheet' onPress={()=>{setCard('account');setOpen(true);}}>Open account</Button>
   <Text>Each card owns its header, nested scrolling and close action.</Text>
  </Stack>}
  <GestureSheet open={open} onOpenChange={setOpen} contentMode='custom' title={title} titleRef={titleRef} snapPoints={isAccount?['45%','85%']:['70%']} returnFocusRef={triggerRef}>
   <View style={{flex:1,paddingHorizontal:16,paddingBottom:16}}>
    <View style={{gap:12,paddingBottom:12}}><Heading ref={titleRef} testID='adoption-card-title'>{title}</Heading><View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}><Button testID='adoption-switch-card' intent='secondary' onPress={()=>setCard(isAccount?'activity':'account')}>{isAccount?'Activity':'Back to account'}</Button><Button testID='adoption-close-sheet' intent='secondary' onPress={()=>{setOpen(false);setResult('Sheet closed');}}>Done</Button></View></View>
    <BottomSheetScrollView key={card} testID='adoption-card-scroll' contentContainerStyle={{gap:12,paddingBottom:24}}>{Array.from({length:30},(_,index)=><Text key={index}>{`${title} row ${index+1}`}</Text>)}<Button testID='adoption-card-end' onPress={()=>setResult(`Reached ${card} end`)}>{`End ${card}`}</Button></BottomSheetScrollView>
   </View>
  </GestureSheet>
 </SafeAreaView>;
}

export default function AdoptionCheck(){
 // Static references are required by Metro; this optional fixture alone loads the companion faces.
 /* eslint-disable @typescript-eslint/no-require-imports */
 const [loaded,error]=useFonts({BloxwapSansRegular:require('@bloxwap/hig-native-fonts/fonts/BloxwapSans.ttf'),BloxwapSansSemiBold:require('@bloxwap/hig-native-fonts/fonts/BloxwapSans-SemiBold.ttf'),BloxwapMonoRegular:require('@bloxwap/hig-native-fonts/fonts/BloxwapMono.ttf'),BloxwapSansKRRegular:require('@bloxwap/hig-native-fonts/fonts/BloxwapSansKR.ttf'),BloxwapSansKRSemiBold:require('@bloxwap/hig-native-fonts/fonts/BloxwapSansKR-SemiBold.ttf'),BloxwapSansSCRegular:require('@bloxwap/hig-native-fonts/fonts/BloxwapSansSC.ttf'),BloxwapSansSCSemiBold:require('@bloxwap/hig-native-fonts/fonts/BloxwapSansSC-SemiBold.ttf')});
 /* eslint-enable @typescript-eslint/no-require-imports */
 if(error)return <Text accessibilityRole='alert'>{`Adoption fonts failed: ${error.message}`}</Text>;
 if(!loaded)return <Text>Loading adoption faces…</Text>;
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><HIGProvider locale='en-US' fontFamily='BloxwapSansRegular' fontFamilies={families} fontFamiliesByScript={scriptFamilies} monoFontFamily='BloxwapMonoRegular'><BottomSheetModalProvider><Checks/></BottomSheetModalProvider></HIGProvider></SafeAreaProvider></GestureHandlerRootView>;
}
