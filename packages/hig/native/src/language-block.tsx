import { Check } from '@bloxwap/icons/native/check';
import {filterLanguages as matchLanguages} from '@bloxwap/hig/contracts';
import React,{useEffect,useMemo,useState} from 'react';
import {Image,Pressable,View,type FlatListProps,type ScrollViewProps,type ViewStyle} from 'react-native';
import {ListWithIntro,PickerFlatList,usePickerWindow} from './picker-flat-list.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {useColors,useFills,useLayoutDirection,useMessages} from './provider.js';
import {Text} from './surface.js';
import {IconButton} from './button.js';
import {SearchInput} from './field.js';
import {ChevronIcon} from './icons.js';
/** One language the host offers. */
export interface LanguageOption {
 /** Stable id the host switches on, usually a BCP 47 tag such as `pt-BR`. */
 code:string;
 /** The language in its own words: `Français`. */
 name:string;
 /** The language in the reader's words, shown under the name: `French`. Omit it where it would repeat the name. */
 description?:string;
 /** Round artwork, usually a flag: an image URL or a host element. Without it the row shows the first letters of the code. */
 flag?:string|React.ReactElement;
}
export interface LanguageBlockProps {
 /** Heading. Defaults to the built-in “Language”. */
 title?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton that closes the sheet. */
 headerAction?:React.ReactNode;
 languages:readonly LanguageOption[];
 /** `code` of the language in use. */
 value?:string|null;
 onSelect:(language:LanguageOption)=>void;
 /** Set false to leave out the search field, for a short list. Default `true`. */
 search?:boolean;
 /** Dims the rows and ignores presses, for example while a change is being applied. */
 disabled?:boolean;
 /** A muted line under the header that explains the screen: Choose the language used throughout the app. */
 description?:string;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** The host list in a bounded screen or sheet. Its first cell contains the search controls. */
 listComponent?:React.ComponentType<FlatListProps<LanguageOption|null>>;
 /** `nativeID` of the title, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 testID?:string;
}
export const filterLanguages:(languages:readonly LanguageOption[],query:string)=>LanguageOption[]=matchLanguages;
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40;
const LanguageRow=React.memo(function LanguageRow({language,name,description,flag,selected,disabled,onSelect,testID}:{
 name:LanguageOption['name'];description:LanguageOption['description'];flag:LanguageOption['flag'];
 language:LanguageOption;selected:boolean;disabled?:boolean;onSelect:LanguageBlockProps['onSelect'];testID?:string;
}){
 const colors=useColors(),fills=useFills();
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.well:'transparent'});
 return <Pressable testID={testID?`${testID}-${language.code}`:undefined} accessibilityRole='radio' accessibilityState={disabled?{checked:selected,disabled:true}:{checked:selected}} accessibilityLabel={[name,description].filter(Boolean).join(', ')} accessibilityLanguage={language.code} disabled={disabled} onPress={()=>onSelect(language)} style={disabled?({pressed})=>({...row(pressed),opacity:0.5}):({pressed})=>row(pressed)}>
     <View {...hidden}>{typeof flag==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:flag}} style={shape as object}/>:<View style={shape}>{flag??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{language.code.slice(0,2).toUpperCase()}</Text>}</View>}</View>
     <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
      <Text style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{name}</Text>
      {description?<Text style={{fontSize:14,lineHeight:20,color:colors.muted}}>{description}</Text>:null}
     </View>
     {selected?<Check size={20} color={colors.positive} testID={testID?`${testID}-check`:undefined}/>:null}
    </Pressable>;
});
/** Choose the app's language as one screen: a header, a search field, then each language as a row with its flag, its own name over the reader's name for it, and a check on the one in use. */
export function LanguageBlock({title,onBack,headerAction,languages,value=null,onSelect,search=true,disabled,description,stickyHeader,stickyHeaderBackground,scrollComponent,listComponent,headingId,testID}:LanguageBlockProps){
 const colors=useColors(),t=useMessages(),direction=useLayoutDirection();
 const [query,setQuery]=useState('');
 const [applied,setApplied]=useState('');
 const filterQuery=languages.length>50&&query.trim()?applied:query;
 function editQuery(next:string){
  setQuery(next);
  if(languages.length<=50||!next.trim())setApplied(next);
 }
 useEffect(()=>{
  if(filterQuery===query)return;
  const timer=setTimeout(()=>setApplied(query),150);
  return ()=>clearTimeout(timer);
 },[filterQuery,query]);
 const rows=useMemo(()=>filterQuery.trim()?filterLanguages(languages,filterQuery):languages,[languages,filterQuery]);
 const heading=title??t.language;
 const header=<View style={stickyHeader?{direction,flexDirection:'row',alignItems:'center',minHeight:44}:{flexDirection:'row',alignItems:'center',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID={testID?`${testID}-back`:undefined} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
  <Text testID={testID?`${testID}-title`:undefined} nativeID={headingId} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{heading}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
 </View>;
 const renderRow=(language:LanguageOption)=><LanguageRow key={language.code} language={language} name={language.name} description={language.description} flag={language.flag} selected={language.code===value} disabled={disabled} onSelect={onSelect} testID={testID}/>;
 const controls=<>
  {description?<Text testID={testID?`${testID}-description`:undefined} style={{paddingHorizontal:4,fontSize:14,lineHeight:21,color:colors.muted}}>{description}</Text>:null}
  {search?<SearchInput testID={testID?`${testID}-search`:undefined} accessibilityLabel={t.searchLanguages} placeholder={t.searchLanguages} value={query} onChangeText={editQuery} returnKeyType='search' autoCapitalize='none' autoCorrect={false} spellCheck={false}/>:null}
 </>;
 const empty=<Text testID={testID?`${testID}-empty`:undefined} accessibilityLiveRegion='polite' style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20,color:colors.muted}}>{t.noResults}</Text>;
 const windowed=usePickerWindow(languages.length,stickyHeader,!!listComponent);
 const cells=useMemo(():readonly (LanguageOption|null)[]=>listComponent?[null,...rows]:rows,[rows,listComponent]);
 if(windowed)return <PickerFlatList listComponent={listComponent??ListWithIntro<LanguageOption>} scrollComponent={stickyHeader||listComponent?scrollComponent:undefined} header={header} headerTestID={testID?`${testID}-sticky-header`:'language-sticky-header'} sticky={stickyHeader} background={stickyHeaderBackground} inset={16} direction={direction} rowHeight={60}
  testID={testID} data={cells} accessibilityRole="radiogroup" accessibilityLabel={heading} keyExtractor={item=>item?`language:${item.code}`:'controls'}
  renderItem={({item,index})=><View style={{direction,paddingHorizontal:16,paddingTop:item?(index===1?0:4):16,paddingBottom:!item&&(search||description)&&rows.length?16:0,gap:16}}>{item?renderRow(item):<>{controls}{rows.length===0?empty:null}</>}</View>}/>;
 const body=<>{controls}{rows.length===0?empty:
  <View testID={testID?`${testID}-list`:undefined} accessibilityRole='radiogroup' accessibilityLabel={heading} style={{gap:4}}>
   {rows.map(renderRow)}
  </View>}
 </>;
 // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={testID?`${testID}-sticky-header`:'language-sticky-header'} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
