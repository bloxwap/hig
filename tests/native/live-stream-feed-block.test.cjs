const React=require('react');
const {create,act}=require('react-test-renderer');
const {LiveStreamFeedBlock}=require('../../packages/hig/native/src/live-stream-feed-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AvatarFrame}=require('../../packages/hig/native/src/avatar-frame');
const {Path}=require('react-native-svg');
const {platformIcons}=require('../../packages/hig/native/src/live-stream-feed-block');
// This renderer cannot attach the native driver, so every test keeps Animated.timing inert, lets it land on its target, and asserts on the requests.
let requests;
beforeEach(()=>{const {Animated}=require('react-native');requests=[];jest.spyOn(Animated,'timing').mockImplementation((value,config)=>{const animation={start:jest.fn(()=>value.setValue(config.toValue)),stop:jest.fn()};requests.push({value,config,animation});return animation;});});
afterEach(()=>{require('react-native').Animated.timing.mockRestore?.();});
const rows=root=>root.root.findAll(node=>typeof node.type!=='string'&&node.props.message&&typeof node.props.opacity==='number');
it('draws the newest lines over its parent without taking touches',()=>{
 const messages=Array.from({length:6},(_,index)=>({id:String(index+1),username:'user'+(index+1),source:'Kick',text:'line '+(index+1),avatarUrl:index===5?'https://example.org/six.png':undefined}));
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages})));});
 try{
  const feed=root.root.findByProps({accessibilityLabel:'Live chat'});
  expect(feed.props.pointerEvents).toBe('none');expect(feed.props.style.position).toBe('absolute');
  const avatars=root.root.findAllByType(AvatarFrame);
  expect(avatars.map(node=>node.props.name)).toEqual(['user2','user3','user4','user5','user6']);
  expect(rows(root).map(row=>[row.props.message.id,row.props.opacity])).toEqual([['2',0],['3',.25],['4',.5],['5',.75],['6',1]]);
  expect(root.root.findAll(node=>node.props.accessibilityElementsHidden===true&&node.props.importantForAccessibility==='no-hide-descendants').length).toBeGreaterThan(0);
  expect(feed.props.style.overflow).toBe('hidden');
  expect(avatars[4].props.source).toEqual({uri:'https://example.org/six.png'});
  expect(root.root.findAll(node=>node.props.numberOfLines===1&&node.props.children==='line 6').length).toBeGreaterThan(0);
  const text=JSON.stringify(root.toJSON());
  expect(text).toContain('line 6');expect(text).toContain('Kick');expect(text).not.toContain('line 1');
  act(()=>root.update(React.createElement(HIGProvider,null,React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages,maxVisible:1}))));
  expect(rows(root).map(row=>[row.props.message.id,row.props.opacity])).toEqual([['5',0],['6',1]]);
 }finally{act(()=>root.unmount());}
});
it('draws a named platform as a symbol on the photo, X in the text colour, and fades older lines',()=>{
 const {useColors}=require('../../packages/hig/native/src/provider');
 let theme;const Probe=()=>{theme=useColors();return null;};
 const messages=[{id:'1',username:'a',source:'Kick',platform:'kick',text:'hi'},{id:'2',username:'b',source:'X',platform:'x',text:'hi'},{id:'3',username:'c',source:'DLive',platform:'dlive',text:'hi'}];
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(Probe),React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages})));});
 try{
  const symbol=label=>root.root.find(node=>node.type==='View'&&node.props.accessibilityLabel===label&&node.props.accessibilityRole==='image');
  expect(symbol('Kick').props.style).toMatchObject({position:'absolute',backgroundColor:'#53fc18',width:18});
  expect(symbol('Kick').findByType(Path).props).toMatchObject({fill:'#000000',d:platformIcons.kick});
  expect(Object.assign({},...[].concat(symbol('DLive').findByType('Text').props.style))).toMatchObject({color:'#000000'});expect(symbol('DLive').findAllByType(Path)).toHaveLength(0);
  expect(symbol('X').props.style).toMatchObject({backgroundColor:theme.text});
  expect(symbol('X').findByType(Path).props.fill).toBe(theme.background);
  expect(root.root.findAllByType(AvatarFrame).map(node=>node.props.size)).toEqual([40,40,40]);
  expect(rows(root).map(row=>row.props.opacity)).toEqual([.333,.667,1]);
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
it('fades a line out after twelve seconds and then drops it',()=>{
 jest.useFakeTimers();
 let root;
 const block=messages=>React.createElement(HIGProvider,null,React.createElement(LiveStreamFeedBlock,{label:'Live chat',messages}));
 const one={id:'1',username:'a',source:'Kick',text:'first'},two={id:'2',username:'b',source:'Kick',text:'second'};
 act(()=>{root=create(block([one]));});
 try{
  act(()=>{jest.advanceTimersByTime(8000);});
  act(()=>root.update(block([one,two])));
  expect(rows(root).map(row=>[row.props.message.id,row.props.opacity])).toEqual([['1',.5],['2',1]]);
  // The new line pushes the list up from one row lower, and fades in while the older line steps down.
  const push=requests.filter(request=>request.config.toValue===0&&request.config.duration===320);
  expect(push).toHaveLength(1);expect(push[0].config).toMatchObject({useNativeDriver:true,isInteraction:false});
  expect(requests.filter(request=>request.config.duration===320).map(request=>request.config.toValue)).toEqual(expect.arrayContaining([1,.5]));
  requests.length=0;
  act(()=>{jest.advanceTimersByTime(4000);});
  expect(requests.map(request=>[request.config.toValue,request.config.duration])).toEqual([[0,640]]);
  expect(rows(root).map(row=>[row.props.message.id,row.props.opacity])).toEqual([['1',0],['2',1]]);
  act(()=>{jest.advanceTimersByTime(640);});
  expect(rows(root).map(row=>row.props.message.id)).toEqual(['2']);
  act(()=>{jest.advanceTimersByTime(8000);});
  expect(rows(root)).toHaveLength(0);
 }finally{act(()=>root.unmount());jest.useRealTimers();}
});
