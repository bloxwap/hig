// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {LiveStreamFeedBlock} from '../packages/hig/react/src/blocks/live-stream-feed-block';
import {feedLineOpacity,feedLines,type LiveStreamChatMessage} from '../packages/hig/contracts/src/live-stream';
afterEach(cleanup);
const line=(id:number):LiveStreamChatMessage=>({id:String(id),username:'user'+id,source:id%2?'Twitch':'Kick',text:'line '+id});
const many=(count:number)=>Array.from({length:count},(_,index)=>line(index+1));
it('draws only the newest lines, oldest first and fainter with age, each with its sender, source and message',()=>{
 const view=render(<LiveStreamFeedBlock label="Live chat" messages={many(6)}/>);
 const rows=()=>within(screen.getByRole('log',{name:'Live chat'})).getAllByRole('listitem');
 expect(rows().map(row=>row.textContent)).toEqual(['ususer3Twitchline 3','ususer4Kickline 4','ususer5Twitchline 5','ususer6Kickline 6']);
 expect(rows().map(row=>Number(row.style.opacity))).toEqual([.4,.6,.8,1]);
 expect(rows()[3].querySelector('.hig-live-feed-text')?.textContent).toBe('line 6');
 view.rerender(<LiveStreamFeedBlock label="Live chat" messages={many(7)} maxVisible={2}/>);
 expect(rows().map(row=>within(row).getByText(/^line/).textContent)).toEqual(['line 6','line 7']);
 view.rerender(<LiveStreamFeedBlock label="Live chat" messages={[]}/>);
 expect(within(screen.getByRole('log')).queryAllByRole('listitem')).toHaveLength(0);
});
it('cuts each message to one line',()=>{
 render(<LiveStreamFeedBlock label="Live chat" messages={[line(1)]}/>);
 expect(screen.getByText('line 1').className).toBe('hig-live-feed-text');
});
it('keeps a usable line count and a visible oldest line',()=>{
 for(const bad of [0,-1,1.5,Number.NaN,undefined])expect(feedLines(many(9),bad).length).toBe(4);
 expect(feedLines(many(2),5).length).toBe(2);
 expect(feedLineOpacity(0)).toBe(1);expect(feedLineOpacity(20)).toBe(.25);
});
