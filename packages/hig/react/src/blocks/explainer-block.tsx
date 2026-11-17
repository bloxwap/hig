"use client";
import React,{useId} from 'react';
import {Button} from '../button.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
/** The colour of a section: its tint, its icon disc and its heading. */
export type ExplainerTone='up'|'down'|'positive'|'negative'|'warning';
/** One titled part of the explanation. Every field is optional, so a section can be a heading and a sentence, an icon row, or host media with a caption. */
export interface ExplainerSection {
 /** Stable key, also used in native test IDs. */
 id:string;
 /** The section's heading: Up. */
 title?:string;
 /** Muted text after the heading on the same line, such as what the heading means: → Momentum is rising. */
 meaning?:string;
 /** A glyph on the leading edge in a disc, drawn in `currentColor` (the tone's colour). Decorative: hidden from assistive technology. */
 icon?:React.ReactNode;
 /** Tints the section, its disc and its heading. Without it the section sits on the neutral fill. */
 tone?:ExplainerTone;
 /** Host content under the heading and before the body, centred, such as an example card and its caption. */
 media?:React.ReactNode;
 /** The section's text, muted. */
 body?:React.ReactNode;
 /** A small note at the end of the section, such as what the signal does not promise. */
 caveat?:React.ReactNode;
 /** The section's `data-testid`. */
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
 /** The button's `data-testid`. */
 testID?:string;
 /** A glyph after the label, such as an arrow for an action that opens something outside the app. Decorative: hidden from assistive technology, so the label alone names the button. */
 icon?:React.ReactNode;
}
export interface ExplainerBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading of the header. Leave it out inside a host dialog or sheet that draws its own title. */
 title?:string;
 /** A kicker above the title in small muted capitals: Builder fee. With `title` it is centred in the header over the heading; without one it is the block's first line. Host text. */
 eyebrow?:string;
 /** Short host text in a badge beside the title, as `ScreenHeader` `badge` (needs `title`): Demo. */
 badge?:string;
 /** A large figure or host media centred under the header and before the lead, such as a 68px “4% off” or a donut. Drawn as given; the host sets its size and colour, and hides decorative media from assistive technology. */
 hero?:React.ReactNode;
 /** A lead paragraph under the header, muted. */
 description?:React.ReactNode;
 /** The titled sections, in order. */
 sections?:readonly ExplainerSection[];
 /** Numbered steps after the sections, such as how to finish a task. */
 steps?:readonly React.ReactNode[];
 /** A small note after the sections and steps, such as what the whole explanation does not promise. */
 caveat?:React.ReactNode;
 /** Host content after the sections, steps and closing note and before the actions, such as a field, a link or a share card. Drawn as given. */
 children?:React.ReactNode;
 /** The main action: Got it, Copy link. */
 primaryAction?:ExplainerAction;
 /** A second action on the leading side of the main one, the two sharing the row equally: Not now. */
 secondaryAction?:ExplainerAction;
 /** Keeps the provider's feedback off the actions, for a host that plays its own cue. */
 suppressFeedback?:boolean;
 /** Shows Back on the leading edge of the header (needs `title`). */
 onBack?:()=>void;
 /** Attributes for the header's Back `<button>`. */
 backProps?:ScreenHeaderControlProps;
 /** A control on the trailing edge of the header, such as a Close `IconButton`. */
 headerAction?:React.ReactNode;
 /** `id` of the header's heading, so a dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
 /** Pins the header to the top of the nearest scroller. See Pinned headers. */
 stickyHeader?:boolean;
}
/** The actions' default intents. */
const primaryIntent='primary',secondaryIntent='secondary';
/**
 * How something works, or how to finish a task: an optional header, a lead paragraph, titled sections (each with an optional icon and
 * tone, a heading, media, a body and a caveat), numbered steps, a closing note, then one or two actions. Draws the “How Swing works” and
 * “How Trend works” sheets and short task dialogs such as inviting a friend.
 */
export function ExplainerBlock({title,eyebrow,badge,hero,description,sections=[],steps=[],caveat,children,primaryAction,secondaryAction,suppressFeedback,onBack,backProps,headerAction,headingId,stickyHeader,className,...rest}:ExplainerBlockProps){
 const id=useId();
 const action=(entry:ExplainerAction,fallback:'primary'|'secondary')=><Button intent={entry.intent??fallback} disabled={entry.disabled} busy={entry.busy} suppressFeedback={suppressFeedback} data-testid={entry.testID} onClick={entry.onSelect}>{entry.label}{entry.icon!=null&&entry.icon!==false?<span className='hig-explainer-action-icon' aria-hidden='true'>{entry.icon}</span>:null}</Button>;
 return <section {...rest} className={`hig-explainer${className?` ${className}`:''}`}>
  {title!==undefined?<ScreenHeader title={title} eyebrow={eyebrow} badge={badge} onBack={onBack} backProps={backProps} action={headerAction} headingId={headingId} stickyHeader={stickyHeader}/>:eyebrow?<p className='hig-explainer-eyebrow'>{eyebrow}</p>:null}
  {hero!=null&&hero!==false&&<div className='hig-explainer-hero'>{hero}</div>}
  {description!=null&&description!==false&&<p className='hig-explainer-text'>{description}</p>}
  {sections.length>0&&<div className='hig-explainer-sections'>{sections.map(section=>{const heading=section.title!==undefined?`${id}-${section.id}`:undefined;return <div key={section.id} className='hig-explainer-section' data-tone={section.tone} data-testid={section.testID}>
   {section.icon!=null&&<span className='hig-explainer-icon' aria-hidden='true'>{section.icon}</span>}
   <div>
    {section.title!==undefined&&<h3 id={heading}>{section.title}{section.meaning?<> <span>{section.meaning}</span></>:null}</h3>}
    {section.media!=null&&<div className='hig-explainer-media'>{section.media}</div>}
    {section.body!=null&&section.body!==false&&<div className='hig-explainer-text'>{section.body}</div>}
    {section.caveat!=null&&section.caveat!==false&&<p className='hig-explainer-text' data-caveat=''>{section.caveat}</p>}
   </div>
  </div>;})}</div>}
  {steps.length>0&&<ol className='hig-explainer-steps hig-explainer-text'>{steps.map((step,index)=><li key={index}>{step}</li>)}</ol>}
  {caveat!=null&&caveat!==false&&<p className='hig-explainer-text' data-caveat=''>{caveat}</p>}
  {children}
  {(primaryAction||secondaryAction)&&<div className='hig-confirm-actions'>{secondaryAction&&action(secondaryAction,secondaryIntent)}{primaryAction&&action(primaryAction,primaryIntent)}</div>}
 </section>;
}
