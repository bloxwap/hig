// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
afterEach(cleanup);
import {LiveStreamBlock} from '../packages/hig/react/src/blocks/live-stream-block';
import {chatServiceUrlValid,type LiveStreamChatService,type LiveStreamChatStatus} from '../packages/hig/contracts/src/live-stream';
const statusText:Record<LiveStreamChatStatus,string>={unconfigured:'Not set up',signedOut:'Signed out',connecting:'Connecting',connected:'Connected',failed:'Failed'};
function chat(overrides:Partial<LiveStreamChatService>={}):LiveStreamChatService{
 return {status:'unconfigured',onConnect:vi.fn(),labels:{title:'Chat',serviceLabel:'Service URL',connect:'Connect',disconnect:'Disconnect',reconnect:'Reconnect',
  note:'Enter only a service URL you trust.',status:status=>statusText[status]},...overrides};
}
function renderBlock(chatProps:LiveStreamChatService,play=vi.fn()){
 return render(<LiveStreamBlock title="Live streaming" streaming={{title:'Streaming',endpointLabel:'Server',keyLabel:'Stream key'}}
  chat={chatProps} appAudioLabel="App audio" microphoneLabel="Microphone" saveLabel="Save" playLabel="Play" onPlay={play}/>);
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
 fireEvent.click(screen.getByRole('switch',{name:'Microphone'}));fireEvent.click(button('Play'));
 expect(play).toHaveBeenCalledWith({streaming:{endpoint:'srt://example.org:9000',key:'demo-stream'},appAudio:true,microphone:false});
});
it('accepts only a bare https origin as the chat service',()=>{
 for(const value of ['https://auth.example.com','https://auth.example.com/','  https://auth.example.com  '])expect(chatServiceUrlValid(value)).toBe(true);
 for(const value of ['','http://auth.example.com','https://','https://user@auth.example.com','https://auth.example.com:443','https://auth.example.com/v1','https://auth.example.com?','https://auth.example.com/?a=1','https://auth.example.com#x','auth.example.com'])expect(chatServiceUrlValid(value)).toBe(false);
});
it('shows the chat status on the row and connects with the trimmed service URL',async()=>{
 const onConnect=vi.fn(()=>Promise.resolve());
 renderBlock(chat({onConnect,serviceUrl:'https://old.example.com'}));
 const row=screen.getByRole('button',{name:/^Chat/});
 expect(row.textContent).toContain('Not set up');
 fireEvent.click(row);
 const field=screen.getByLabelText('Service URL') as HTMLInputElement;
 expect(field.value).toBe('https://old.example.com');
 expect(field.getAttribute('autocapitalize')).toBe('none');
 expect(screen.getByRole('status').textContent).toBe('Not set up');
 expect(screen.getByText('Enter only a service URL you trust.')).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Disconnect'})).toBeNull();
 edit('Service URL','https://auth.example.com/path');expect(button('Connect').disabled).toBe(true);
 edit('Service URL','http://auth.example.com');expect(button('Connect').disabled).toBe(true);
 edit('Service URL','  https://auth.example.com ');expect(button('Connect').disabled).toBe(false);
 await act(async()=>{fireEvent.click(button('Connect'));});
 expect(onConnect).toHaveBeenCalledWith('https://auth.example.com');
 expect(screen.getByRole('button',{name:/Streaming/})).toBeTruthy();
});
it('keeps the chat screen open when connecting fails',async()=>{
 const onConnect=vi.fn(()=>Promise.reject(new Error('no')));
 renderBlock(chat({onConnect}));
 fireEvent.click(screen.getByRole('button',{name:/^Chat/}));edit('Service URL','https://auth.example.com');
 await act(async()=>{fireEvent.click(button('Connect'));});
 expect(onConnect).toHaveBeenCalledTimes(1);
 expect(screen.getByLabelText('Service URL')).toBeTruthy();
});
it('shows Connect as busy while connecting',()=>{
 const onConnect=vi.fn();
 renderBlock(chat({status:'connecting',serviceUrl:'https://auth.example.com',onConnect,onDisconnect:vi.fn(),onReconnect:vi.fn()}));
 fireEvent.click(screen.getByRole('button',{name:/Chat/}));
 const connect=screen.getByRole('button',{name:/Connect/}) as HTMLButtonElement;
 expect(connect.getAttribute('aria-busy')).toBe('true');
 fireEvent.click(connect);expect(onConnect).not.toHaveBeenCalled();
 expect(screen.queryByRole('button',{name:'Disconnect'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Reconnect'})).toBeNull();
});
it('offers disconnect and reconnect by status',async()=>{
 const visible=async(status:LiveStreamChatStatus,error?:string)=>{
  const onDisconnect=vi.fn(),onReconnect=vi.fn();
  const view=renderBlock(chat({status,error,serviceUrl:'https://auth.example.com',onDisconnect,onReconnect}));
  fireEvent.click(screen.getByRole('button',{name:new RegExp(`^Chat`)}));
  const result={disconnect:!!screen.queryByRole('button',{name:'Disconnect'}),reconnect:!!screen.queryByRole('button',{name:'Reconnect'}),status:screen.getAllByRole('status').map(node=>node.textContent).join('|'),alert:screen.queryByRole('alert')?.textContent??null};
  if(result.disconnect)await act(async()=>{fireEvent.click(button('Disconnect'));});
  if(result.reconnect)await act(async()=>{fireEvent.click(button('Reconnect'));});
  expect([onDisconnect.mock.calls.length,onReconnect.mock.calls.length]).toEqual([result.disconnect?1:0,result.reconnect?1:0]);
  view.unmount();
  return {...result,onDisconnect,onReconnect};
 };
 const connected=await visible('connected');
 expect([connected.disconnect,connected.reconnect,connected.status]).toEqual([true,false,'Connected']);
 const signedOut=await visible('signedOut');
 expect([signedOut.disconnect,signedOut.reconnect]).toEqual([true,true]);
 const failed=await visible('failed','Service unreachable');
 expect([failed.disconnect,failed.reconnect]).toEqual([true,true]);
 expect(failed.alert).toContain('Service unreachable');
 expect((await visible('unconfigured')).disconnect).toBe(false);
});
