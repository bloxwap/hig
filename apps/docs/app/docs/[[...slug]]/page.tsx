import {DocsBody,DocsPage,DocsTitle,EditOnGitHub} from 'fumadocs-ui/page';
import {notFound} from 'next/navigation';
import {source} from '@/lib/source';
import {getMDXComponents} from '@/mdx-components';
import {basePath} from '@/lib/site';
import {Demo} from '@/components/demo';
import data from '@/src/content.json';
export const dynamicParams=false;
export function generateStaticParams(){return source.generateParams();}
export async function generateMetadata({params}:{params:Promise<{slug?:string[]}>}){const page=source.getPage((await params).slug);return {title:page?.data.title,alternates:{canonical:`${basePath}${page?.url??'/docs'}/`}};}
export default async function Page({params}:{params:Promise<{slug?:string[]}>}){const slug=(await params).slug;const page=source.getPage(slug);if(!page)notFound();const Content=page.data.body;const route=slug?.join('/')??'';const original=data.pages.find(p=>p.route===route);return <DocsPage toc={page.data.toc} footer={{className:'page-nav'}}><DocsTitle>{page.data.title}</DocsTitle><DocsBody>{route.startsWith('components/')&&<Demo route={route}/>}<Content components={getMDXComponents()}/></DocsBody><div className='flex flex-wrap items-center gap-4'><a href={`https://github.com/bloxwap/hig/blob/main/${original?.source??'docs/website.md'}`}>View source</a><EditOnGitHub href={`https://github.com/bloxwap/hig/edit/main/${original?.source??'docs/website.md'}`}/></div></DocsPage>;}
