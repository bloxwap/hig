const React=require('react');
const {create,act}=require('react-test-renderer');
const {LiveStreamBlock}=require('../../packages/hig/native/src/live-stream-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ListRow}=require('../../packages/hig/native/src/list-group');
const {Input}=require('../../packages/hig/native/src/field');
const {Button}=require('../../packages/hig/native/src/button');
const {Alert}=require('../../packages/hig/native/src/status');
const {ScreenHeader}=require('../../packages/hig/native/src/screen-header');
const statusText={unconfigured:'Not set up',signedOut:'Signed out',connecting:'Connecting',connected:'Connected',failed:'Failed'};
const chat=overrides=>({status:'unconfigured',onConnect:jest.fn(),labels:{title:'Chat',serviceLabel:'Service URL',connect:'Connect',disconnect:'Disconnect',reconnect:'Reconnect',
 note:'Enter only a service URL you trust.',status:status=>statusText[status]},...overrides});
function mount(chatProps,onPlay=jest.fn()){
 const props={title:'Live streaming',streaming:{title:'Streaming',endpointLabel:'Stream',keyLabel:'Stream key'},chat:chatProps,
  appAudioLabel:'App audio',microphoneLabel:'Microphone',saveLabel:'Save',playLabel:'Play',onPlay};
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
  expect(onPlay).toHaveBeenCalledWith({streaming:{endpoint:'rtmps://example.org/live',key:'stream-key'},appAudio:true,microphone:false});
 }finally{view.unmount();}
});
it('shows the chat status and connects with the trimmed service URL',async()=>{
 const onConnect=jest.fn(()=>Promise.resolve());
 const view=mount(chat({onConnect,serviceUrl:'https://old.example.com'}));
 const {action,open,edit,row,root}=view;
 try{
  expect(row('Chat').props.value).toBe('Not set up');
  open('Chat');
  expect(root.root.findByType(ScreenHeader).props.title).toBe('Chat');
  const input=()=>root.root.findAllByType(Input)[0];
  expect(input().props.value).toBe('https://old.example.com');
  expect([input().props.keyboardType,input().props.autoCapitalize,input().props.autoCorrect]).toEqual(['url','none',false]);
  expect(view.texts()).toEqual(expect.arrayContaining(['Not set up','Enter only a service URL you trust.']));
  expect(action('Disconnect')).toBeUndefined();
  edit(0,'https://auth.example.com:8443');expect(action('Connect').props.disabled).toBe(true);
  edit(0,'https://auth.example.com?x');expect(action('Connect').props.disabled).toBe(true);
  edit(0,' https://auth.example.com/ ');expect(action('Connect').props.disabled).toBe(false);
  await act(async()=>{action('Connect').props.onPress();});
  expect(onConnect).toHaveBeenCalledWith('https://auth.example.com/');
  expect(row('Chat')).toBeTruthy();
 }finally{view.unmount();}
});
it('keeps the chat section open when connecting is rejected, and is busy while connecting',async()=>{
 const onConnect=jest.fn(()=>Promise.reject(new Error('no')));
 const view=mount(chat({onConnect}));
 try{
  view.open('Chat');view.edit(0,'https://auth.example.com');
  await act(async()=>{view.action('Connect').props.onPress();});
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(view.action('Connect')).toBeTruthy();
 }finally{view.unmount();}
 const busy=mount(chat({status:'connecting',serviceUrl:'https://auth.example.com',onDisconnect:jest.fn(),onReconnect:jest.fn()}));
 try{
  busy.open('Chat');
  expect(busy.action('Connect').props.busy).toBe(true);
  expect([busy.action('Disconnect'),busy.action('Reconnect')]).toEqual([undefined,undefined]);
 }finally{busy.unmount();}
});
it('offers disconnect and reconnect by status',async()=>{
 for(const [status,disconnect,reconnect] of [['unconfigured',false,false],['connected',true,false],['signedOut',true,true],['failed',true,true]]){
  const onDisconnect=jest.fn(),onReconnect=jest.fn();
  const view=mount(chat({status,error:status==='failed'?'Service unreachable':undefined,serviceUrl:'https://auth.example.com',onDisconnect,onReconnect}));
  try{
   view.open('Chat');
   expect([status,!!view.action('Disconnect'),!!view.action('Reconnect')]).toEqual([status,disconnect,reconnect]);
   expect(view.texts()).toContain(statusText[status]);
   expect(view.root.root.findAllByType(Alert).map(node=>node.props.title)).toEqual(status==='failed'?['Service unreachable']:[]);
   if(disconnect)await act(async()=>{view.action('Disconnect').props.onPress();});
   if(reconnect)await act(async()=>{view.action('Reconnect').props.onPress();});
   expect([onDisconnect.mock.calls.length,onReconnect.mock.calls.length]).toEqual([disconnect?1:0,reconnect?1:0]);
  }finally{view.unmount();}
 }
});
