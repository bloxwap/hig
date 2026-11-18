'use client';

import dynamic from 'next/dynamic';

export const CodeBlock=dynamic(()=>import('fumadocs-ui/components/codeblock').then(m=>m.CodeBlock));
export const CodeBlockTabs=dynamic(()=>import('fumadocs-ui/components/codeblock').then(m=>m.CodeBlockTabs));
export const CodeBlockTab=dynamic(()=>import('fumadocs-ui/components/codeblock').then(m=>m.CodeBlockTab));
export const CodeBlockTabsList=dynamic(()=>import('fumadocs-ui/components/codeblock').then(m=>m.CodeBlockTabsList));
export const CodeBlockTabsTrigger=dynamic(()=>import('fumadocs-ui/components/codeblock').then(m=>m.CodeBlockTabsTrigger));
