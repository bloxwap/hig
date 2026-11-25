// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
afterEach(cleanup);
import {LiveStreamBlock} from '../packages/hig/react/src/blocks/live-stream-block';
import {type LiveStreamChatService,type LiveStreamChatStatus} from '../packages/hig/contracts/src/live-stream';
const statusText:Record<LiveStreamChatStatus,string>={signedOut:'Signed out',connecting:'Connecting',connected:'Connected',failed:'Failed'};
function chat(overrides:Partial<LiveStreamChatService>={}):LiveStreamChatService{
 return {status:'signedOut',onConnect:vi.fn(),labels:{title:'Chat',connect:'Connect',disconnect:'Sign out',
  note:'Sign in with Restream to show your chat.',status:status=>statusText[status]},...overrides};
}
function renderBlock(chatProps:LiveStreamChatService,play=vi.fn()){
 return render(<LiveStreamBlock title="Live streaming" streaming={{title:'Streaming',endpointLabel:'Server',keyLabel:'Stream key'}}
  chat={chatProps} appAudioLabel="App audio" microphoneLabel="Microphone" chatFeedLabel="Live chat feed" saveLabel="Save" playLabel="Play" onPlay={play}/>);
}
const button=(name:string)=>screen.getByRole('button',{name}) as HTMLButtonElement;
const edit=(label:string,value:string)=>fireEvent.change(screen.getByLabelText(label),{target:{value}});
it('edits the streaming connection and requests a broadcast with the saved values',()=>{
 const play=vi.fn();
 renderBlock(chat(),play);
 expect(button('Play').disabled).toBe(true);
 fireEvent.click(button('Streaming'));edit('Server','srt://example.org:9000');edit('Stream key','demo-stream');
 expect(screen.getByLabelText('Stream key').getAttribute('type')).toBe('password');
 fireEvent.click(button('Save'));expect(button('Play').disabled).toBe(false);
 fireEvent.click(button('Streaming'));edit('Stream key','discard');fireEvent.click(button('Back'));
 fireEvent.click(screen.getByRole('switch',{name:'Microphone'}));fireEvent.click(screen.getByRole('switch',{name:'Live chat feed'}));fireEvent.click(button('Play'));
 expect(play).toHaveBeenCalledWith({streaming:{endpoint:'srt://example.org:9000',key:'demo-stream'},appAudio:true,microphone:false,chatFeed:false});
});
it('shows the chat status on the row and connects without asking for a URL',async()=>{
 const onConnect=vi.fn(()=>Promise.resolve());
 renderBlock(chat({onConnect}));
 const row=screen.getByRole('button',{name:/^Chat/});
 expect(row.textContent).toContain('Signed out');
 fireEvent.click(row);
 expect(screen.queryByRole('textbox')).toBeNull();
 expect(screen.getByRole('status').textContent).toBe('Signed out');
 expect(screen.getByText('Sign in with Restream to show your chat.')).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Sign out'})).toBeNull();
 await act(async()=>{fireEvent.click(button('Connect'));});
 expect(onConnect).toHaveBeenCalledTimes(1);
 expect(onConnect).toHaveBeenCalledWith();
 expect(screen.getByRole('button',{name:/Streaming/})).toBeTruthy();
});
it('keeps the chat screen open when connecting fails',async()=>{
 const onConnect=vi.fn(()=>Promise.reject(new Error('no')));
 renderBlock(chat({onConnect}));
 fireEvent.click(screen.getByRole('button',{name:/^Chat/}));
 await act(async()=>{fireEvent.click(button('Connect'));});
 expect(onConnect).toHaveBeenCalledTimes(1);
 expect(button('Connect')).toBeTruthy();
});
it('shows Connect as busy while connecting',()=>{
 const onConnect=vi.fn();
 renderBlock(chat({status:'connecting',onConnect,onDisconnect:vi.fn()}));
 fireEvent.click(screen.getByRole('button',{name:/Chat/}));
 const connect=screen.getByRole('button',{name:/Connect/}) as HTMLButtonElement;
 expect(connect.getAttribute('aria-busy')).toBe('true');
 fireEvent.click(connect);expect(onConnect).not.toHaveBeenCalled();
 expect(screen.queryByRole('button',{name:'Sign out'})).toBeNull();
});
it('offers Connect and Sign out by status',async()=>{
 const visible=async(status:LiveStreamChatStatus,error?:string)=>{
  const onConnect=vi.fn(),onDisconnect=vi.fn();
  const view=renderBlock(chat({status,error,onConnect,onDisconnect}));
  fireEvent.click(screen.getByRole('button',{name:new RegExp(`^Chat`)}));
  const result={connect:!!screen.queryByRole('button',{name:/Connect/}),disconnect:!!screen.queryByRole('button',{name:'Sign out'}),status:screen.getAllByRole('status').map(node=>node.textContent).join('|'),alert:screen.queryByRole('alert')?.textContent??null};
  if(result.disconnect)await act(async()=>{fireEvent.click(button('Sign out'));});
  expect(onDisconnect.mock.calls.length).toBe(result.disconnect?1:0);
  view.unmount();
  return result;
 };
 const connected=await visible('connected');
 expect([connected.connect,connected.disconnect,connected.status]).toEqual([false,true,'Connected']);
 const signedOut=await visible('signedOut');
 expect([signedOut.connect,signedOut.disconnect]).toEqual([true,false]);
 const failed=await visible('failed','Sign-in unreachable');
 expect([failed.connect,failed.disconnect]).toEqual([true,true]);
 expect(failed.alert).toContain('Sign-in unreachable');
});
