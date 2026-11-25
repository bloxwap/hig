const React=require('react');
const {create,act}=require('react-test-renderer');
const {LiveStreamBlock}=require('../../packages/hig/native/src/live-stream-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ListRow}=require('../../packages/hig/native/src/list-group');
const {Input}=require('../../packages/hig/native/src/field');
const {Button}=require('../../packages/hig/native/src/button');
const {Alert}=require('../../packages/hig/native/src/status');
const {ScreenHeader}=require('../../packages/hig/native/src/screen-header');
const statusText={signedOut:'Signed out',connecting:'Connecting',connected:'Connected',failed:'Failed'};
const chat=overrides=>({status:'signedOut',onConnect:jest.fn(),labels:{title:'Chat',connect:'Connect',disconnect:'Sign out',
 note:'Sign in with Restream to show your chat.',status:status=>statusText[status]},...overrides});
function mount(chatProps,onPlay=jest.fn()){
 const props={title:'Live streaming',streaming:{title:'Streaming',endpointLabel:'Stream',keyLabel:'Stream key'},chat:chatProps,
  appAudioLabel:'App audio',microphoneLabel:'Microphone',chatFeedLabel:'Live chat feed',saveLabel:'Save',playLabel:'Play',onPlay};
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(LiveStreamBlock,props)));});
 const row=label=>root.root.findAllByType(ListRow).find(node=>node.props.label===label);
 const action=label=>root.root.findAllByType(Button).find(node=>node.props.children===label);
 const open=label=>act(()=>row(label).props.onSelect());
 const edit=(i,value)=>act(()=>root.root.findAllByType(Input)[i].props.onChangeText(value));
 const texts=()=>root.root.findAll(node=>typeof node.type==='string'&&node.type==='Text').map(node=>[].concat(node.props.children).join(''));
 return {root,row,action,open,edit,texts,unmount:()=>act(()=>root.unmount())};
}
it('saves streaming and gives the host the selected settings',()=>{
 const onPlay=jest.fn();
 const view=mount(chat(),onPlay);
 const {action,open,edit,row,root}=view;
 try{
  expect(action('Play').props.disabled).toBe(true);
  open('Streaming');edit(0,'invalid');edit(1,'stream-key');expect(action('Save').props.disabled).toBe(true);
  edit(0,'rtmps://example.org/live');expect(root.root.findAllByType(Input)[1].props.secureTextEntry).toBe(true);
  act(()=>action('Save').props.onPress());
  open('Streaming');edit(1,'discard');act(()=>root.root.findByType(ScreenHeader).props.onBack());
  act(()=>row('Microphone').props.onCheckedChange(false));
  act(()=>action('Play').props.onPress());
  expect(onPlay).toHaveBeenCalledWith({streaming:{endpoint:'rtmps://example.org/live',key:'stream-key'},appAudio:true,microphone:false,chatFeed:true});
 }finally{view.unmount();}
});
it('shows the chat status and connects without asking for a URL',async()=>{
 const onConnect=jest.fn(()=>Promise.resolve());
 const view=mount(chat({onConnect}));
 const {action,open,row,root}=view;
 try{
  expect(row('Chat').props.value).toBe('Signed out');
  open('Chat');
  expect(root.root.findByType(ScreenHeader).props.title).toBe('Chat');
  expect(root.root.findAllByType(Input)).toHaveLength(0);
  expect(view.texts()).toEqual(expect.arrayContaining(['Signed out','Sign in with Restream to show your chat.']));
  expect(action('Sign out')).toBeUndefined();
  await act(async()=>{action('Connect').props.onPress();});
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(onConnect).toHaveBeenCalledWith();
  expect(row('Chat')).toBeTruthy();
 }finally{view.unmount();}
});
it('keeps the chat section open when connecting is rejected, and is busy while connecting',async()=>{
 const onConnect=jest.fn(()=>Promise.reject(new Error('no')));
 const view=mount(chat({onConnect}));
 try{
  view.open('Chat');
  await act(async()=>{view.action('Connect').props.onPress();});
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(view.action('Connect')).toBeTruthy();
 }finally{view.unmount();}
 const busy=mount(chat({status:'connecting',onDisconnect:jest.fn()}));
 try{
  busy.open('Chat');
  expect(busy.action('Connect').props.busy).toBe(true);
  expect(busy.action('Sign out')).toBeUndefined();
 }finally{busy.unmount();}
});
it('offers Connect and Sign out by status',async()=>{
 for(const [status,connect,disconnect] of [['connected',false,true],['signedOut',true,false],['failed',true,true]]){
  const onDisconnect=jest.fn();
  const view=mount(chat({status,error:status==='failed'?'Sign-in unreachable':undefined,onDisconnect}));
  try{
   view.open('Chat');
   expect([status,!!view.action('Connect'),!!view.action('Sign out')]).toEqual([status,connect,disconnect]);
   expect(view.texts()).toContain(statusText[status]);
   expect(view.root.root.findAllByType(Alert).map(node=>node.props.title)).toEqual(status==='failed'?['Sign-in unreachable']:[]);
   if(disconnect)await act(async()=>{view.action('Sign out').props.onPress();});
   expect(onDisconnect.mock.calls.length).toBe(disconnect?1:0);
  }finally{view.unmount();}
 }
});
