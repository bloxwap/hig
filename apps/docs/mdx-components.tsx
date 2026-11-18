import {Card,Cards} from 'fumadocs-ui/components/card';
import {Callout,CalloutContainer,CalloutDescription,CalloutTitle} from 'fumadocs-ui/components/callout';
import {Heading} from 'fumadocs-ui/components/heading';
import {Image} from 'fumadocs-core/framework';
import type {LinkProps} from 'fumadocs-core/link';
import {DocsLink} from '@/components/docs-link';
import {cn} from 'cn';
import type defaults from 'fumadocs-ui/mdx';
import type {MDXComponents} from 'mdx/types';
import type {HTMLAttributes} from 'react';
import {ComponentGroup} from '@/components/catalog';
import {CodeBlock,CodeBlockTab,CodeBlockTabs,CodeBlockTabsList,CodeBlockTabsTrigger} from '@/components/mdx-code';

function GuideLink({href='#',external,prefetch,...props}:LinkProps){
 const opensExternally=external??(/^\w+:/.test(href)||href.startsWith('//'));
 if(opensExternally)return <a href={href} target="_blank" rel="noreferrer noopener" {...props}/>;
 if(href.startsWith('#'))return <a href={href} {...props}/>;
 return <DocsLink href={href} prefetch={prefetch} {...props}/>;
}

function heading(as:'h1'|'h2'|'h3'|'h4'|'h5'|'h6'){
 return (props:HTMLAttributes<HTMLHeadingElement>)=><Heading as={as} {...props}/>;
}

const renderers={
 Card,Cards,Callout,CalloutContainer,CalloutDescription,CalloutTitle,
 CodeBlockTab:props=><CodeBlockTab {...props}/>,
 CodeBlockTabs:props=><CodeBlockTabs {...props}/>,
 CodeBlockTabsList:props=><CodeBlockTabsList {...props}/>,
 CodeBlockTabsTrigger:props=><CodeBlockTabsTrigger {...props}/>,
 a:GuideLink,
 img:({src,...props})=>src instanceof Blob?<img src={src} {...props} className={cn('rounded-lg',props.className)}/>:<Image src={src} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px" {...props} className={cn('rounded-lg',props.className)}/>,
 h1:heading('h1'),h2:heading('h2'),h3:heading('h3'),h4:heading('h4'),h5:heading('h5'),h6:heading('h6'),
 pre:(props:HTMLAttributes<HTMLPreElement>&{icon?:string})=><CodeBlock {...props} icon={props.title?props.icon:undefined}><pre tabIndex={0} className="min-w-full w-max *:flex *:flex-col">{props.children}</pre></CodeBlock>,
 table:props=><div className='docs-table-scroll prose-no-margin' role='region' aria-label='Scrollable table' tabIndex={0}><table {...props}/></div>,
} satisfies typeof defaults;

export function getMDXComponents(components:MDXComponents={}):MDXComponents{
 return {...renderers,ComponentGroup,...components};
}
