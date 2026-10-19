import React,{createRef,useState} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Dialog} from '../packages/react/src/overlay';
import {HIGProvider} from '../packages/react/src/provider';
afterEach(cleanup);

describe('host dialog composition',()=>{
 it('filters unsafe JavaScript content props without changing the frozen caller object',async()=>{
  const supplied=Object.freeze({id:'foreign-id',children:<p>Foreign content</p>,asChild:true,forceMount:true,role:'status',dir:'ltr',lang:'fr','aria-labelledby':'foreign-name','aria-describedby':'foreign-description',dangerouslySetInnerHTML:{__html:'<p>Injected HTML</p>'},className:'host-card'});
  const before={...supplied};
  function Example(){const [open,set]=useState(false);return <HIGProvider locale='ar-EG' direction='rtl'><Dialog open={open} onOpenChange={set} title='Host review' description='Host description' trigger={<button>Open safe dialog</button>} contentProps={supplied as unknown as React.ComponentProps<typeof Dialog>['contentProps']}><p>Host content</p></Dialog></HIGProvider>;}
  render(<Example/>);
  const trigger=screen.getByRole('button',{name:'Open safe dialog'});
  await userEvent.click(trigger);
  const dialog=screen.getByRole('dialog',{name:'Host review'});
  expect(dialog.id).toBe(trigger.getAttribute('aria-controls'));
  expect(dialog.id).not.toBe('foreign-id');
  expect(dialog.getAttribute('dir')).toBe('rtl');
  expect(dialog.getAttribute('lang')).toBe('ar-EG');
  expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe('Host description');
  expect(dialog.classList.contains('host-card')).toBe(true);
  expect(screen.getByText('Host content')).toBeTruthy();
  expect(screen.queryByText('Foreign content')).toBeNull();
  expect(screen.queryByText('Injected HTML')).toBeNull();
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(supplied).toEqual(before);
  expect(Object.isFrozen(supplied)).toBe(true);
 });
 it('preserves naming and content refs with hidden headings and no description',()=>{
  const ref=createRef<HTMLDivElement>();
  const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
  try{
   render(<Dialog open onOpenChange={()=>{}} title='Referral details' titleHidden contentRef={ref} contentProps={{className:'host-card',style:{maxWidth:420}}} closeButton={null}><h2>Visible referral heading</h2><button>Dismiss referral</button></Dialog>);
   const dialog=screen.getByRole('dialog',{name:'Referral details'});
   expect(ref.current).toBe(dialog);
   expect(dialog.classList.contains('hig-dialog')).toBe(true);
   expect(dialog.classList.contains('host-card')).toBe(true);
   expect(dialog.style.maxWidth).toBe('420px');
   expect(dialog.getAttribute('aria-describedby')).toBeNull();
   expect(screen.getByText('Referral details').className).toBe('hig-sr-only');
   expect(screen.queryByRole('button',{name:'Close'})).toBeNull();
   expect(warn).not.toHaveBeenCalled();
  }finally{warn.mockRestore();}
 });
 it('composes a custom close control and respects canceled accepted activation',async()=>{
  const changed=vi.fn();
  const canceled=vi.fn((event:React.MouseEvent)=>event.preventDefault());
  const view=render(<Dialog open onOpenChange={changed} title='Review' description='Verify amount' descriptionHidden closeButton={<button onClick={canceled}>Dismiss review</button>}><p>Host card</p></Dialog>);
  const dialog=screen.getByRole('dialog');
  expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.className).toBe('hig-sr-only');
  await userEvent.click(screen.getByRole('button',{name:'Dismiss review'}));
  expect(canceled).toHaveBeenCalledOnce();
  expect(changed).not.toHaveBeenCalled();
  view.rerender(<Dialog open onOpenChange={changed} title='Review' closeButton={<button>Dismiss review</button>}><p>Host card</p></Dialog>);
  await userEvent.click(screen.getByRole('button',{name:'Dismiss review'}));
  expect(changed).toHaveBeenCalledWith(false);
 });
 it('forwards focus and Escape events without losing trapping or return focus',async()=>{
  const onEscape=vi.fn((event:KeyboardEvent)=>event.preventDefault());
  const openFocus=vi.fn((event:Event)=>{event.preventDefault();screen.getByLabelText('Review note').focus();});
  const closedFocus=vi.fn();
  function Example(){const [open,set]=useState(false);return <Dialog open={open} onOpenChange={set} title='Review' trigger={<button>Open review</button>} contentProps={{onOpenAutoFocus:openFocus,onCloseAutoFocus:closedFocus,onEscapeKeyDown:onEscape}} closeButton={<button>Done</button>}><input aria-label='Review note'/></Dialog>;}
  render(<Example/>);
  await userEvent.click(screen.getByRole('button',{name:'Open review'}));
  expect(document.activeElement).toBe(screen.getByLabelText('Review note'));
  await userEvent.tab({shift:true});
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'Done'}));
  await userEvent.keyboard('{Escape}');
  expect(onEscape).toHaveBeenCalledOnce();
  expect(screen.getByRole('dialog')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Done'}));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(closedFocus).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'Open review'}));
 });
 it('keeps a pending controlled dialog open until the host accepts dismissal',async()=>{
  function Example(){const [pending,setPending]=useState(true);const [open,setOpen]=useState(true);return <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} title='Wallet approval'><button onClick={()=>setPending(false)}>Approval finished</button></Dialog>;}
  render(<Example/>);
  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Close'}));
  expect(screen.getByRole('dialog')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Approval finished'}));
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
 });
});
