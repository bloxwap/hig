const React=require('react');
const {create,act}=require('react-test-renderer');
const {LiveStreamBlock}=require('../../packages/hig/native/src/live-stream-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ListRow}=require('../../packages/hig/native/src/list-group');
const {Input}=require('../../packages/hig/native/src/field');
const {Button}=require('../../packages/hig/native/src/button');
const {ScreenHeader}=require('../../packages/hig/native/src/screen-header');
it('saves streaming and chat independently and gives the host the selected settings',()=>{
 const onPlay=jest.fn();
 const props={title:'Live streaming',streaming:{title:'Streaming',endpointLabel:'Stream',keyLabel:'Stream key'},
  chat:{title:'Chat',endpointLabel:'Channel',keyLabel:'Chat key'},appAudioLabel:'App audio',
  microphoneLabel:'Microphone',saveLabel:'Save',playLabel:'Play',onPlay};
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(LiveStreamBlock,props)));});
 const row=label=>root.root.findAllByType(ListRow).find(node=>node.props.label===label);
 const action=label=>root.root.findAllByType(Button).find(node=>node.props.children===label);
 const open=label=>act(()=>row(label).props.onSelect());
 const edit=(i,value)=>act(()=>root.root.findAllByType(Input)[i].props.onChangeText(value));
 try{
  expect(action('Play').props.disabled).toBe(true);
  open('Chat');edit(0,'channel');edit(1,'chat-key');act(()=>action('Save').props.onPress());
  expect(action('Play').props.disabled).toBe(true);
  open('Streaming');edit(0,'invalid');edit(1,'stream-key');expect(action('Save').props.disabled).toBe(true);
  edit(0,'rtmps://example.org/live');expect(root.root.findAllByType(Input)[1].props.secureTextEntry).toBe(true);
  act(()=>action('Save').props.onPress());
  open('Chat');edit(1,'discard');act(()=>root.root.findByType(ScreenHeader).props.onBack());
  act(()=>row('Microphone').props.onCheckedChange(false));
  act(()=>action('Play').props.onPress());
  expect(onPlay).toHaveBeenCalledWith({streaming:{endpoint:'rtmps://example.org/live',key:'stream-key'},chat:{endpoint:'channel',key:'chat-key'},appAudio:true,microphone:false});
 }finally{act(()=>root.unmount());}
});
