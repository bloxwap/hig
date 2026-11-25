// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen,within} from '@testing-library/react';
import {LiveStreamFeedBlock} from '../packages/hig/react/src/blocks/live-stream-feed-block';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {feedFrame,feedLineOpacity,feedLines,type LiveStreamChatMessage} from '../packages/hig/contracts/src/live-stream';
afterEach(()=>{cleanup();vi.useRealTimers();});
const line=(id:number):LiveStreamChatMessage=>({id:String(id),username:'user'+id,source:id%2?'Twitch':'Kick',text:'line '+id});
const many=(count:number)=>Array.from({length:count},(_,index)=>line(index+1));
it('draws only the newest lines, oldest first and fading towards the top, each with its sender, source and message',()=>{
 const view=render(<LiveStreamFeedBlock label="Live chat" messages={many(6)}/>);
 const rows=()=>within(screen.getByRole('log',{name:'Live chat'})).getAllByRole('listitem');
 expect(rows().map(row=>row.textContent)).toEqual(['ususer3Twitchline 3','ususer4Kickline 4','ususer5Twitchline 5','ususer6Kickline 6']);
 expect(rows().map(row=>row.style.opacity)).toEqual(['0.25','0.5','0.75','1']);
 const pushed=view.container.querySelectorAll('li');
 expect(pushed).toHaveLength(5);expect([pushed[0].textContent,pushed[0].style.opacity,pushed[0].getAttribute('aria-hidden')]).toEqual(['ususer2Kickline 2','0','true']);
 expect(rows()[3].querySelector('.hig-live-feed-text')?.textContent).toBe('line 6');
 view.rerender(<LiveStreamFeedBlock label="Live chat" messages={many(7)} maxVisible={2}/>);
 expect(rows().map(row=>within(row).getByText(/^line/).textContent)).toEqual(['line 6','line 7']);
 expect(rows().map(row=>row.style.opacity)).toEqual(['0.5','1']);
 view.rerender(<LiveStreamFeedBlock label="Live chat" messages={[]}/>);
 expect(within(screen.getByRole('log')).queryAllByRole('listitem')).toHaveLength(0);
});
it('cuts each message to one line',()=>{
 render(<LiveStreamFeedBlock label="Live chat" messages={[line(1)]}/>);
 expect(screen.getByText('line 1').className).toBe('hig-live-feed-text');
});
it('keeps a usable line count and a visible oldest line',()=>{
 expect([feedLineOpacity(0,1),feedLineOpacity(0,0)]).toEqual([1,0]);
 for(const bad of [0,-1,1.5,Number.NaN,undefined])expect(feedLines(many(9),bad).length).toBe(4);
 expect(feedLines(many(2),5).length).toBe(2);
});
it('fades a line out once it has been up for twelve seconds, then drops it, each line on its own clock',()=>{
 vi.useFakeTimers();
 const view=render(<LiveStreamFeedBlock label="Live chat" messages={[line(1)]}/>);
 const items=()=>Array.from(view.container.querySelectorAll('li')).map(row=>[row.querySelector('.hig-live-feed-text')?.textContent,row.style.opacity]);
 act(()=>{vi.advanceTimersByTime(8000);});
 view.rerender(<LiveStreamFeedBlock label="Live chat" messages={[line(1),line(2)]}/>);
 expect(items()).toEqual([['line 1','0.5'],['line 2','1']]);
 act(()=>{vi.advanceTimersByTime(3999);});expect(items()).toEqual([['line 1','0.5'],['line 2','1']]);
 act(()=>{vi.advanceTimersByTime(1);});expect(items()).toEqual([['line 1','0'],['line 2','1']]);
 expect(within(screen.getByRole('log')).getAllByRole('listitem')).toHaveLength(1);
 act(()=>{vi.advanceTimersByTime(640);});expect(items()).toEqual([['line 2','1']]);
 act(()=>{vi.advanceTimersByTime(8000);});expect(items()).toEqual([]);
});
it('takes its own line duration, and keeps lines for good with Infinity',()=>{
 vi.useFakeTimers();
 const view=render(<LiveStreamFeedBlock label="Live chat" messages={[line(1)]} lineDuration={2000}/>);
 act(()=>{vi.advanceTimersByTime(2640);});expect(view.container.querySelectorAll('li')).toHaveLength(0);
 view.unmount();
 const kept=render(<LiveStreamFeedBlock label="Live chat" messages={[line(1)]} lineDuration={Infinity}/>);
 act(()=>{vi.advanceTimersByTime(600000);});expect(kept.container.querySelectorAll('li')).toHaveLength(1);
});
it('pushes the list up from under the bottom edge by the height of a new line, and not under reduced motion',()=>{
 const animate=vi.fn();
 const rect=vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({height:52} as DOMRect);
 const prototype=HTMLElement.prototype as {animate?:unknown};
 prototype.animate=animate;
 try{
  const view=render(<LiveStreamFeedBlock label="Live chat" messages={[line(1)]}/>);
  expect(animate).not.toHaveBeenCalled();
  view.rerender(<LiveStreamFeedBlock label="Live chat" messages={[line(1),line(2)]}/>);
  expect(animate).toHaveBeenCalledTimes(1);
  expect(animate.mock.calls[0][0]).toEqual([{transform:'translateY(56px)'},{transform:'translateY(0)'}]);
  expect(animate.mock.contexts[0]).toBe(view.container.querySelector('ol'));
  view.rerender(<LiveStreamFeedBlock label="Live chat" messages={[line(1),line(2)]}/>);
  expect(animate).toHaveBeenCalledTimes(1);
  view.unmount();animate.mockClear();
  const still=render(<HIGProvider reducedMotion><LiveStreamFeedBlock label="Live chat" messages={[line(1)]}/></HIGProvider>);
  still.rerender(<HIGProvider reducedMotion><LiveStreamFeedBlock label="Live chat" messages={[line(1),line(2)]}/></HIGProvider>);
  expect(animate).not.toHaveBeenCalled();
 }finally{delete prototype.animate;rect.mockRestore();}
});
it('works out the frame: live lines by strength, the pushed line at nothing, and when to look again',()=>{
 const seen=new Map<string,number>();
 expect(feedFrame(many(2),seen,1000)).toEqual({lines:[{message:line(1),opacity:.5},{message:line(2),opacity:1}],next:13000});
 const later=feedFrame(many(6),seen,5000);
 expect(later.lines.map(row=>[row.message.id,row.opacity])).toEqual([['2',0],['3',.25],['4',.5],['5',.75],['6',1]]);
 expect(later.next).toBe(13000);expect([...seen.keys()]).toEqual(['2','3','4','5','6']);
 expect(feedFrame(many(6),seen,13000).lines.map(row=>[row.message.id,row.opacity])).toEqual([['2',0],['3',.25],['4',.5],['5',.75],['6',1]]);
 expect(feedFrame(many(6),seen,13640).lines.map(row=>row.message.id)).toEqual(['3','4','5','6']);
 expect(feedFrame(many(6),seen,17640)).toEqual({lines:[],next:undefined});
});
