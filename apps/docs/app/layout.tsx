import type {ReactNode} from 'react';
import type {Metadata,Viewport} from 'next';
import {Provider} from '@/components/provider';
import {basePath,origin} from '../site-config.mjs';
import './global.css';
// Let sheets use the device safe-area insets and keep browser chrome aligned with the dark canvas.
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0a0a0a'};
export const metadata:Metadata={metadataBase:new URL(origin),title:{default:'Bloxwap HIG',template:'%s · Bloxwap HIG'},description:'Human interface guidelines, components and feedback for web and native.',openGraph:{images:[{url:`${basePath}/og.png`,width:1200,height:630,alt:'Bloxwap HIG'}]},twitter:{card:'summary_large_image',images:[`${basePath}/og.png`]}};
// The server-rendered search button is actionable before the React provider mounts.
const earlySearch=`(()=>{
  let pending=false;
  function click(event){if(event.target instanceof Element&&event.target.closest('button[data-search]'))pending=true;}
  document.addEventListener('click',click,true);
  window.higTakeInitialSearch=()=>{
    document.removeEventListener('click',click,true);
    delete window.higTakeInitialSearch;
    return pending;
  };
})();`;
export default function Layout({children}:{children:ReactNode}){return <html lang='en' className="dark" dir="ltr" style={{colorScheme:'dark'}}><head><script dangerouslySetInnerHTML={{__html:earlySearch}}/><link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href={new URL('../fonts/docs-sans-common.woff2',import.meta.url).pathname}/></head><body><Provider>{children}</Provider></body></html>;}
