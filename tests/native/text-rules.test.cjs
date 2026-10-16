// Native Button text rules (#92), busy accessible name (#94), plainText spacing (#102) and Slider action labels (#87).
// Evidence: automated (Jest, jest-expo preset, React Native Testing Library over react-test-renderer).
const React=require('react');
const rntl=require('@testing-library/react-native');
// RNTL reassigns its live `screen` binding on each render, so read it through the module object.
const {render,act,cleanup}=rntl;
const RN=require('react-native');
const {HIGProvider}=require('../../packages/native/src/provider');
const {Button,IconButton,busyAccessibilityLabel}=require('../../packages/native/src/button');
const {Alert}=require('../../packages/native/src/status');
const {Slider}=require('../../packages/native/src/slider');
const {Text,detectScript}=require('../../packages/native/src/surface');
const {plainText,blockText}=require('../../packages/native/src/text-content');
const en=require('../../packages/contracts/dist/messages.js');
const h=React.createElement;
afterEach(cleanup);
function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{return run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
/** Host RN Text nodes rendered for a button's label runs and busy suffix. */
const runs=()=>rntl.screen.UNSAFE_root.findAllByType(RN.Text);
const run=text=>runs().find(n=>[].concat(n.props.children).join('')===text);
const style=node=>RN.StyleSheet.flatten(node.props.style);
// Test fixtures only: HIG approves no translation locale, hosts own these catalogs. One entry per `messages.busy` locale
// the native tests exercise; `en` is the shipped default.
const locales=[
 {locale:'en-US',messages:undefined,text:'Log out',busy:en.busy},
 {locale:'fr-FR',messages:{busy:'En cours'},text:'Déconnexion',busy:'En cours'},
 {locale:'ko-KR',messages:{busy:'처리 중'},text:'로그아웃',busy:'처리 중'},
 {locale:'ar-EG',messages:{busy:'جارٍ التنفيذ'},text:'تأكيد',busy:'جارٍ التنفيذ'},
];

describe('#92 native Button label and busy suffix render through HIG Text',()=>{
 it('applies the provider font-scale cap to the label and the suffix, and a Button prop overrides it',()=>{
  // One tree per case keeps each render independent (RNTL keeps one live screen per test).
  render(h(View0,null,h(HIGProvider,{maxFontSizeMultiplier:2},h(Button,{busy:true},'Log out'),h(Button,{busy:true,busyLabel:'Busy (prop cap)',maxFontSizeMultiplier:1.5},'Sign out')),h(Button,{busy:true,busyLabel:'Uncapped'},'Leave')));
  expect(run('Log out').props.maxFontSizeMultiplier).toBe(2);
  expect(run(' · Working').props.maxFontSizeMultiplier).toBe(2);
  expect(run('Sign out').props.maxFontSizeMultiplier).toBe(1.5);
  expect(run(' · Busy (prop cap)').props.maxFontSizeMultiplier).toBe(1.5);
  expect(run('Leave').props.maxFontSizeMultiplier).toBeUndefined();
  expect(run(' · Uncapped').props.maxFontSizeMultiplier).toBeUndefined();
 });
 it('gives the label and the busy suffix the registered family for the 600 weight',()=>{
  // Without a registered 600 face (second provider) the base family is kept and the platform synthesizes the weight, on both runs.
  render(h(View0,null,h(HIGProvider,{fontFamily:'BloxwapSansRegular',fontFamilies:{400:'BloxwapSansRegular',600:'BloxwapSansSemiBold'},messages:{busy:'En cours'}},h(Button,{busy:true},'Déconnexion')),h(HIGProvider,{fontFamily:'BloxwapSansRegular'},h(Button,{busy:true},'Log out'))));
  for(const text of ['Déconnexion',' · En cours']){const s=style(run(text));expect(s.fontFamily).toBe('BloxwapSansSemiBold');expect(s.fontWeight).toBe('normal');expect(s.fontSize).toBe(16);}
  for(const text of ['Log out',' · Working']){const s=style(run(text));expect(s.fontFamily).toBe('BloxwapSansRegular');expect(s.fontWeight).toBe('600');}
 });
 it('applies per-script letter spacing to CJK label and suffix runs, not to Latin runs',()=>{
  // The second provider has no override: default companion-face spacing (0em).
  render(h(View0,null,h(HIGProvider,{locale:'ko-KR',letterSpacingByScript:{ko:0.02,zh:0.01},messages:{busy:'처리 중'}},h(Button,{busy:true},'로그아웃'),h(Button,null,'中文'),h(Button,null,'Log out')),h(HIGProvider,{messages:{busy:'작업 중'}},h(Button,{busy:true},'취소'))));
  expect(style(run('로그아웃')).letterSpacing).toBeCloseTo(0.32);
  expect(style(run(' · 처리 중')).letterSpacing).toBeCloseTo(0.32);
  expect(style(run('中文')).letterSpacing).toBeCloseTo(0.16);
  expect(style(run('Log out')).letterSpacing).toBeUndefined();
  expect(style(run('취소')).letterSpacing).toBe(0);expect(style(run(' · 작업 중')).letterSpacing).toBe(0);
 });
 it('keeps label colour, centring and writing direction on both runs',()=>{
  render(h(HIGProvider,{direction:'rtl',messages:{busy:'جارٍ التنفيذ'}},h(Button,{busy:true,intent:'secondary'},'تأكيد')));
  const {nativeSrgb:colors}=require('../../packages/tokens/dist/index.js');
  for(const text of ['تأكيد',' · جارٍ التنفيذ']){const s=style(run(text));expect(s.color).toBe(colors.text);expect(s.textAlign).toBe('center');expect(s.writingDirection).toBe('rtl');}
 });
});

describe('#94 busy native Button keeps its accessible name',()=>{
 it.each(locales)('iOS: busy Button in $locale is named `{text} · {busy}` and the name contains the visible label',({locale,messages,text,busy})=>withOS('ios',()=>{
  render(h(HIGProvider,{locale,messages},h(Button,{busy:true},text)));
  const button=rntl.screen.getByRole('button');
  expect(button.props.accessibilityLabel).toBe(`${text} · ${busy}`);
  expect(button.props.accessibilityLabel).toContain(text);
  expect(button.props.accessibilityState).toEqual({disabled:true,busy:true});
  expect(rntl.screen.getByLabelText(`${text} · ${busy}`)).toBe(button);
  expect(run(text)).toBeTruthy();expect(run(` · ${busy}`)).toBeTruthy();
 }));
 it.each(locales)('Android: busy Button in $locale is named with the visible label; the platform busy state description supplies the busy word once',({locale,messages,text,busy})=>withOS('android',()=>{
  render(h(HIGProvider,{locale,messages},h(Button,{busy:true},text)));
  const button=rntl.screen.getByRole('button');
  expect(button.props.accessibilityLabel).toBe(text);
  expect(button.props.accessibilityLabel).not.toContain(busy);
  expect(button.props.accessibilityState.busy).toBe(true);
  // The visible suffix still renders.
  expect(run(` · ${busy}`)).toBeTruthy();
 }));
 it('an empty busy label names the Button with its text alone; busy state stays set',()=>{
  for(const os of ['ios','android'])withOS(os,()=>{
   const {getAllByRole,unmount}=render(h(View0,null,h(HIGProvider,{messages:{busy:'처리 중'}},h(Button,{busy:true,busyLabel:''},'로그아웃')),h(HIGProvider,{messages:{busy:''}},h(Button,{busy:true},'Log out'))));
   const [prop,provider]=getAllByRole('button');
   expect(prop.props.accessibilityLabel).toBe('로그아웃');expect(prop.props.accessibilityState.busy).toBe(true);
   expect(provider.props.accessibilityLabel).toBe('Log out');expect(provider.props.accessibilityState.busy).toBe(true);
   unmount();
  });
 });
 it('an explicit accessibilityLabel wins; idle buttons and buttons without text keep the default name',()=>withOS('ios',()=>{
  render(h(View0,null,h(Button,{busy:true,accessibilityLabel:'Sign out of Bloxwap'},'Log out'),h(IconButton,{busy:true,label:'Confirm selection'},h(RN.View)),h(Button,null,'Log out'),h(Button,{busy:true},h(RN.View))));
  const [explicit,icon,idle,iconOnly]=rntl.screen.getAllByRole('button');
  expect(explicit.props.accessibilityLabel).toBe('Sign out of Bloxwap');
  expect(icon.props.accessibilityLabel).toBe('Confirm selection');
  expect(idle.props.accessibilityLabel).toBeUndefined();
  expect(iconOnly.props.accessibilityLabel).toBeUndefined();
 }));
 it('mixed text children form one name with single spaces',()=>withOS('ios',()=>{
  render(h(Button,{busy:true},'Copy ',3,h(RN.Text,null,' items')));
  expect(rntl.screen.getByRole('button').props.accessibilityLabel).toBe('Copy 3 items · Working');
 }));
 it('busyAccessibilityLabel follows the platform rule',()=>{
  expect(busyAccessibilityLabel('Log out','Working','ios')).toBe('Log out · Working');
  expect(busyAccessibilityLabel('Log out','Working','android')).toBe('Log out');
  expect(busyAccessibilityLabel('Log out','','ios')).toBe('Log out');
  expect(busyAccessibilityLabel('','Working','ios')).toBeUndefined();
 });
});
function View0({children}){return h(RN.View,null,children);}

describe('#102 plainText concatenates text nodes as rendered',()=>{
 /** Visible string of a host Text run: nested Text renders inline, so child strings concatenate. */
 const visible=node=>[].concat(node.props.children).map(c=>typeof c==='string'||typeof c==='number'?String(c):c&&c.props?visible(c):'').join('');
 it('a mixed ReactNode Alert title is announced exactly as displayed, with no doubled whitespace',()=>withOS('ios',()=>{
  const original=RN.AccessibilityInfo.announceForAccessibilityWithOptions;const announce=RN.AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();
  try{
   render(h(Alert,{title:h(React.Fragment,null,'Display-only ',h(Text,null,'value'),' strings')},h(Text,null,'First line.'),h(Text,null,'Second  line')));
   const heading=rntl.screen.getByRole('header');
   const shown=visible(rntl.screen.UNSAFE_root.findAll(n=>n.type===RN.Text&&n.props.accessibilityRole==='header')[0]);
   expect(shown).toBe('Display-only value strings');
   expect(announce).toHaveBeenCalledTimes(1);
   const [message]=announce.mock.calls[0];
   expect(message.startsWith(`${shown}. `)).toBe(true);
   expect(message).toBe('Display-only value strings. First line. Second line');
   expect(message).not.toMatch(/\s{2}/);
   expect(heading).toBeTruthy();
  }finally{RN.AccessibilityInfo.announceForAccessibilityWithOptions=original;}
 }));
 it('adds no separator between text nodes and collapses whitespace runs',()=>{
  expect(plainText(h(React.Fragment,null,'Display-only ',h(Text,null,'value'),' strings'))).toBe('Display-only value strings');
  expect(plainText(['Bit',h(Text,{key:1},'coin'),' (BTC)'])).toBe('Bitcoin (BTC)');
  expect(plainText(['  Price:\n\t',67234.56,'  '])).toBe('Price: 67234.56');
  expect(plainText([null,false,'',h(RN.View,{key:1})])).toBe('');
  expect(blockText([h(Text,{key:1},'One'),h(Text,{key:2},' two ')])).toBe('One two');
 });
 it('Text script detection still sees nested CJK runs',()=>{
  expect(detectScript(plainText(['Bloxwap ',h(Text,{key:1},'한국어')]),'en-US')).toBe('ko');
  render(h(HIGProvider,{letterSpacingByScript:{ko:0.05}},h(Text,{testID:'nested'},'Bloxwap ',h(RN.Text,null,'한국어'))));
  expect(style(rntl.screen.getByTestId('nested')).letterSpacing).toBeCloseTo(0.8);
 });
});

describe('#87 native Slider increment/decrement actions carry localizable labels',()=>{
 const adjustable=()=>rntl.screen.UNSAFE_root.findAll(n=>n.props.accessibilityRole==='adjustable'&&n.props.accessible&&n.props.onAccessibilityAction)[0];
 it('defaults to the English increase/decrease messages',()=>{
  expect(en.increase).toBe('Increase');expect(en.decrease).toBe('Decrease');
  render(h(Slider,{label:'Volume',defaultValue:20}));
  expect(adjustable().props.accessibilityActions).toEqual([{name:'increment',label:'Increase'},{name:'decrement',label:'Decrease'}]);
  for(const action of adjustable().props.accessibilityActions)expect(action.label.length).toBeGreaterThan(0);
 });
 it('takes host translations from HIGProvider messages, and adjustment still works',()=>{
  const change=jest.fn();
  render(h(HIGProvider,{locale:'fr-FR',messages:{increase:'Augmenter',decrease:'Diminuer'}},h(Slider,{label:'Volume',defaultValue:20,onValueChange:change})));
  expect(adjustable().props.accessibilityActions).toEqual([{name:'increment',label:'Augmenter'},{name:'decrement',label:'Diminuer'}]);
  act(()=>adjustable().props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));
  expect(change).toHaveBeenLastCalledWith(25);
  act(()=>adjustable().props.onAccessibilityAction({nativeEvent:{actionName:'setProgress',value:61}}));
  expect(change).toHaveBeenLastCalledWith(61);
 });
 it('a disabled slider keeps the labels and still rejects adjustment',()=>{
  const change=jest.fn();
  render(h(Slider,{label:'Volume',value:30,disabled:true,onValueChange:change}));
  expect(adjustable().props.accessibilityActions.map(a=>a.label)).toEqual(['Increase','Decrease']);
  act(()=>adjustable().props.onAccessibilityAction({nativeEvent:{actionName:'increment'}}));
  act(()=>adjustable().props.onAccessibilityAction({nativeEvent:{actionName:'setProgress',value:80}}));
  expect(change).not.toHaveBeenCalled();
 });
});
