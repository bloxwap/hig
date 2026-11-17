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
