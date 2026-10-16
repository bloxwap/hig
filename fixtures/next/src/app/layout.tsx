import React from 'react';
import '@bloxwap/hig-tokens/css';
// Page-wide element defaults (box-sizing, focus ring, table, range) are opt-in since #95; import them before the component CSS.
import '@bloxwap/hig-react/css/base';
import '@bloxwap/hig-react/css';
import {BloxwapSans} from '@bloxwap/font/sans';
import {BloxwapMono} from '@bloxwap/font/mono';
export const metadata={icons:{icon:'/favicon.svg'},title:'HIG Next consumer',description:'Packed-style client/SSR component boundaries'};
// The loader variables sit on <html> so --hig-font-sans/--hig-font-mono resolve to the hashed Next families (#65).
export default function Layout({children}:React.PropsWithChildren){return <html lang='en' className={`${BloxwapSans.variable} ${BloxwapMono.variable}`}><body style={{background:'var(--hig-background)',color:'var(--hig-text)',font:'var(--hig-type-body)',padding:24}}>{children}</body></html>;}
