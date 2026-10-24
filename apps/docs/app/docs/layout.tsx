import content from '@/src/content.json';
import {DocsLayout} from 'fumadocs-ui/layouts/docs';
import type {ReactNode} from 'react';
import {source} from '@/lib/source';
import {asset,layoutOptions} from '@/lib/site';
export default function Layout({children}:{children:ReactNode}){return <DocsLayout {...layoutOptions()} tree={source.getPageTree()} sidebar={{defaultOpenLevel:1,footer:<div className='docs-version'>HIG {content.version} · <a href={asset('/llms.txt')}>LLM text</a></div>}}>{children}</DocsLayout>;}
