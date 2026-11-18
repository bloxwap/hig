// Button href (a filled pill that is a link), Button glow, and Badge tone and dot.
const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const {Button}=require('../../packages/hig/native/src/button');
const {Badge}=require('../../packages/hig/native/src/status');
const {HIGProvider,useColors}=require('../../packages/hig/native/src/provider');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();jest.clearAllMocks();});
function render(element,feedback){act(()=>{const next=React.createElement(HIGProvider,{feedback},element);if(root)root.update(next);else root=create(next);});return root.root;}
const control=tree=>tree.findAll(node=>node.props.accessibilityRole&&typeof node.props.onPress==='function')[0];
const event=()=>({stopPropagation:jest.fn(),preventDefault:jest.fn(),isDefaultPrevented:()=>false});
function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{return run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
let colors;const Probe=()=>{colors=useColors();return null;};
describe('Button href',()=>{
 it('is a link that opens through Linking, with failures to onError, and still emits feedback',async()=>{
  const error=new Error('No handler'),open=jest.spyOn(RN.Linking,'openURL').mockRejectedValue(error),onError=jest.fn(),feedback={emit:jest.fn()};
  const link=control(render(React.createElement(Button,{href:'https://bloxwap.com/docs',onError,intent:'secondary'},'Docs'),feedback));
  expect(link.props.accessibilityRole).toBe('link');expect(link.props.href).toBeUndefined();
  await act(async()=>{link.props.onPress(event());await Promise.resolve();});
  expect(open).toHaveBeenCalledWith('https://bloxwap.com/docs');expect(open).toHaveBeenCalledTimes(1);expect(onError).toHaveBeenCalledWith(error);expect(feedback.emit).toHaveBeenCalledTimes(1);
 });
 it('a host onPress replaces Linking; disabled or busy blocks both',()=>{
  const open=jest.spyOn(RN.Linking,'openURL').mockResolvedValue(undefined),navigate=jest.fn();
  let link=control(render(React.createElement(Button,{href:'/trade/BTC',onPress:navigate},'Trade BTC')));
  act(()=>link.props.onPress(event()));expect(navigate).toHaveBeenCalledTimes(1);expect(open).not.toHaveBeenCalled();
  for(const state of [{disabled:true},{busy:true}]){link=control(render(React.createElement(Button,{href:'/trade/BTC',...state},'Trade BTC')));act(()=>link.props.onPress(event()));expect(link.props.accessibilityState.disabled).toBe(true);}
  expect(open).not.toHaveBeenCalled();
 });
 it('on React Native Web renders the href and stops the anchor navigating as well',()=>withOS('web',()=>{
  jest.spyOn(RN.Linking,'openURL').mockResolvedValue(undefined);
  let link=control(render(React.createElement(Button,{href:'/docs'},'Docs')));expect(link.props.href).toBe('/docs');
  const press=event();act(()=>link.props.onPress(press));expect(press.preventDefault).toHaveBeenCalled();
  link=control(render(React.createElement(Button,{href:'/docs',disabled:true},'Docs')));expect(link.props.href).toBeUndefined();
 }));
 it('without href stays a button',()=>{expect(control(render(React.createElement(Button,null,'Plain'))).props.accessibilityRole).toBe('button');});
});
describe('Button glow',()=>{
 it('draws a halo in the fill colour on filled intents only, and none while unavailable',()=>{
  const shadow=props=>RN.StyleSheet.flatten(control(render(React.createElement(React.Fragment,null,React.createElement(Probe),React.createElement(Button,{glow:true,...props},'Trade BTC')))).props.style({pressed:false})).boxShadow;
  expect(shadow({})).toBe(`0 0 60px 8px ${colors.action}73, 0 0 120px 20px ${colors.action}33`);
  expect(shadow({intent:'up'})).toContain(colors.up);
  expect(shadow({intent:'secondary'})).toBeUndefined();expect(shadow({intent:'ghost'})).toBeUndefined();expect(shadow({disabled:true})).toBeUndefined();
  expect(shadow({glow:false})).toBeUndefined();
 });
 it('market colours in any React Native format still glow, as they do on web',()=>{
  const shadow=(up,props)=>{let tree;act(()=>{tree=create(React.createElement(HIGProvider,{marketColors:{up}},React.createElement(Button,{glow:true,intent:'up',...props},'Buy')));});try{return RN.StyleSheet.flatten(control(tree.root).props.style({pressed:false})).boxShadow;}finally{act(()=>tree.unmount());}};
  expect(shadow('#0a0')).toBe('0 0 60px 8px rgba(0,170,0,0.45), 0 0 120px 20px rgba(0,170,0,0.2)');
  expect(shadow('rgb(10, 20, 30)')).toBe('0 0 60px 8px rgba(10,20,30,0.45), 0 0 120px 20px rgba(10,20,30,0.2)');
  expect(shadow('rgba(10, 20, 30, 0.5)')).toBe('0 0 60px 8px rgba(10,20,30,0.226), 0 0 120px 20px rgba(10,20,30,0.1)');
  expect(shadow('green')).toBe('0 0 60px 8px rgba(0,128,0,0.45), 0 0 120px 20px rgba(0,128,0,0.2)');
  expect(shadow('#00aa00')).toBe('0 0 60px 8px #00aa0073, 0 0 120px 20px #00aa0033');
 });
});
describe('Badge tone and dot',()=>{
 it('neutral keeps the well chip; a tone colours the label over a 15% wash',()=>{
  let tree=render(React.createElement(React.Fragment,null,React.createElement(Probe),React.createElement(Badge,null,'New')));
  expect(RN.StyleSheet.flatten(tree.findByType(RN.Text).props.style).color).not.toBe(colors.negative);
  tree=render(React.createElement(Badge,{tone:'negative'},'Off the tape'));
  const style=RN.StyleSheet.flatten(tree.findByType(RN.Text).props.style);expect(style.color).toBe(colors.negative);expect(style.backgroundColor).toBe(`${colors.negative}26`);
 });
 it('dot draws a hidden 6dp mark before the label',()=>{
  const tree=render(React.createElement(Badge,{tone:'negative',dot:true,testID:'status'},'Off the tape'));
  const chip=tree.findAllByType(RN.View).find(node=>node.props.testID==='status');const [dot]=chip.findAllByType(RN.View).filter(node=>node!==chip&&node.props.accessibilityElementsHidden);
  expect(RN.StyleSheet.flatten(dot.props.style)).toMatchObject({width:6,height:6,backgroundColor:colors.negative});expect(dot.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(RN.StyleSheet.flatten(chip.props.style)).toMatchObject({flexDirection:'row',backgroundColor:`${colors.negative}26`});
 });
});

it('reads custom children for a busy name only when the host has not supplied one',()=>{
 const textContent=require('../../packages/hig/native/src/text-content');
 const reading=jest.spyOn(textContent,'plainText');
 const children=React.createElement(RN.Text,null,'Submit trade');
 const button=props=>React.createElement(Button,{contentMode:'custom',...props},children);
 for(let i=0;i<20;i++)render(button({disabled:i%2===0}));
 render(button({busy:true,accessibilityLabel:'Submitting'}));
 expect(reading).toHaveBeenCalledTimes(0);
 const tree=render(button({busy:true}));
 expect(reading).toHaveBeenCalledTimes(1);
 expect(control(tree).props.accessibilityLabel).toContain('Submit trade');
});
