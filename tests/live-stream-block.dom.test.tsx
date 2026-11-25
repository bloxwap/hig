// @vitest-environment jsdom
import React from 'react';
import {expect,it,vi} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {LiveStreamBlock} from '../packages/hig/react/src/blocks/live-stream-block';
it('edits each connection independently and requests a broadcast with the saved values',()=>{
 const play=vi.fn();
 render(<LiveStreamBlock title="Live streaming" streaming={{title:'Streaming',endpointLabel:'Server',keyLabel:'Stream key'}}
  chat={{title:'Chat',endpointLabel:'Channel',keyLabel:'Chat key'}} appAudioLabel="App audio" microphoneLabel="Microphone" saveLabel="Save" playLabel="Play" onPlay={play}/>);
 const button=(name:string)=>screen.getByRole('button',{name}) as HTMLButtonElement;
 const edit=(label:string,value:string)=>fireEvent.change(screen.getByLabelText(label),{target:{value}});
 expect(button('Play').disabled).toBe(true);
 fireEvent.click(button('Streaming'));edit('Server','srt://example.org:9000');edit('Stream key','demo-stream');
 expect(screen.getByLabelText('Stream key').getAttribute('type')).toBe('password');
 fireEvent.click(button('Save'));expect(button('Play').disabled).toBe(false);
 fireEvent.click(button('Chat'));edit('Channel','demo-channel');edit('Chat key','demo-chat');fireEvent.click(button('Save'));
 fireEvent.click(button('Chat'));edit('Chat key','discard');fireEvent.click(button('Back'));
 fireEvent.click(screen.getByRole('switch',{name:'Microphone'}));fireEvent.click(button('Play'));
 expect(play).toHaveBeenCalledWith({streaming:{endpoint:'srt://example.org:9000',key:'demo-stream'},chat:{endpoint:'demo-channel',key:'demo-chat'},appAudio:true,microphone:false});
});
