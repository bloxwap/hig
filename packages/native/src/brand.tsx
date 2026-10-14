import React from 'react';
import Svg,{Rect,G,Path} from 'react-native-svg';
export function BrandMark({size=32,label}: {size?:number;label?:string}){return <Svg width={size} height={size} viewBox='0 0 100 100' accessible={!!label} accessibilityLabel={label}><Rect width='100' height='100' rx='22.37' fill='#00ff3f'/><G fill='none' stroke='#0a0a0a' strokeWidth='16' strokeLinecap='round'><Path d='M25 75L75 25'/><Path d='M24 24L35 35'/><Path d='M65 65L76 76'/></G></Svg>;}
export function CheckIcon(){return <Svg width='20' height='20' viewBox='0 0 24 24' accessible={false}><Path d='m5 12 4 4 10-10' fill='none' stroke='#fafafa' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/></Svg>;}
