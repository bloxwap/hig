import content from '@/src/content.json';
import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import {SidebarProvider,SidebarTrigger,useSidebar} from 'fumadocs-ui/layouts/docs/slots/sidebar';
import {DocsSidebar} from '@/components/sidebar';
import type {ReactNode} from 'react';
import {navigationTree} from '@/lib/source';
import {asset,layoutOptions} from '@/lib/site';
const sidebarSlots={sidebar:{provider:SidebarProvider,trigger:SidebarTrigger,useSidebar,root:DocsSidebar}};

export default function Layout({children}:{children:ReactNode}){
 const footer=<div className='docs-version'>HIG {content.version} · <a href={asset('/llms.txt')}>LLM text</a></div>;
 return <DocsLayout {...layoutOptions()} tree={navigationTree} slots={sidebarSlots} sidebar={{defaultOpenLevel:1,footer}}>
  {children}
 </DocsLayout>;
}
