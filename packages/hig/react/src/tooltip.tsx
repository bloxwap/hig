"use client";
import type React from 'react';
import {useHIG,useThemeStyle} from './provider.js';
import * as Tip from '@radix-ui/react-tooltip';
export function Tooltip({content,children}:React.PropsWithChildren<{content:string}>){const {direction,locale,density}=useHIG();const themeStyle=useThemeStyle();return <Tip.Provider><Tip.Root><Tip.Trigger asChild>{children}</Tip.Trigger><Tip.Portal><Tip.Content className='hig-popover hig-tooltip' sideOffset={6} collisionPadding={16} style={themeStyle} dir={direction} lang={locale} data-hig-density={density}>{content}</Tip.Content></Tip.Portal></Tip.Root></Tip.Provider>;}
