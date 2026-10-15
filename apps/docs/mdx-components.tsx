import {CodeBlock,Pre} from 'fumadocs-ui/components/codeblock';
import defaults from 'fumadocs-ui/mdx';
import type {MDXComponents} from 'mdx/types';
import {ComponentGroup} from '@/components/catalog';
export function getMDXComponents(components:MDXComponents={}):MDXComponents{
 return {
  ...defaults,
  ComponentGroup,
  pre:(props)=><CodeBlock {...props}><Pre tabIndex={0}>{props.children}</Pre></CodeBlock>,
  table:(props)=><div className='docs-table-scroll prose-no-margin' role='region' aria-label='Scrollable table' tabIndex={0}><table {...props}/></div>,
  ...components,
 };
}
