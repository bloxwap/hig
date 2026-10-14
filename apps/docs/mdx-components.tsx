import {CodeBlock,Pre} from 'fumadocs-ui/components/codeblock';
import defaults from 'fumadocs-ui/mdx';
import type {MDXComponents} from 'mdx/types';
export function getMDXComponents(components:MDXComponents={}):MDXComponents{return {...defaults,pre:(props)=><CodeBlock {...props}><Pre tabIndex={0}>{props.children}</Pre></CodeBlock>,...components};}
