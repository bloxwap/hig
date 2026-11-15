import React,{useMemo,useState} from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
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
 testID?:string;
}
const fold=(text:string)=>text.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
/** The languages whose name, description or code contains the query, ignoring case and accents. An empty query keeps every language, in the host's order. */
export function filterLanguages(languages:readonly LanguageOption[],query:string):LanguageOption[]{
 const needle=fold(query.trim());
 return needle===''?[...languages]:languages.filter(language=>fold(`${language.name} ${language.description??''} ${language.code}`).includes(needle));
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40;
/** Choose the app's language as one screen: a header, a search field, then each language as a row with its flag, its own name over the reader's name for it, and a check on the one in use. */
export function LanguageBlock({title,onBack,headerAction,languages,value=null,onSelect,search=true,testID}:LanguageBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction}=useHIG();
 const [query,setQuery]=useState('');
 const rows=useMemo(()=>filterLanguages(languages,query),[languages,query]);
 const heading=title??t.language;
 const shape:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'center',gap:12,minHeight:56,paddingVertical:8,paddingStart:8,paddingEnd:16,borderRadius:28,backgroundColor:pressed?fills.well:'transparent'});
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  <View style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID={testID?`${testID}-back`:undefined} onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID={testID?`${testID}-title`:undefined} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{heading}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  {search?<SearchInput testID={testID?`${testID}-search`:undefined} accessibilityLabel={t.searchLanguages} placeholder={t.searchLanguages} value={query} onChangeText={setQuery} returnKeyType='search' autoCapitalize='none' autoCorrect={false} spellCheck={false}/>:null}
  {rows.length===0?<Text testID={testID?`${testID}-empty`:undefined} accessibilityLiveRegion='polite' style={{paddingVertical:32,textAlign:'center',fontSize:14,lineHeight:20,color:colors.muted}}>{t.noResults}</Text>:
  <View testID={testID?`${testID}-list`:undefined} accessibilityRole='radiogroup' accessibilityLabel={heading} style={{gap:4}}>
   {rows.map(language=>{const selected=language.code===value;
    return <Pressable key={language.code} testID={testID?`${testID}-${language.code}`:undefined} accessibilityRole='radio' accessibilityState={{checked:selected}} accessibilityLabel={[language.name,language.description].filter(Boolean).join(', ')} accessibilityLanguage={language.code} onPress={()=>onSelect(language)} style={({pressed})=>row(pressed)}>
     <View {...hidden}>{typeof language.flag==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:language.flag}} style={shape as object}/>:<View style={shape}>{language.flag??<Text accessible={false} maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{language.code.slice(0,2).toUpperCase()}</Text>}</View>}</View>
     <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
      <Text style={{fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{language.name}</Text>
      {language.description?<Text style={{fontSize:14,lineHeight:20,color:colors.muted}}>{language.description}</Text>:null}
     </View>
     {selected?<View {...hidden} testID={testID?`${testID}-check`:undefined} style={{width:20,height:20,alignItems:'center',justifyContent:'center'}}><View style={{width:6,height:12,borderRightWidth:2,borderBottomWidth:2,borderColor:colors.text,transform:[{translateY:-1},{rotate:'45deg'}]}}/></View>:null}
    </Pressable>;})}
  </View>}
 </View>;
}
