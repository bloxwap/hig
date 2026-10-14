import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import {Provider} from '@/components/provider';
import {basePath} from '@/lib/site';
import localFont from 'next/font/local';
const BloxwapSans=localFont({src:'../../../node_modules/@bloxwap/font/fonts/BloxwapSans/BloxwapSans-Variable.woff2',variable:'--font-bloxwap-sans',weight:'100 900',display:'swap'});
const BloxwapMono=localFont({src:'../../../node_modules/@bloxwap/font/fonts/BloxwapMono/BloxwapMono-Variable.woff2',variable:'--font-bloxwap-mono',weight:'100 900',display:'swap'});
import './global.css';
export const metadata:Metadata={metadataBase:new URL(process.env.HIG_DOCS_ORIGIN??'https://bloxwap.github.io'),title:{default:'Bloxwap HIG',template:'%s · Bloxwap HIG'},description:'Human interface guidelines, components and feedback for web and native.',openGraph:{images:[{url:`${basePath}/og.png`,width:1200,height:630,alt:'Bloxwap HIG'}]},twitter:{card:'summary_large_image',images:[`${basePath}/og.png`]}};
export default function Layout({children}:{children:ReactNode}){return <html lang='en' className={`${BloxwapSans.variable} ${BloxwapMono.variable} dark`} suppressHydrationWarning><body><Provider>{children}</Provider></body></html>;}
