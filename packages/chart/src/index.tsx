"use client";
// @bloxwap/hig-chart: the HIG adapter for @bloxwap/chart, moved out of @bloxwap/hig-react/chart (#96) so the
// shared hig-react manifest declares no @bloxwap/chart peer. Here the peer is required, never optional.
import React,{Suspense,lazy,useMemo} from 'react';
import type {ChartProps} from '@bloxwap/chart/react';
import type {DeepPartial,ChartConfig} from '@bloxwap/chart/config';
import {tokens} from '@bloxwap/hig-tokens';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG,useColors} from '@bloxwap/hig-react/provider';
const Chart=lazy(()=>import('@bloxwap/chart/react').then(m=>({default:m.Chart})));
export const chartTheme:DeepPartial<ChartConfig>={theme:{background:tokens.colors.surface.srgb,textColor:tokens.colors.text.srgb,borderColor:tokens.colors.border.srgb,fontFamily:'Bloxwap Sans, system-ui, sans-serif',monoFamily:'Bloxwap Mono, monospace'},grid:{color:tokens.colors.border.srgb},crosshair:{color:tokens.colors.muted.srgb,labelBackground:tokens.colors.action.srgb,labelColor:tokens.colors.onAction.srgb},series:{upColor:tokens.colors.buy.srgb,downColor:tokens.colors.sell.srgb}};
/** Web canvas only. Native uses labeled price rows; no embedded engine or WebView claim. */
export function PriceChart({summary,...props}:ChartProps & {summary:string}){const {messages}=useHIG();const colors=useColors();const theme=useMemo(()=>({...chartTheme,crosshair:{...chartTheme.crosshair,labelBackground:colors.action,labelColor:colors.onAction}}),[colors]);return <figure><figcaption>{summary}</figcaption><Suspense fallback={<p role='status'>{messages.loadingChart??en.loadingChart}</p>}><Chart {...props} preset={theme}/></Suspense></figure>;}
