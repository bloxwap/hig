import { Check } from '@bloxwap/icons/react/check';
import React from 'react';
import {brandMark as mark} from '@bloxwap/hig/tokens/brand';
/** The approved mark. Geometry and fills come from the pinned SVG through `@bloxwap/hig/tokens/brand`, so it does not follow `primaryColor` or the token palette. */
export function BrandMark({size=32,label}: {size?:number;label?:string}){return <svg width={size} height={size} viewBox={mark.viewBox} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}><rect width={mark.size} height={mark.size} rx={mark.radius} fill={mark.fill.srgb}/><g fill='none' stroke={mark.stroke.srgb} strokeWidth={mark.strokeWidth} strokeLinecap={mark.strokeLinecap}>{mark.paths.map(d=><path key={d} d={d}/>)}</g></svg>;}
export function CheckIcon(){return <Check size={20}/>;}
