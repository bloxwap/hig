'use client';

import dynamic from 'next/dynamic';

const loadPopover = () => import('fumadocs-ui/components/ui/popover');

export const Popover = dynamic(() => loadPopover().then(module => module.Popover));
export const PopoverTrigger = dynamic(() => loadPopover().then(module => module.PopoverTrigger));
export const PopoverContent = dynamic(() => loadPopover().then(module => module.PopoverContent));
export const PopoverClose = dynamic(() => loadPopover().then(module => module.PopoverClose));
