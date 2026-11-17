import React,{createRef} from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {Button,IconButton} from '../packages/hig/react/src/button';
import {Badge} from '../packages/hig/react/src/status';
import {HIGProvider} from '../packages/hig/react/src/provider';
afterEach(cleanup);
const css=readFileSync('packages/hig/react/src/styles.css','utf8');
describe('Button href, glow and label wrapping; Badge dot',()=>{
 it('renders a real link with the button look, intents and feedback',async()=>{
  const onClick=vi.fn(e=>e.preventDefault());const accepted=vi.fn();const ref=createRef<HTMLButtonElement>();
  render(<HIGProvider onAccepted={accepted}><Button ref={ref} href='/trade/BTC' intent='up' fullWidth onClick={onClick}>Trade BTC</Button></HIGProvider>);
  const link=screen.getByRole('link',{name:'Trade BTC'});
  expect(link.tagName).toBe('A');expect(link.getAttribute('href')).toBe('/trade/BTC');expect(link.className).toContain('hig-button');
  expect(link.dataset.intent).toBe('up');expect(link.hasAttribute('data-full')).toBe(true);expect(link.hasAttribute('type')).toBe(false);expect(link.hasAttribute('role')).toBe(false);
  expect(ref.current as unknown).toBe(link);
  await userEvent.click(link);expect(onClick).toHaveBeenCalledOnce();expect(accepted).not.toHaveBeenCalled();
  cleanup();render(<HIGProvider onAccepted={accepted}><Button href='#trade'>Trade BTC</Button></HIGProvider>);
  await userEvent.click(screen.getByRole('link'));expect(accepted).toHaveBeenCalledOnce();
 });
 it('passes target and rel through as given',()=>{
  render(<Button href='https://bloxwap.com' target='_blank' rel='noopener noreferrer'>Open</Button>);
  const link=screen.getByRole('link');expect(link.getAttribute('target')).toBe('_blank');expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  cleanup();render(<Button href='/docs'>Open</Button>);expect(screen.getByRole('link').hasAttribute('rel')).toBe(false);
 });
 it('a disabled or busy link drops its href, reads as a disabled link and blocks activation',async()=>{
  const onClick=vi.fn();const accepted=vi.fn();
  const {rerender}=render(<HIGProvider onAccepted={accepted}><Button href='/trade' disabled onClick={onClick}>Trade</Button></HIGProvider>);
  let link=screen.getByRole('link',{name:'Trade'});
  expect(link.hasAttribute('href')).toBe(false);expect(link.getAttribute('aria-disabled')).toBe('true');
  await userEvent.click(link);expect(onClick).not.toHaveBeenCalled();
  rerender(<HIGProvider onAccepted={accepted}><Button href='/trade' busy busyLabel='Working' onClick={onClick}>Trade</Button></HIGProvider>);
  link=screen.getByRole('link',{name:'Trade · Working'});
  expect(link.getAttribute('aria-busy')).toBe('true');expect(link.querySelector('.hig-button-spinner')).not.toBeNull();expect(link.hasAttribute('href')).toBe(false);
  await userEvent.click(link);expect(onClick).not.toHaveBeenCalled();expect(accepted).not.toHaveBeenCalled();
 });
 it('without href stays a button, and IconButton has no href',()=>{
  render(<><Button>Plain</Button><IconButton label='Close'>x</IconButton></>);
  expect(screen.getByRole('button',{name:'Plain'}).tagName).toBe('BUTTON');expect(screen.queryByRole('link')).toBeNull();
  // @ts-expect-error IconButton is never a link.
  void <IconButton label='Go' href='/x'>x</IconButton>;
 });
 it('glow marks filled intents and the stylesheet drops it while unavailable',()=>{
  render(<Button glow>Trade BTC</Button>);
  expect(screen.getByRole('button').hasAttribute('data-glow')).toBe(true);
  expect(css).toMatch(/\.hig-button\[data-glow\]:not\(\[data-intent='secondary'\],\[data-intent='ghost'\]\) \{ box-shadow:/);
  expect(css).toMatch(/\.hig-button:is\(:disabled,\[aria-disabled='true'\]\):not\(\[aria-busy='true'\]\) \{[^}]*box-shadow:none/);
 });
 it('labels break at word boundaries first (no mid-word break while a word fits)',()=>{
  const rule=css.match(/^\.hig-button \{[^}]*\}/m)?.[0]??'';
  expect(rule).toContain('overflow-wrap:break-word');expect(rule).not.toContain('anywhere');expect(rule).toContain('text-decoration:none');
 });
 it('Badge dot is a hidden leading mark in the label colour',()=>{
  render(<Badge tone='negative' dot>Off the tape</Badge>);
  const badge=screen.getByText('Off the tape');const dot=badge.firstElementChild as HTMLElement;
  expect(badge.dataset.tone).toBe('negative');expect(dot.className).toBe('hig-badge-dot');expect(dot.getAttribute('aria-hidden')).toBe('true');
  expect(badge.textContent).toBe('Off the tape');
 });
});
