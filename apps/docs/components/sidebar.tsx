'use client';

import {Sidebar,useSidebar,type SidebarProps} from 'fumadocs-ui/layouts/docs/slots/sidebar';
import {useEffect,useState} from 'react';

export function DocsSidebar(props:SidebarProps){
  const {mode,open}=useSidebar();
  const [hasOpened,setHasOpened]=useState(false);
  useEffect(()=>{
    if(open)setHasOpened(true);
  },[open]);
  // Once opened, keep the drawer mounted so its close animation and folder state survive.
  if(mode==='drawer'&&!open&&!hasOpened)return <aside id="nd-sidebar-mobile" hidden/>;
  return <Sidebar {...props}/>;
}
