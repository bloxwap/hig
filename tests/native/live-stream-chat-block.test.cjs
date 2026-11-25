const React=require('react');
const {create,act}=require('react-test-renderer');
const {FlatList,Text}=require('react-native');
const {LiveStreamChatBlock}=require('../../packages/hig/native/src/live-stream-chat-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AvatarFrame}=require('../../packages/hig/native/src/avatar-frame');
const {IconButton}=require('../../packages/hig/native/src/button');
it('lists each line with its sender, source and photo, and gives the host the close press',()=>{
 const onClose=jest.fn();
 const messages=[{id:'1',username:'mira',source:'Twitch',text:'gm'},{id:'2',username:'okto',source:'Kick',text:'long or short?',avatarUrl:'https://example.org/okto.png'}];
 const block=props=>React.createElement(HIGProvider,null,React.createElement(LiveStreamChatBlock,{title:'Chat',emptyLabel:'No messages yet',onClose,...props}));
 let root;
 act(()=>{root=create(block({messages:[]}));});
 const words=()=>root.root.findAllByType(Text).map(node=>node.props.children).filter(child=>typeof child==='string');
 try{
  expect(words()).toContain('No messages yet');
  act(()=>root.update(block({messages})));
  expect(words()).toEqual(expect.arrayContaining(['mira','Twitch','gm','okto','Kick','long or short?']));
  expect(words()).not.toContain('No messages yet');
  expect(root.root.findAllByType(AvatarFrame).map(node=>node.props.source)).toEqual([undefined,{uri:'https://example.org/okto.png'}]);
  expect(root.root.findByType(FlatList).props.accessibilityLabel).toBe('Chat');
  act(()=>root.root.findByType(IconButton).props.onPress());
  expect(onClose).toHaveBeenCalledTimes(1);
 }finally{act(()=>root.unmount());}
});
it('draws a long message without a line limit',()=>{
 const text='Watching the funding rate flip negative while open interest keeps climbing.';
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(LiveStreamChatBlock,{title:'Chat',emptyLabel:'None',messages:[{id:'1',username:'a',source:'Twitch',text}]})));});
 try{
  const nodes=root.root.findAll(node=>typeof node.type!=='string'&&node.props.children===text);
  expect(nodes.length).toBeGreaterThan(0);
  for(const node of nodes)expect(node.props.numberOfLines).toBeUndefined();
 }finally{act(()=>root.unmount());}
});
