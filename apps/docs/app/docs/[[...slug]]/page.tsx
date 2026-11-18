import {DocsBody,DocsDescription,DocsPage,DocsTitle,EditOnGitHub} from 'fumadocs-ui/layouts/docs/page';
import {TOCProvider} from 'fumadocs-ui/layouts/docs/page/slots/toc';
import {CompactContents,DesktopContents} from '@/components/table-of-contents';
import {notFound} from 'next/navigation';
import {source} from '@/lib/source';
import {GuideContainment} from '@/components/guide-containment';
import {getMDXComponents} from '@/mdx-components';
import {basePath} from '@/lib/site';
import {Demo} from '@/components/demo';
import demoContent from '@/src/demo-content.json';
import data from '@/src/content.json';
import {newRoutes} from '@/lib/fresh';
const tocSlots={toc:{provider:TOCProvider,main:DesktopContents,popover:CompactContents}};
export const dynamicParams=false;
export function generateStaticParams(){return source.generateParams();}
export async function generateMetadata({params}:{params:Promise<{slug?:string[]}>}){const page=source.getPage((await params).slug);return {title:page?.data.title,alternates:{canonical:`${basePath}${page?.url??'/docs'}/`}};}
export default async function Page({params}:{params:Promise<{slug?:string[]}>}){
 const slug=(await params).slug;
 const page=source.getPage(slug);
 if(!page)notFound();
 const Content=page.data.body;
 const route=slug?.join('/')??'';
 const original=data.pages.find(p=>p.route===route);
 return <DocsPage slots={tocSlots} toc={page.data.toc} footer={{className:'page-nav'}}>
  <DocsTitle>{page.data.title}{newRoutes.has(page.url)&&<span className='docs-new'>New</span>}</DocsTitle>
  <DocsDescription>{page.data.description}</DocsDescription>
  {(route.startsWith('components/')||route==='flow/token-action-flow')&&<Demo route={route} catalogEntry={demoContent.catalog.find(entry=>entry.route===route)} title={page.data.title}/>}
  <DocsBody className={route.startsWith('guides/')?'hig-guide-prose':undefined}><Content components={getMDXComponents()}/>{route.startsWith('guides/')&&<GuideContainment key={route}/>}</DocsBody>
  <div className='docs-page-links'><a href={`https://github.com/bloxwap/hig/blob/main/${original?.source??'docs/website.md'}`}>View source</a><EditOnGitHub href={`https://github.com/bloxwap/hig/edit/main/${original?.source??'docs/website.md'}`}/></div>
 </DocsPage>;
}
