import { Check } from '@bloxwap/icons/native/check';
import React from 'react';
import Svg,{Rect,G,Path} from 'react-native-svg';
import {brandMark as mark} from '@bloxwap/hig/tokens/brand';
import {useColors,useColorSpace} from './provider.js';
/** The approved mark. Geometry and fills come from the pinned SVG through `@bloxwap/hig/tokens/brand`, painted in the provider's colour space and independent of its primary colour. */
export function BrandMark({size=32,label}: {size?:number;label?:string}){const space=useColorSpace()==='display-p3'?'displayP3':'srgb';return <Svg width={size} height={size} viewBox={mark.viewBox} accessible={!!label} accessibilityLabel={label}><Rect width={String(mark.size)} height={String(mark.size)} rx={String(mark.radius)} fill={mark.fill[space]}/><G fill='none' stroke={mark.stroke[space]} strokeWidth={String(mark.strokeWidth)} strokeLinecap={mark.strokeLinecap}>{mark.paths.map(d=><Path key={d} d={d}/>)}</G></Svg>;}
export function CheckIcon(){const colors=useColors();return <Check size={20} color={colors.text}/>;}
