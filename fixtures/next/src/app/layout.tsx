import React from 'react';
import '@bloxwap/hig-tokens/css';
import '@bloxwap/hig-react/css';
import {BloxwapSans} from '@bloxwap/font/sans';
export const metadata={title:'HIG Next consumer',description:'Packed-style client/SSR component boundaries'};
export default function Layout({children}:React.PropsWithChildren){return <html lang='en'><body className={BloxwapSans.className} style={{background:'var(--hig-background)',color:'var(--hig-text)',padding:24}}>{children}</body></html>;}
