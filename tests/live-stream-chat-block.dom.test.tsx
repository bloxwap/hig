// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {LiveStreamChatBlock,platformIcons,type LiveStreamChatMessage} from '../packages/hig/react/src/blocks/live-stream-chat-block';
const lines:LiveStreamChatMessage[]=[
 {id:'1',username:'mira',source:'Twitch',text:'gm'},
 {id:'2',username:'okto',source:'Kick',text:'long or short?',avatarUrl:'https://example.org/okto.png'},
];
afterEach(cleanup);
it('shows who wrote each line, where it came from and what it says, and lets the host close the drawer',()=>{
 const close=vi.fn();
 const view=render(<LiveStreamChatBlock title="Chat" emptyLabel="No messages yet" messages={[]} onClose={close}/>);
 expect(screen.getByText('No messages yet')).toBeTruthy();
 view.rerender(<LiveStreamChatBlock title="Chat" emptyLabel="No messages yet" messages={lines} onClose={close}/>);
 expect(screen.queryByText('No messages yet')).toBeNull();
 const rows=within(screen.getByRole('log',{name:'Chat'})).getAllByRole('listitem');
 expect(within(rows[0]).getByText('mira')).toBeTruthy();expect(within(rows[0]).getByText('Twitch')).toBeTruthy();expect(within(rows[0]).getByText('gm')).toBeTruthy();
 expect(within(rows[1]).getByText('Kick')).toBeTruthy();expect(rows[1].querySelector('img')?.getAttribute('src')).toBe('https://example.org/okto.png');
 expect(rows[0].querySelector('img')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(close).toHaveBeenCalledTimes(1);
});
it('follows the newest line until the reader scrolls back',()=>{
 const view=render(<LiveStreamChatBlock title="Chat" emptyLabel="Empty" messages={lines}/>);
 expect(screen.queryByRole('button',{name:'Close'})).toBeNull();
 const log=screen.getByRole('log');
 const size=(scrollHeight:number)=>{Object.defineProperty(log,'scrollHeight',{configurable:true,value:scrollHeight});Object.defineProperty(log,'clientHeight',{configurable:true,value:100});};
 const add=(id:string)=>view.rerender(<LiveStreamChatBlock title="Chat" emptyLabel="Empty" messages={[...lines,{id,username:'mira',source:'Twitch',text:id}]}/>);
 size(300);add('3');expect(log.scrollTop).toBe(300);
 log.scrollTop=40;fireEvent.scroll(log);size(400);add('4');expect(log.scrollTop).toBe(40);
 log.scrollTop=300;fireEvent.scroll(log);size(500);add('5');expect(log.scrollTop).toBe(500);
});
it('draws a named platform as a symbol on the photo and keeps an unknown source as a neutral badge',()=>{
 render(<LiveStreamChatBlock title="Chat" emptyLabel="None" messages={[
  {id:'1',username:'a',source:'Twitch',platform:'twitch',text:'hi'},
  {id:'2',username:'b',source:'X',platform:'x',text:'hi'},
  {id:'3',username:'c',source:'Other',text:'hi'},
  {id:'4',username:'d',source:'Trovo',platform:'trovo',text:'hi'},
 ]}/>);
 const symbol=(source:string)=>screen.getByText(source).parentElement as HTMLElement;
 const twitch=symbol('Twitch');
 expect(twitch.className).toBe('hig-live-platform');expect(twitch.parentElement?.className).toBe('hig-live-chat-avatar');
 expect(twitch.dataset.platform).toBe('twitch');expect(twitch.style.background).toBe('rgb(145, 70, 255)');expect(twitch.style.color).toBe('rgb(255, 255, 255)');
 expect(twitch.firstElementChild?.getAttribute('aria-hidden')).toBe('true');expect(twitch.firstElementChild?.tagName).toBe('svg');expect(twitch.querySelector('path')?.getAttribute('d')).toBe(platformIcons.twitch);
 const x=symbol('X');expect(x.dataset.platform).toBe('x');expect(x.getAttribute('style')).toBeNull();
 const other=screen.getByText('Other');
 expect(other.dataset.platform).toBeUndefined();expect(other.closest('.hig-live-chat-meta')).toBeTruthy();expect(document.querySelectorAll('.hig-live-platform')).toHaveLength(3);
 const trovo=symbol('Trovo');expect(trovo.querySelector('svg')).toBeNull();expect(trovo.firstElementChild?.textContent).toBe('Tr');
});
it('draws a long message in full across lines, unlike the one-line feed',()=>{
 const text='Watching the funding rate flip negative while open interest keeps climbing.';
 render(<LiveStreamChatBlock title="Chat" emptyLabel="None" messages={[{id:'1',username:'a',source:'Twitch',text}]}/>);
 const line=screen.getByText(text);
 expect(line.className).toBe('hig-live-chat-text');
});
