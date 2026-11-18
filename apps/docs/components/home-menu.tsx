'use client';

import type {ReactNode} from 'react';

export function HomeMenu({children}:{children:ReactNode}){
  return <div popover="auto" id="home-navigation" onClick={event=>{
    if(event.target instanceof Element&&event.target.closest('a[href]'))event.currentTarget.hidePopover?.();
  }}>{children}</div>;
}
