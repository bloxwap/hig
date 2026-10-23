import React from 'react';
import {renderToString} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider,useColors,useThemeStyle} from '../packages/react/src/provider';
import {Button} from '../packages/react/src/button';
import {Dialog} from '../packages/react/src/dialog';
import {Popover} from '../packages/react/src/overlay';
import {GestureSheet} from '../packages/react/src/gesture-sheet';
import {nativeSrgb} from '../packages/tokens/src';

afterEach(cleanup);
function Probe({id}:{id:string}){const colors=useColors();return <output data-testid={id} data-colors={JSON.stringify(colors)} style={useThemeStyle()}/>;}
const colors=(id:string)=>JSON.parse(screen.getByTestId(id).dataset.colors!);

it('keeps default green, scopes brands to providers and inherits through nested providers',()=>{
 render(<><Probe id='outside'/><HIGProvider primaryColor='#f00'><Probe id='red'/><HIGProvider density='compact'><Probe id='nested'/></HIGProvider><HIGProvider primaryColor='#123456'><Probe id='override'/></HIGProvider></HIGProvider><HIGProvider><Probe id='default'/></HIGProvider></>);
 expect(colors('default')).toEqual(nativeSrgb);expect(colors('outside')).toEqual(nativeSrgb);
 expect(colors('red')).toEqual({...nativeSrgb,action:'#ff0000',focus:'#ff0000',onAction:'#000000'});
 expect(colors('nested')).toEqual(colors('red'));
 expect(colors('override')).toEqual({...nativeSrgb,action:'#123456',focus:'#123456',onAction:'#ffffff'});
 expect(screen.getByTestId('red').parentElement!.style.getPropertyValue('--hig-action')).toBe('#ff0000');
 expect(screen.getByTestId('default').parentElement!.style.getPropertyValue('--hig-action')).toBe('');
});

it('updates the accent and removes overrides when the prop is removed',()=>{
 const {rerender}=render(<HIGProvider primaryColor='#f00'><Probe id='brand'/></HIGProvider>);
 rerender(<HIGProvider primaryColor='#123456'><Probe id='brand'/></HIGProvider>);
 expect(colors('brand').action).toBe('#123456');
 expect(screen.getByTestId('brand').parentElement!.style.getPropertyValue('--hig-onAction')).toBe('#ffffff');
 rerender(<HIGProvider><Probe id='brand'/></HIGProvider>);
 expect(colors('brand')).toEqual(nativeSrgb);
 expect(screen.getByTestId('brand').parentElement!.style.cssText).toBe('');
});

it('renders primary variables on the server with no browser dependency',()=>{
 const html=renderToString(<HIGProvider primaryColor='#f00'><Button>Watch live</Button></HIGProvider>);
 expect(html).toContain('--hig-action:#ff0000;--hig-focus:#ff0000;--hig-onAction:#000000');
});

it('carries the accent into portalled dialogs and preserves host layout styles',()=>{
 render(<HIGProvider primaryColor='#f00'><Dialog open onOpenChange={vi.fn()} title='Watch live' description='Tap Trade TV' contentProps={{style:{maxWidth:480}}}><Button>Play</Button></Dialog></HIGProvider>);
 const dialog=screen.getByRole('dialog');
 expect(dialog.parentElement).toBe(document.body);
 expect(dialog.style.getPropertyValue('--hig-action')).toBe('#ff0000');
 expect(dialog.style.getPropertyValue('--hig-onAction')).toBe('#000000');
 expect(dialog.style.maxWidth).toBe('480px');
});

it('carries the accent into portalled gesture sheets',()=>{
 render(<HIGProvider primaryColor='#f00'><GestureSheet open onOpenChange={vi.fn()} title='Watch live' description='Tap Trade TV'><Button>Play</Button></GestureSheet></HIGProvider>);
 expect(screen.getByRole('dialog').style.getPropertyValue('--hig-action')).toBe('#ff0000');
});

it('carries the accent into popovers outside the provider DOM',async()=>{
 const user=userEvent.setup();
 render(<HIGProvider primaryColor='#f00'><Popover label='Player'><Button>Watch live</Button></Popover></HIGProvider>);
 await user.click(screen.getByRole('button',{name:'Player'}));
 expect(screen.getByRole('dialog').style.getPropertyValue('--hig-action')).toBe('#ff0000');
});
