/** Native Avatar: the image, the initials it always drew, and the generated beam face in react-native-svg. */
const React=require('react');
const {readFileSync}=require('node:fs');
const {create:render,act}=require('react-test-renderer');
const RN=require('react-native');
const {default:Svg,G,Path,Rect}=require('react-native-svg');
const {nativeSrgb,nativeDisplayP3}=require('@bloxwap/hig/tokens');
const mockModel=jest.requireActual('@bloxwap/hig/contracts/avatar');
// The renderer's own import of the model, wrapped so a test can count how often a face is computed.
jest.mock('@bloxwap/hig/contracts/avatar',()=>{const actual=jest.requireActual('@bloxwap/hig/contracts/avatar');return {...actual,beamAvatar:jest.fn(actual.beamAvatar)};});
const {beamAvatar}=require('@bloxwap/hig/contracts/avatar');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Surface}=require('../../packages/hig/native/src/surface');
const {Avatar,avatarColorRoles}=require('../../packages/hig/native/src/status');
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
  expect(image.props.accessible).toBeUndefined();expect(image.props.importantForAccessibility).toBeUndefined();
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
  const image=mount({source:7,decorative:true}).findByType(RN.Image);expect(image.props).toMatchObject(unread);expect(image.props.accessibilityLabel).toBeUndefined();
 });
});
