import React from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {LoginBlock} from '../packages/hig/react/src/blocks/login-block';

afterEach(cleanup);
const base={onLogin:()=>{},onClose:()=>{}};
const view=(props:Partial<React.ComponentProps<typeof LoginBlock>>)=><HIGProvider><LoginBlock {...base} {...props}/></HIGProvider>;
const provider=(name:RegExp)=>screen.getByRole('button',{name}) as HTMLButtonElement;

it('disables only the providers whose sign-in is in flight',()=>{
 const onLogin=vi.fn();render(view({onLogin,pending:['apple']}));
 expect([provider(/Apple/).disabled,provider(/Google/).disabled,provider(/X/).disabled]).toEqual([true,false,false]);
 fireEvent.click(provider(/Google/));expect(onLogin.mock.calls).toEqual([['google']]);
});

it('leaves the analytics row out for a host with nothing to consent to, and draws it unavailable while consent loads',()=>{
 const {rerender}=render(view({}));
 expect(document.querySelector('.hig-login-analytics')).toBeNull();expect(screen.queryByRole('switch')).toBeNull();
 const onAnalyticsChange=vi.fn();rerender(view({analyticsEnabled:false,onAnalyticsChange,analyticsDisabled:true}));
 expect((screen.getByRole('switch') as HTMLInputElement).disabled).toBe(true);
 rerender(view({analyticsEnabled:false,onAnalyticsChange}));
 fireEvent.click(screen.getByRole('switch'));expect(onAnalyticsChange).toHaveBeenCalledWith(true);
});

it('hands Terms and Privacy to the host when it opens links its own way, and leaves the links alone otherwise',()=>{
 const onOpenLink=vi.fn();const {rerender}=render(view({onOpenLink,termsUrl:'https://example.test/terms',privacyUrl:'https://example.test/privacy'}));
 const terms=()=>screen.getByRole('link',{name:'Terms of Use'}),privacy=()=>screen.getByRole('link',{name:'Privacy Policy'});
 expect(fireEvent.click(terms())).toBe(false);expect(fireEvent.click(privacy())).toBe(false);
 expect(onOpenLink.mock.calls).toEqual([['https://example.test/terms','terms'],['https://example.test/privacy','privacy']]);
 rerender(view({termsUrl:'https://example.test/terms'}));
 expect(terms().getAttribute('href')).toBe('https://example.test/terms');
});
