'use client';

import dynamic from 'next/dynamic';

const loadTabs=()=>import('fumadocs-ui/components/ui/tabs');

export const Tabs=dynamic(()=>loadTabs().then(module=>module.Tabs));
export const TabsList=dynamic(()=>loadTabs().then(module=>module.TabsList));
export const TabsTrigger=dynamic(()=>loadTabs().then(module=>module.TabsTrigger));
export const TabsContent=dynamic(()=>loadTabs().then(module=>module.TabsContent));
