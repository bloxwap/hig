/** Native Avatar: the image, the initials it always drew, and the generated beam face in react-native-svg (the `avatar` entry); the `status` entry draws it without the face and without the SVG peer. */
const React=require('react');
const {readFileSync}=require('node:fs');
const {create:render,act}=require('react-test-renderer');
const RN=require('react-native');
const {default:Svg,G,Path,Rect}=require('react-native-svg');
const {nativeSrgb,nativeDisplayP3}=require('@bloxwap/hig/tokens');
const mockModel=jest.requireActual('@bloxwap/hig/contracts/avatar');
// The renderer's own import of the model, wrapped so a test can count how often a face is computed and how often an Avatar renders:
// every render of the frame reads its size through `avatarSide` once, and a generated Avatar reads it once more for its face.
jest.mock('@bloxwap/hig/contracts/avatar',()=>{const actual=jest.requireActual('@bloxwap/hig/contracts/avatar');return {...actual,beamAvatar:jest.fn(actual.beamAvatar),avatarSide:jest.fn(actual.avatarSide)};});
const {beamAvatar,avatarSide}=require('@bloxwap/hig/contracts/avatar');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Surface}=require('../../packages/hig/native/src/surface');
const {Avatar,avatarColorRoles}=require('../../packages/hig/native/src/avatar');
const h=React.createElement;
const address='0x1111111111111111111111111111111111111111';
const vivid=['#00FF00','#00BBFF','#FF14A0','#FFFA00','#C300FF'];
let root;
function mount(props,provider){if(root)act(()=>root.unmount());const avatar=h(Avatar,{name:'Joe',...props});act(()=>{root=render(provider?h(HIGProvider,provider,avatar):avatar);});return root.root;}
function update(props,provider){const avatar=h(Avatar,{name:'Joe',...props});act(()=>root.update(provider?h(HIGProvider,provider,avatar):avatar));return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});
const flat=node=>RN.StyleSheet.flatten(node.props.style)??{};
const box=view=>view.findAll(node=>node.type===RN.View)[0];
function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{return run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
/** What the SVG paints, read back in the model's own terms. */
function drawn(view){
 const svg=view.findByType(Svg),[backdrop,wrapper,leftEye,rightEye]=view.findAllByType(Rect),group=view.findAll(node=>node.type===G&&node.props.transform!==undefined)[0],mouth=view.findByType(Path);
 const stroked=mouth.props.fill==='none';
 return {viewBox:svg.props.viewBox,width:svg.props.width,height:svg.props.height,backdrop:[backdrop.props.width,backdrop.props.height],backgroundColor:backdrop.props.fill,wrapper:[wrapper.props.width,wrapper.props.height],wrapperColor:wrapper.props.fill,wrapperTransform:wrapper.props.transform,wrapperRadius:wrapper.props.rx,faceTransform:group.props.transform,mouthPath:mouth.props.d,mouthStroked:stroked,faceColor:stroked?mouth.props.stroke:mouth.props.fill,mouthOther:stroked?mouth.props.fill:mouth.props.stroke,mouthCap:mouth.props.strokeLinecap,leftEyeX:leftEye.props.x,rightEyeX:rightEye.props.x,eyes:[leftEye,rightEye].map(eye=>[eye.props.y,eye.props.width,eye.props.height,eye.props.rx,eye.props.fill].join(' '))};
}

describe('Avatar without the new props is what it was',()=>{
 it('draws the first two letters on the well fill as a named image',()=>{
  const view=mount({name:'Demo account'}),disc=box(view);
  expect(flat(disc)).toEqual({width:40,height:40,borderRadius:20,backgroundColor:nativeSrgb.surface,alignItems:'center',justifyContent:'center'});
  expect(disc.props).toMatchObject({accessible:true,accessibilityRole:'image',accessibilityLabel:'Demo account'});
  const letters=view.findByType(RN.Text);expect(letters.props.children).toBe('De');expect(letters.props.accessible).toBe(false);expect(flat(letters)).toMatchObject({fontSize:16,lineHeight:24});
  expect(view.findAllByType(Svg)).toHaveLength(0);
  act(()=>root.unmount());act(()=>{root=render(h(Surface,null,h(Avatar,{name:'Demo account'})));});
  expect(flat(root.root.findAll(node=>node.props.accessibilityRole==='image')[0]).backgroundColor).toBe(nativeSrgb.nested);
 });
 it('draws the image under its name',()=>{
  const image=mount({name:'Demo account',source:{uri:'https://example.com/demo.png'}}).findByType(RN.Image);
  expect(image.props.source).toEqual({uri:'https://example.com/demo.png'});expect(image.props.accessibilityLabel).toBe('Demo account');expect(flat(image)).toEqual({width:40,height:40,borderRadius:20});
  // A label alone does not make an Image an accessibility element on iOS, so the photo is a named image like the fallback.
  expect(image.props.accessible).toBe(true);expect(image.props.accessibilityRole).toBe('image');expect(image.props.importantForAccessibility).toBeUndefined();
 });
 it('keeps the letters following the system text size when no size is given',()=>{
  expect(mount({name:'Demo account'}).findByType(RN.Text).props.maxFontSizeMultiplier).toBeUndefined();
  expect(mount({name:'Demo account'},{maxFontSizeMultiplier:1.5}).findByType(RN.Text).props.maxFontSizeMultiplier).toBe(1.5);
 });
});

describe('Avatar generated face',()=>{
 it('is opted into with variant, seeded by the name, and painted from the provider roles',()=>{
  const view=mount({name:'Demo account',variant:'beam'}),disc=box(view);
  expect(disc.props).toMatchObject({accessible:true,accessibilityRole:'image',accessibilityLabel:'Demo account'});
  expect(flat(disc)).toEqual({width:40,height:40,borderRadius:20,overflow:'hidden'});expect(view.findAllByType(RN.Text)).toHaveLength(0);
  expect(avatarColorRoles).toEqual(['action','info','negative','warning']);
  const face=mockModel.beamAvatar('Demo account',avatarColorRoles.map(role=>nativeSrgb[role]),{dark:nativeSrgb.background,light:nativeSrgb.text});
  expect(drawn(view)).toMatchObject({viewBox:'0 0 36 36',width:40,height:40,backdrop:[36,36],wrapper:[36,36],backgroundColor:face.backgroundColor,wrapperColor:face.wrapperColor,wrapperTransform:face.wrapperTransform,wrapperRadius:face.wrapperRadius,faceTransform:face.faceTransform,mouthPath:face.mouthPath,mouthStroked:face.mouthStroked,faceColor:nativeSrgb.background,mouthOther:'none',mouthCap:'round',leftEyeX:face.leftEyeX,rightEyeX:face.rightEyeX});
  expect(drawn(view).eyes).toEqual([`14 1.5 2 1 ${nativeSrgb.background}`,`14 1.5 2 1 ${nativeSrgb.background}`]);
 });
 it('is opted into by passing a seed, which the name does not change',()=>{
  const first=drawn(mount({seed:address}));
  expect(drawn(mount({name:'Someone else',seed:address}))).toEqual(first);
  expect(drawn(mount({seed:address.replace('1','2')}))).not.toEqual(first);
  // `variant` wins over the seed.
  const view=mount({seed:address,variant:'initials'});expect(view.findByType(RN.Text).props.children).toBe('Jo');expect(view.findAllByType(Svg)).toHaveLength(0);
 });
 it('draws the recorded boring-avatars faces from the host palette',()=>{
  const recorded=JSON.parse(readFileSync('tests/test-utils/boring-avatars-beam.json','utf8'));
  expect(recorded.faces.length).toBeGreaterThanOrEqual(32);
  for(const {seed,palette,...theirs} of recorded.faces)expect(drawn(mount({seed,colors:recorded.palettes[palette],faceColor:theirs.faceColor}))).toMatchObject(theirs);
 });
 it('paints the Display P3 table on an iOS host that asks for it, and sRGB elsewhere',()=>{
  const roles=table=>avatarColorRoles.map(role=>table[role]);
  const seeds=['a','b','c','d','e','f','g','h'];
  const painted=(os,provider)=>withOS(os,()=>seeds.flatMap(seed=>{const face=drawn(mount({seed},provider));return [face.wrapperColor,face.backgroundColor];}));
  const p3=painted('ios',{colorSpace:'display-p3'});
  for(const color of p3)expect(roles(nativeDisplayP3)).toContain(color);
  for(const role of ['action','info','negative','warning'])expect(p3).toContain(nativeDisplayP3[role]);
  for(const color of painted('android',{colorSpace:'display-p3'}))expect(roles(nativeSrgb)).toContain(color);
  for(const color of painted('ios',{}))expect(roles(nativeSrgb)).toContain(color);
  // The same seed lands on the same roles in both tables, so the face is the same picture in either space.
  const srgb=painted('ios',{});expect(p3.map(color=>roles(nativeDisplayP3).indexOf(color))).toEqual(srgb.map(color=>roles(nativeSrgb).indexOf(color)));
 });
 it('takes host colours as written and chooses each ink from them',()=>{
  const face=mockModel.beamAvatar(address,vivid);
  expect(drawn(mount({seed:address,colors:vivid}))).toMatchObject({wrapperColor:face.wrapperColor,backgroundColor:face.backgroundColor});
  expect(drawn(mount({seed:'a',colors:['#101010']})).faceColor).toBe(nativeSrgb.text);
  expect(drawn(mount({seed:'a',colors:['#f0f0f0']})).faceColor).toBe(nativeSrgb.background);
  expect(drawn(mount({seed:'a',colors:['#101010'],faceColor:'#0A0A0A'})).faceColor).toBe('#0A0A0A');
  // An empty palette is the default palette.
  expect(drawn(mount({seed:address,colors:[]}))).toEqual(drawn(mount({seed:address})));
  // A provider primary colour is read for the ink of a face that lands on the action role.
  const seed=['a','b','c','d','e','f','g','h'].find(candidate=>mockModel.beamAvatar(candidate,['','','','']).wrapperIndex===0);
  expect(drawn(mount({seed},{primaryColor:'#101080'}))).toMatchObject({wrapperColor:'#101080',faceColor:nativeSrgb.text});
 });
 it('is the same picture in right-to-left and under reduced motion, and animates nothing',()=>{
  const plain=drawn(mount({seed:address}));
  expect(drawn(mount({seed:address},{direction:'rtl',locale:'ar'}))).toEqual(plain);
  expect(drawn(mount({seed:address},{reducedMotion:true}))).toEqual(plain);
  expect(global.__loops).toHaveLength(0);expect(mount({seed:address}).findAllByType(RN.Animated.View)).toHaveLength(0);
 });
 it('does not compute or render the face again when its parent re-renders with the same seed and colours',()=>{
  mount({seed:address,colors:[...vivid]});
  const before=beamAvatar.mock.calls.length;expect(before).toBeGreaterThan(0);
  // A new array with the same colours and a new name are not a new face.
  update({seed:address,colors:[...vivid]});update({name:'Joseph',seed:address,colors:[...vivid]});
  expect(beamAvatar.mock.calls.length).toBe(before);
  update({name:'Joseph',seed:address,colors:[...vivid].reverse()});expect(beamAvatar.mock.calls.length).toBe(before+1);
  update({name:'Joseph',seed:address,colors:[...vivid].reverse(),size:64});expect(beamAvatar.mock.calls.length).toBe(before+2);
 });
});

describe('Avatar edge inputs',()=>{
 it('ignores a size that cannot be drawn and keeps the default box',()=>{
  for(const size of [NaN,Infinity,-Infinity,-5,'20',null]){
   expect(flat(box(mount({size})))).toEqual({width:40,height:40,borderRadius:20,backgroundColor:nativeSrgb.surface,alignItems:'center',justifyContent:'center'});
   expect(flat(mount({size}).findByType(RN.Text))).toMatchObject({fontSize:16,lineHeight:24});
   const face=mount({size,seed:address});expect(flat(box(face))).toEqual({width:40,height:40,borderRadius:20,overflow:'hidden'});expect(drawn(face)).toMatchObject({width:40,height:40});
   expect(flat(mount({size,source:7}).findByType(RN.Image))).toEqual({width:40,height:40,borderRadius:20});
  }
  // Zero and very large sizes are sizes.
  expect(drawn(mount({size:0,seed:address}))).toMatchObject({width:0,height:0,viewBox:'0 0 36 36'});
  expect(flat(box(mount({size:100000,seed:address})))).toMatchObject({width:100000,height:100000,borderRadius:50000});
 });
 it('letters sized to the box keep that size at every system text size',()=>{
  // Sized initials are 40% of the box; scaled by a large-text setting they would leave it, so they do not scale (as in HIG's other fixed discs).
  for(const size of [20,40,64])expect(mount({size}).findByType(RN.Text).props.maxFontSizeMultiplier).toBe(1);
  expect(mount({size:20},{maxFontSizeMultiplier:2}).findByType(RN.Text).props.maxFontSizeMultiplier).toBe(1);
  expect(mount({size:NaN}).findByType(RN.Text).props.maxFontSizeMultiplier).toBeUndefined();
 });
 it('shows the fallback for a source that names no image',()=>{
  // A host writes `source={{uri: photo}}` before the photo is known.
  for(const source of [{uri:undefined},{uri:null},{uri:''},{},[],[{uri:''}],null,undefined,0,'']){
   const seeded=mount({seed:address,source});expect(seeded.findAllByType(RN.Image)).toHaveLength(0);expect(seeded.findAllByType(Svg)).toHaveLength(1);
   const plain=mount({source});expect(plain.findAllByType(RN.Image)).toHaveLength(0);expect(plain.findByType(RN.Text).props.children).toBe('Jo');
  }
  for(const source of [{uri:'https://example.com/joe.png'},7,[{uri:'https://example.com/joe.png',width:40},{uri:'https://example.com/joe@2x.png',width:80}]])expect(mount({seed:address,source}).findAllByType(RN.Image)).toHaveLength(1);
  // The address arrives: the image is tried.
  mount({seed:address,source:{uri:undefined}});expect(update({seed:address,source:{uri:'https://example.com/joe.png'}}).findAllByType(RN.Image)).toHaveLength(1);
 });
 it('draws whole characters as initials, and treats a missing seed from untyped code as no seed',()=>{
  expect(mount({name:'A😀 x'}).findByType(RN.Text).props.children).toBe('A😀');expect(mount({name:'日本語のなまえ'}).findByType(RN.Text).props.children).toBe('日本');expect(mount({name:''}).findByType(RN.Text).props.children).toBe('');
  const view=mount({seed:null});expect(view.findAllByType(Svg)).toHaveLength(0);expect(view.findByType(RN.Text).props.children).toBe('Jo');
 });
 it('draws a face for an empty seed and for a very long one',()=>{
  expect(drawn(mount({seed:''})).wrapperTransform).toBe('translate(4 4) rotate(0 18 18) scale(1)');
  expect(drawn(mount({seed:'x'.repeat(200000)})).wrapperTransform).toMatch(/^translate\(-?[\d.]+ -?[\d.]+\) rotate\(-?\d+ 18 18\) scale\([\d.]+\)$/);
 });
 it('keeps the drawing when its provider renders again',()=>{
  const tree=tick=>h(HIGProvider,null,h(RN.View,{testID:String(tick)}),h(Avatar,{name:'Joe',seed:address,colors:[...vivid]}),h(Avatar,{name:'Ann',variant:'beam'}));
  act(()=>{root=render(tree(1));});const before=beamAvatar.mock.calls.length;
  for(let tick=2;tick<12;tick++)act(()=>root.update(tree(tick)));
  expect(beamAvatar.mock.calls.length).toBe(before);
 });
});

describe('Avatar in a list whose parent renders again',()=>{
 const sized=()=>avatarSide.mock.calls.length,faces=()=>beamAvatar.mock.calls.length;
 // Rows written inline, the way a leaderboard is: every render of the parent makes new elements, a new palette array and a new `{uri}` object, and nothing else is new.
 const kinds=[seed=>({seed,decorative:true}),seed=>({seed,size:32,colors:[...vivid],faceColor:nativeSrgb.text,square:true}),()=>({source:{uri:'https://example.com/joe.png'}}),()=>({})];
 const board=(seeds,onRender,Component=Avatar)=>h(React.Profiler,{id:'board',onRender},h(RN.View,null,seeds.map((seed,index)=>h(Component,{key:index,name:`Trader ${index}`,...kinds[index%4](seed)}))));
 /** The props object of every host view under the board: a view that rendered again has a new one. */
 const hosts=()=>root.root.findAll(node=>typeof node.type==='string').map(node=>node.props);
 const seeds=Array.from({length:20},(_,index)=>`0x${String(index).padStart(40,'0')}`);
 it('renders no frame and no face, and computes nothing, while every prop is the same',()=>{
  let commits=0;const onRender=()=>{commits++;},start={sized:sized(),faces:faces()};
  act(()=>{root=render(board(seeds,onRender));});
  // The counters count what they say: 20 frames, 10 of them with a generated face.
  expect(commits).toBe(1);expect(sized()-start.sized).toBe(30);expect(faces()-start.faces).toBe(10);
  const mounted={sized:sized(),faces:faces()},before=hosts(),picture=JSON.stringify(root.toJSON());
  expect(before.length).toBeGreaterThan(20);
  for(let tick=0;tick<10;tick++)act(()=>root.update(board([...seeds],onRender)));
  // The Profiler saw the parent render ten times; no Avatar under it did, so no host view was handed new props.
  expect(commits).toBe(11);expect(sized()-mounted.sized).toBe(0);expect(faces()-mounted.faces).toBe(0);
  const after=hosts();expect(after).toHaveLength(before.length);
  // The board's own View is the one host that rendered: it holds the new row elements.
  expect(after.filter((props,index)=>props!==before[index])).toHaveLength(1);expect(JSON.stringify(root.toJSON())).toBe(picture);
  // One row gets a new seed: its frame and its face render, and one face is computed.
  act(()=>root.update(board(seeds.map((seed,index)=>index===4?address:seed),onRender)));
  expect(commits).toBe(12);expect(sized()-mounted.sized).toBe(2);expect(faces()-mounted.faces).toBe(1);expect(JSON.stringify(root.toJSON())).not.toBe(picture);
 });
 it('renders again for each prop that changes, for a palette only when its colours change and for a source only when it names another image',()=>{
  const base={name:'Joe',seed:address,size:40,colors:vivid,faceColor:nativeSrgb.text,square:false,decorative:false};
  const photo={name:'Joe',seed:address,source:{uri:'https://example.com/joe.png',width:40}};
  const cases=[[base,[{name:'Ann'},{seed:'other'},{size:41},{colors:[...vivid].reverse()},{colors:vivid.slice(1)},{colors:undefined},{colors:[]},{faceColor:nativeSrgb.background},{faceColor:undefined},{square:true},{decorative:true},{variant:'initials'},{source:7}]],
   [photo,[{source:{uri:'https://example.com/joe-2.png',width:40}},{source:{uri:'https://example.com/joe.png',width:80}},{source:{uri:'https://example.com/joe.png'}},{source:[{uri:'https://example.com/joe.png',width:40}]},{source:undefined},{source:7}]]];
  for(const [props,changes] of cases){
   mount(props);
   for(const change of changes){
    update(props);const before=sized();
    // The same props again, with the palette and the source written inline: nothing renders.
    update({...props,...(props.colors?{colors:[...props.colors]}:{}),...(props.source?{source:{...props.source}}:{})});expect(sized()-before).toBe(0);
    update({...props,...change});expect(sized()-before).toBeGreaterThan(0);
   }
  }
  // A list of sources is compared item by item, and a field that is itself an object (headers) by identity.
  const list=()=>[{uri:'https://example.com/joe.png',width:40},{uri:'https://example.com/joe@2x.png',width:80}];
  mount({source:list()});let before=sized();update({source:list()});expect(sized()-before).toBe(0);
  update({source:list().reverse()});expect(sized()-before).toBeGreaterThan(0);
  const headers={Authorization:'token'};mount({source:{uri:'https://example.com/joe.png',headers}});before=sized();
  update({source:{uri:'https://example.com/joe.png',headers}});expect(sized()-before).toBe(0);
  update({source:{uri:'https://example.com/joe.png',headers:{...headers}}});expect(sized()-before).toBeGreaterThan(0);
  // A prop that is passed as undefined and one that is left out are the same props.
  mount({seed:address});before=sized();update({seed:address,source:undefined,colors:undefined,variant:undefined});expect(sized()-before).toBe(0);
 });
 it('an avatar without a seed does not render again either',()=>{
  const {Avatar:Plain}=require('../../packages/hig/native/src/avatar');
  let commits=0;const onRender=()=>{commits++;};
  act(()=>{root=render(board(seeds,onRender,Plain));});
  const mounted=sized(),before=hosts();
  for(let tick=0;tick<10;tick++)act(()=>root.update(board([...seeds],onRender,Plain)));
  expect(commits).toBe(11);expect(sized()-mounted).toBe(0);expect(hosts().filter((props,index)=>props!==before[index])).toHaveLength(1);
  act(()=>root.update(board(seeds,onRender,Plain)));act(()=>root.update(h(React.Profiler,{id:'board',onRender},h(RN.View,null,h(Plain,{name:'Trader 0',size:24})))));
  expect(sized()-mounted).toBe(1);
 });
 it('draws a generated Avatar in nine native views, a photo in one and initials in two',()=>{
  // Each host view is a native view on a device. The face is react-native-svg's root, the group it wraps its children in, and the six shapes of the web drawing.
  const views=props=>{mount(props);const count=node=>node===null||typeof node==='string'?0:1+(node.children??[]).reduce((sum,child)=>sum+count(child),0);return count(root.toJSON());};
  expect(views({seed:address})).toBe(9);expect(views({source:7})).toBe(1);expect(views({})).toBe(2);
 });
});

describe('Avatar size, shape, image and accessibility',()=>{
 it('size sets the box of every content, and scales the initials',()=>{
  let view=mount({size:20});
  expect(flat(box(view))).toMatchObject({width:20,height:20,borderRadius:10});expect(flat(view.findByType(RN.Text))).toMatchObject({fontSize:8,lineHeight:12});
  view=mount({seed:address,size:144});
  expect(flat(box(view))).toEqual({width:144,height:144,borderRadius:72,overflow:'hidden'});expect(drawn(view)).toMatchObject({width:144,height:144,viewBox:'0 0 36 36'});
  expect(flat(mount({source:7,size:64}).findByType(RN.Image))).toEqual({width:64,height:64,borderRadius:32});
 });
 it('square removes the rounding of every content',()=>{
  expect(flat(box(mount({square:true}))).borderRadius).toBe(0);
  expect(flat(box(mount({seed:address,square:true})))).toEqual({width:40,height:40,borderRadius:0,overflow:'hidden'});
  expect(flat(mount({source:7,square:true}).findByType(RN.Image)).borderRadius).toBe(0);
 });
 it('shows the image when given one, and the fallback when it fails to load',()=>{
  let view=mount({seed:address,source:{uri:'https://example.com/joe.png'}});
  expect(view.findAllByType(Svg)).toHaveLength(0);
  act(()=>view.findByType(RN.Image).props.onError({nativeEvent:{error:'404'}}));
  expect(view.findAllByType(RN.Image)).toHaveLength(0);expect(view.findAllByType(Svg)).toHaveLength(1);expect(box(view).props.accessibilityLabel).toBe('Joe');
  // The same address in a new object is not tried again; a new address is.
  view=update({seed:address,source:{uri:'https://example.com/joe.png'}});expect(view.findAllByType(RN.Image)).toHaveLength(0);
  view=update({seed:address,source:{uri:'https://example.com/joe-2.png'}});expect(view.findAllByType(RN.Image)).toHaveLength(1);
  // Without the opt-in the fallback is the initials, for a required asset as well.
  view=mount({source:7});act(()=>view.findByType(RN.Image).props.onError({nativeEvent:{error:'missing'}}));
  expect(view.findAllByType(RN.Image)).toHaveLength(0);expect(view.findByType(RN.Text).props.children).toBe('Jo');
 });
 it('decorative hides every content from VoiceOver and TalkBack',()=>{
  const unread={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants'};
  for(const props of [{seed:address},{}]){const disc=box(mount({...props,decorative:true}));expect(disc.props).toMatchObject(unread);expect(disc.props.accessibilityLabel).toBeUndefined();expect(disc.props.accessibilityRole).toBeUndefined();}
  const image=mount({source:7,decorative:true}).findByType(RN.Image);expect(image.props).toMatchObject(unread);expect(image.props.accessibilityLabel).toBeUndefined();expect(image.props.accessibilityRole).toBeUndefined();
  // Named, the photo, the face and the letters read the same way.
  for(const props of [{source:7},{seed:address},{}]){const named=mount(props).findAll(node=>node.props.accessibilityRole==='image')[0];expect(named.props).toMatchObject({accessible:true,accessibilityRole:'image',accessibilityLabel:'Joe'});}
 });
});

describe('Avatar without a generated face',()=>{
 it('keeps the SVG peer in the avatar entry: the status entry and the frame the Avatar draws in import no react-native-svg',()=>{
  const loads=file=>/from 'react-native-svg[/']|require\('react-native-svg/.test(readFileSync(`packages/hig/native/src/${file}`,'utf8'));
  expect(['status.tsx','avatar-frame.tsx','surface.tsx','icons.tsx','provider.tsx'].filter(loads)).toEqual([]);expect(loads('brand.tsx')).toBe(true);
  expect(readFileSync('packages/hig/native/src/avatar.tsx','utf8')).toMatch(/from 'react-native-svg'/);
 });
 it('without a seed is the plain frame: size, square, decorative and the image fallback, and no generated face',()=>{
  const {Avatar:Plain}=require('../../packages/hig/native/src/avatar');
  const plain=props=>{if(root)act(()=>root.unmount());act(()=>{root=render(h(Plain,{name:'Joe',...props}));});return root.root;};
  expect(flat(box(plain({})))).toEqual({width:40,height:40,borderRadius:20,backgroundColor:nativeSrgb.surface,alignItems:'center',justifyContent:'center'});
  expect(flat(box(plain({size:64,square:true})))).toMatchObject({width:64,height:64,borderRadius:0});
  expect(box(plain({decorative:true})).props).toMatchObject({accessible:false,importantForAccessibility:'no-hide-descendants'});
  const view=plain({source:{uri:'https://example.com/joe.png'}});act(()=>view.findByType(RN.Image).props.onError({nativeEvent:{error:'404'}}));expect(view.findByType(RN.Text).props.children).toBe('Jo');
  expect(plain({}).findAllByType(Svg)).toHaveLength(0);
 });
});
