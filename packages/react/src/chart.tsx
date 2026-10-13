"use client";
import React,{Suspense,lazy} from 'react';
import type {ChartProps} from '@bloxwap/chart/react';
import type {DeepPartial,ChartConfig} from '@bloxwap/chart/config';
import {tokens} from '@bloxwap/hig-tokens';
const Chart=lazy(()=>import('@bloxwap/chart/react').then(m=>({default:m.Chart})));
export const chartTheme:DeepPartial<ChartConfig>={theme:{background:tokens.colors.surface.srgb,textColor:tokens.colors.text.srgb,borderColor:tokens.colors.border.srgb,fontFamily:'Bloxwap Sans, system-ui, sans-serif',monoFamily:'Bloxwap Mono, monospace'},grid:{color:tokens.colors.border.srgb},crosshair:{color:tokens.colors.muted.srgb,labelBackground:tokens.colors.action.srgb,labelColor:tokens.colors.onAction.srgb},series:{upColor:tokens.colors.buy.srgb,downColor:tokens.colors.sell.srgb}};
/** Web canvas only. Native uses labeled price rows; no embedded engine or WebView claim. */
export function PriceChart({summary,...props}:ChartProps & {summary:string}){return <figure><figcaption>{summary}</figcaption><Suspense fallback={<p role='status'>Loading chart…</p>}><Chart {...props} preset={chartTheme}/></Suspense></figure>;}
