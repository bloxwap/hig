import React from 'react';
import {View,type ScrollViewProps} from 'react-native';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
/** The colour of a section: its tint, its icon disc and its heading. */
export type ExplainerTone='up'|'down'|'positive'|'negative'|'warning';
/** One titled part of the explanation. Every field is optional, so a section can be a heading and a sentence, an icon row, or host media with a caption. */
export interface ExplainerSection {
 /** Stable key, also used in the test IDs. */
 id:string;
 /** The section's heading: Up. */
 title?:string;
 /** Muted text after the heading on the same line, such as what the heading means: → Momentum is rising. */
 meaning?:string;
 /** A glyph on the leading edge in a 40dp disc, such as an icon drawn in `useColors()[tone]`. Decorative: hidden from assistive technology. */
 icon?:React.ReactNode;
 /** Tints the section, its disc and its heading. Without it the section sits on the neutral fill. */
 tone?:ExplainerTone;
 /** Host content under the heading and before the body, centred, such as an example card and its caption. */
 media?:React.ReactNode;
 /** The section's text, muted. A string is drawn as Text; anything else as given. */
 body?:React.ReactNode;
 /** A small note at the end of the section. A string is drawn as Text; anything else as given. */
 caveat?:React.ReactNode;
 /** The section's test ID, in place of `<testID>-section-<id>`. */
 testID?:string;
}
/** One action at the foot of the block. */
export interface ExplainerAction {
 label:string;
 onSelect:()=>void;
 /** Defaults to `primary` for `primaryAction` and `secondary` for `secondaryAction`. */
 intent?:'primary'|'secondary'|'destructive'|'ghost';
 disabled?:boolean;
 busy?:boolean;
 /** The button's test ID, in place of `<testID>-primary` or `<testID>-secondary`. */
 testID?:string;
}
export interface ExplainerBlockProps {
 /** Heading of the header. Leave it out inside a host sheet that draws its own title. */
 title?:string;
 /** A lead paragraph under the header, muted. A string is drawn as Text; anything else as given. */
 description?:React.ReactNode;
 /** The titled sections, in order. */
 sections?:readonly ExplainerSection[];
 /** Numbered steps after the sections, such as how to finish a task. A string is drawn as Text; anything else as given. */
 steps?:readonly React.ReactNode[];
 /** A small note after the sections and steps. */
 caveat?:React.ReactNode;
 /** The main action: Got it, Copy link. */
 primaryAction?:ExplainerAction;
 /** A second action on the leading side of the main one, the two sharing the row equally: Not now. */
 secondaryAction?:ExplainerAction;
 /** Keeps the provider's feedback off the actions, for a host that plays its own cue. */
 suppressFeedback?:boolean;
 /** Shows Back on the leading edge of the header (needs `title`). */
 onBack?:()=>void;
 /** Pressable props for Back, such as `{android_disableSound: true}`. */
 backProps?:ScreenHeaderControlProps;
 /** A control on the trailing edge of the header, such as a Close IconButton. */
 headerAction?:React.ReactNode;
 /** `nativeID` of the title, so a sheet can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child. Needs `title`; place it in a bounded container. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** Prefix of the test IDs: `<testID>-header`, `-back`, `-title`, `-description`, `-section-<id>` (with `-icon`, `-title`, `-media`, `-body` and `-caveat` after it), `-step-<index>`, `-caveat`, `-actions`, `-secondary` and `-primary`. Defaults to `explainer`. */
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** Test ID parts, which double as the actions' default intents. */
const primaryPart='primary',secondaryPart='secondary',descriptionPart='description',caveatPart='caveat';
/**
 * How something works, or how to finish a task, as a screen: an optional header, a lead paragraph, titled sections (each with an optional
 * icon and tone, a heading, media, a body and a caveat), numbered steps, a closing note, then one or two actions. Draws the "How Swing
 * works" and "How Trend works" sheets and short task dialogs such as inviting a friend.
 */
export function ExplainerBlock({title,description,sections=[],steps=[],caveat,primaryAction,secondaryAction,suppressFeedback,onBack,backProps,headerAction,headingId,stickyHeader,stickyHeaderBackground,scrollComponent,testID='explainer'}:ExplainerBlockProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG();
 const id=(part:string)=>`${testID}-${part}`;
 const muted={fontSize:14,lineHeight:20,color:colors.muted} as const;
 // Host text is drawn as muted Text; host nodes are drawn as given.
 const prose=(content:React.ReactNode,part:string)=>typeof content==='string'||typeof content==='number'?<Text testID={id(part)} style={muted}>{content}</Text>:<View testID={id(part)}>{content}</View>;
 const shown=(content:React.ReactNode)=>content!=null&&content!==false;
 const action=(entry:ExplainerAction,fallback:'primary'|'secondary')=><Button testID={entry.testID??id(fallback)} intent={entry.intent??fallback} disabled={entry.disabled} busy={entry.busy} suppressFeedback={suppressFeedback} onPress={entry.onSelect} style={{flex:1,alignSelf:'auto'}}>{entry.label}</Button>;
 const header=title!==undefined?<ScreenHeader title={title} onBack={onBack} backProps={backProps} action={headerAction} headingId={headingId} testID={testID}/>:null;
 const body=<>
  {shown(description)?prose(description,descriptionPart):null}
  {sections.length>0?<View testID={id('sections')} style={{gap:12}}>{sections.map(section=>{const part=`section-${section.id}`,bodyPart=`${part}-body`,sectionCaveatPart=`${part}-caveat`,tone=section.tone?colors[section.tone]:undefined;return <View key={section.id} testID={section.testID??id(part)} style={{direction,flexDirection:'row',alignItems:'center',gap:12,padding:12,borderRadius:16,backgroundColor:tone?withAlpha(tone,0.1):fills.well}}>
   {section.icon!=null?<View {...hidden} testID={id(`${part}-icon`)} style={{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:withAlpha(tone??colors.text,0.15)}}>{section.icon}</View>:null}
   <View style={{flex:1,minWidth:0,gap:4}}>
    {section.title!==undefined?<Text testID={id(`${part}-title`)} accessibilityRole='header' style={{fontSize:16,lineHeight:24,fontWeight:'700',color:tone??colors.text}}>{section.title}{section.meaning?<Text style={{color:colors.muted}}>{` ${section.meaning}`}</Text>:null}</Text>:null}
    {section.media!=null?<View testID={id(`${part}-media`)} style={{alignItems:'center',gap:8,marginVertical:12}}>{section.media}</View>:null}
    {shown(section.body)?prose(section.body,bodyPart):null}
    {shown(section.caveat)?prose(section.caveat,sectionCaveatPart):null}
   </View>
  </View>;})}</View>:null}
  {steps.length>0?<View testID={id('steps')} style={{gap:8}}>{steps.map((step,index)=><View key={index} testID={id(`step-${index}`)} accessible={typeof step==='string'||typeof step==='number'} style={{direction,flexDirection:'row',gap:8}}>
   <Text style={{...muted,minWidth:16,fontVariant:['tabular-nums']}}>{`${index+1}.`}</Text>
   {typeof step==='string'||typeof step==='number'?<Text style={{...muted,flexShrink:1}}>{step}</Text>:<View style={{flexShrink:1}}>{step}</View>}
  </View>)}</View>:null}
  {shown(caveat)?prose(caveat,caveatPart):null}
  {primaryAction||secondaryAction?<View testID={id('actions')} style={{direction,flexDirection:'row',gap:8}}>
   {secondaryAction?action(secondaryAction,secondaryPart):null}
   {primaryAction?action(primaryAction,primaryPart):null}
  </View>:null}
 </>;
 if(stickyHeader&&header)return <StickyHeaderLayout testID={testID} headerTestID={id('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
