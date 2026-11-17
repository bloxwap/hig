// @vitest-environment jsdom
import React,{useState} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Popover} from '../packages/hig/react/src/overlay';
afterEach(()=>{cleanup();vi.useRealTimers();});
// jsdom has no PointerEvent, so `pointerType` would be lost; a MouseEvent that keeps it is enough here.
if(typeof window.PointerEvent==='undefined')(window as unknown as {PointerEvent:unknown}).PointerEvent=class extends MouseEvent{pointerType:string;constructor(type:string,init:PointerEventInit={}){super(type,init);this.pointerType=init.pointerType??'';}};

it('keeps its defaults: the label as a secondary Button trigger, and a Close button in the content',async()=>{
 render(<Popover label='Precision help'><p>Display rounding never changes order quantity.</p></Popover>);
 const trigger=screen.getByRole('button',{name:'Precision help'});expect(trigger.className).toContain('hig-button');
 await userEvent.click(trigger);
 const dialog=screen.getByRole('dialog');expect(dialog.getAttribute('aria-label')).toBeNull();expect(screen.getByText('Display rounding never changes order quantity.')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Close'}));expect(screen.queryByRole('dialog')).toBeNull();
});

it('is controlled with open and onOpenChange, takes a custom trigger, names itself with the label, and hides Close',async()=>{
 const change=vi.fn();
 function Host(){const [open,setOpen]=useState(false);return <Popover label='About Genesis' open={open} onOpenChange={next=>{change(next);setOpen(next);}} hideClose testID='genesis-popover' trigger={<button type='button' data-testid='genesis-badge'>G</button>}><p>Genesis holders get Swing.</p></Popover>;}
 render(<Host/>);
 expect(screen.queryByRole('button',{name:'About Genesis'})).toBeNull();
 await userEvent.click(screen.getByTestId('genesis-badge'));expect(change).toHaveBeenLastCalledWith(true);
 const dialog=screen.getByTestId('genesis-popover');expect(dialog.getAttribute('role')).toBe('dialog');expect(dialog.getAttribute('aria-label')).toBe('About Genesis');
 expect(screen.queryByRole('button',{name:'Close'})).toBeNull();
 fireEvent.keyDown(dialog,{key:'Escape'});expect(change).toHaveBeenLastCalledWith(false);expect(screen.queryByTestId('genesis-popover')).toBeNull();
 // A controlled popover stays as the host holds it.
 cleanup();
 render(<Popover label='Help' open onOpenChange={change}><p>Held open</p></Popover>);
 expect(screen.getByText('Held open')).toBeTruthy();
});

it('opens on a mouse hover with openOnHover, without moving focus, and closes after the pointer leaves both parts',()=>{
 vi.useFakeTimers();const change=vi.fn();
 render(<Popover label='Help' openOnHover onOpenChange={change}><p>Hover text</p></Popover>);
 const trigger=screen.getByRole('button',{name:'Help'});
 // A touch's pointerenter does nothing: its click toggles.
 fireEvent.pointerEnter(trigger,{pointerType:'touch'});expect(screen.queryByText('Hover text')).toBeNull();
 fireEvent.pointerEnter(trigger,{pointerType:'mouse'});expect(screen.getByText('Hover text')).toBeTruthy();expect(change).toHaveBeenLastCalledWith(true);
 expect(document.activeElement).not.toBe(screen.getByRole('button',{name:'Close'}));
 // Crossing from the trigger to the popover keeps it open.
 fireEvent.pointerLeave(trigger,{pointerType:'mouse'});fireEvent.pointerEnter(screen.getByRole('dialog'),{pointerType:'mouse'});
 act(()=>{vi.advanceTimersByTime(300);});expect(screen.getByText('Hover text')).toBeTruthy();
 fireEvent.pointerLeave(screen.getByRole('dialog'),{pointerType:'mouse'});
 act(()=>{vi.advanceTimersByTime(300);});expect(screen.queryByText('Hover text')).toBeNull();expect(change).toHaveBeenLastCalledWith(false);
 // The click that follows a hover pins the popover open instead of toggling it shut, and leaving no longer closes it.
 fireEvent.pointerEnter(trigger,{pointerType:'mouse'});fireEvent.click(trigger);expect(screen.getByText('Hover text')).toBeTruthy();expect(change).toHaveBeenLastCalledWith(true);
 fireEvent.pointerLeave(trigger,{pointerType:'mouse'});act(()=>{vi.advanceTimersByTime(300);});expect(screen.getByText('Hover text')).toBeTruthy();
 // A second click on the pinned trigger closes it, and the next hover opens it again.
 fireEvent.click(trigger);expect(screen.queryByText('Hover text')).toBeNull();expect(change).toHaveBeenLastCalledWith(false);
 fireEvent.pointerEnter(trigger,{pointerType:'mouse'});expect(screen.getByText('Hover text')).toBeTruthy();
 // Without openOnHover a hover does nothing.
 cleanup();
 render(<Popover label='Help'><p>Hover text</p></Popover>);
 fireEvent.pointerEnter(screen.getByRole('button',{name:'Help'}),{pointerType:'mouse'});expect(screen.queryByText('Hover text')).toBeNull();
});

it('tints its surface with tone, and takes the host className and style after its own class and theme',async()=>{
 render(<Popover label='About Genesis' defaultOpen tone='warning' className='genesis-glow' style={{'--hig-popover-tone':'#d4a017',borderWidth:2} as React.CSSProperties} testID='tinted'><p>Gold.</p></Popover>);
 const content=screen.getByTestId('tinted');
 expect(content.className).toBe('hig-popover genesis-glow');expect(content.getAttribute('data-tone')).toBe('warning');
 expect(content.style.getPropertyValue('--hig-popover-tone')).toBe('#d4a017');expect(content.style.borderWidth).toBe('2px');
 cleanup();
 render(<Popover label='Plain' defaultOpen testID='plain'><p>Neutral.</p></Popover>);
 const plain=screen.getByTestId('plain');expect(plain.className).toBe('hig-popover');expect(plain.hasAttribute('data-tone')).toBe(false);
});
