const React=require('react');
const {create,act}=require('react-test-renderer');
const {LiveStreamFeedBlock}=require('../../packages/hig/native/src/live-stream-feed-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AvatarFrame}=require('../../packages/hig/native/src/avatar-frame');
it('draws the newest lines over its parent without taking touches',()=>{
 const messages=Array.from({length:6},(_,index)=>({id:String(index+1),username:'user'+(index+1),source:'Kick',text:'line '+(index+1),avatarUrl:index===5?'https://example.org/six.png':undefined}));
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages})));});
 try{
  const feed=root.root.findByProps({accessibilityLabel:'Live chat'});
  expect(feed.props.pointerEvents).toBe('none');expect(feed.props.style.position).toBe('absolute');
  const avatars=root.root.findAllByType(AvatarFrame);
  expect(avatars.map(node=>node.props.name)).toEqual(['user3','user4','user5','user6']);
  expect(avatars[3].props.source).toEqual({uri:'https://example.org/six.png'});
  expect(root.root.findAll(node=>node.props.numberOfLines===1&&node.props.children==='line 6').length).toBeGreaterThan(0);
  const text=JSON.stringify(root.toJSON());
  expect(text).toContain('line 6');expect(text).toContain('Kick');expect(text).not.toContain('line 2');
  act(()=>root.update(React.createElement(HIGProvider,null,React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages,maxVisible:1}))));
  expect(root.root.findAllByType(AvatarFrame).map(node=>node.props.name)).toEqual(['user6']);
 }finally{act(()=>root.unmount());}
});
it('fills a named platform badge with its brand and draws X in the text colour',()=>{
 const {useColors}=require('../../packages/hig/native/src/provider');
 let theme;const Probe=()=>{theme=useColors();return null;};
 const messages=[{id:'1',username:'a',source:'Kick',platform:'kick',text:'hi'},{id:'2',username:'b',source:'X',platform:'x',text:'hi'}];
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(Probe),React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages})));});
 try{
  const badge=label=>root.root.find(node=>typeof node.type!=='string'&&node.props.children===label&&node.props.style?.backgroundColor);
  expect(badge('Kick').props.style).toMatchObject({backgroundColor:'#53fc18',color:'#000000'});
  expect(badge('X').props.style).toMatchObject({backgroundColor:theme.text,color:theme.background});
 }finally{act(()=>root.unmount());}
});
it('cuts each message to one line',()=>{
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages:[{id:'1',username:'a',source:'Kick',text:'a long message'}]})));});
 try{
  const nodes=root.root.findAll(node=>typeof node.type!=='string'&&node.props.children==='a long message');
  expect(nodes.length).toBeGreaterThan(0);
  for(const node of nodes)expect(node.props.numberOfLines).toBe(1);
 }finally{act(()=>root.unmount());}
});
