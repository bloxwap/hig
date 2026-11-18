/** Gaps the app conversions found: small optional props on shared components (native). */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,TextInput}=require('react-native');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Field,Input}=require('../../packages/hig/native/src/field');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

describe('Input prefix',()=>{
 it('draws the prefix muted on the leading edge, starts the text after it once measured, and leads the hint with it',()=>{
  const view=mount(h(Field,{label:'Username',description:'Letters and digits.'},h(Input,{prefix:'@',testID:'handle',value:'joe'})));
  const input=view.findByType(TextInput);expect(input.props.value).toBe('joe');expect(input.props.accessibilityLabel).toBe('Username');expect(input.props.accessibilityHint).toBe('@. Letters and digits.');
  const prefix=host(view,'handle-prefix');expect(text(prefix)).toBe('@');expect(flat(prefix).color).toBe(nativeSrgb.muted);
  // The prefix is hidden from assistive technology: the hint already says it.
  let node=prefix;while(node&&!node.props.accessibilityElementsHidden)node=node.parent;expect(node).toBeTruthy();
  expect(flat(input).paddingStart).toBe(20+10+4);
  act(()=>prefix.props.onLayout({nativeEvent:{layout:{width:13.2}}}));expect(flat(view.findByType(TextInput)).paddingStart).toBe(20+14+4);
 });
 it('leaves an input without a prefix as before, and keeps a host hint',()=>{
  let view=mount(h(Field,{label:'Name',description:'Shown on your profile.'},h(Input,{testID:'name'})));
  const input=view.findByType(TextInput);expect(input.props.accessibilityHint).toBe('Shown on your profile.');expect(flat(input).paddingStart).toBeUndefined();expect(all(view,'name-prefix')).toHaveLength(0);
  view=mount(h(Input,{prefix:'$',accessibilityHint:'Amount in dollars'}));expect(view.findByType(TextInput).props.accessibilityHint).toBe('Amount in dollars');
 });
});

describe('ListRow accessibilityLabel and a rich description',()=>{
 const {ListRow}=require('../../packages/hig/native/src/list-group');
 const {Text}=require('../../packages/hig/native/src/surface');
 const {View}=require('react-native');
 const rich=h(View,{testID:'rich',style:{flexDirection:'row'}},h(View,{testID:'arrow'}),h(Text,{style:{color:'#0f0'}},'10×'),h(Text,null,' • 0.5'));
 it('draws a description of several nodes as given in a View, and names a pressable row with accessibilityLabel',()=>{
  const select=jest.fn();
  const view=mount(h(ListRow,{testID:'btc',label:'BTC',description:rich,value:'+$12',onSelect:select,accessibilityLabel:'Long BTC, 10×, 0.5 BTC, up $12'}));
  const description=host(view,'btc-description');expect(description.type).toBe('View');expect(all(description,'rich').length).toBeGreaterThan(0);expect(all(description,'arrow').length).toBeGreaterThan(0);
  const row=view.findAll(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function'&&typeof node.type!=='string')[0];
  expect(row.props.accessibilityLabel).toBe('Long BTC, 10×, 0.5 BTC, up $12');
  act(()=>row.props.onPress());expect(select).toHaveBeenCalledTimes(1);
 });
 it('keeps a string or a single Text description in the muted line, read with the label as before',()=>{
  let view=mount(h(ListRow,{testID:'a',label:'Wallet',description:'0x12…34',onSelect:()=>{}}));
  const line=host(view,'a-description');expect(line.type).toBe('Text');expect(flat(line).color).toBe(nativeSrgb.muted);
  expect(view.findAll(node=>node.props.accessibilityLabel==='Wallet, 0x12…34'&&typeof node.type!=='string').length).toBeGreaterThan(0);
  view=mount(h(ListRow,{testID:'b',label:'Wallet',description:h(Text,null,'Pending'),onSelect:()=>{}}));expect(host(view,'b-description').type).toBe('Text');
 });
 it('keeps a fragment or an array holding bare text in the muted line, so no string lands in a View',()=>{
  let view=mount(h(ListRow,{testID:'f',label:'Round',description:h(React.Fragment,null,'Ends in ',h(Text,null,'3m'))}));
  let line=host(view,'f-description');expect(line.type).toBe('Text');expect(flat(line).color).toBe(nativeSrgb.muted);
  view=mount(h(ListRow,{testID:'n',label:'Round',description:h(React.Fragment,null,h(React.Fragment,null,['Ends in ',h(Text,{key:'t'},'3m')]))}));expect(host(view,'n-description').type).toBe('Text');
  view=mount(h(ListRow,{testID:'r',label:'Round',description:['Ends in ',h(Text,{key:'t'},'3m')]}));expect(host(view,'r-description').type).toBe('Text');
  view=mount(h(ListRow,{testID:'s',label:'Withdrawal',description:h(React.Fragment,null,h(Text,null,'0x12…34'),h(Text,null,'Tx 0xab…cd'))}));expect(host(view,'s-description').type).toBe('View');
 });
 it('makes a static row one element named by accessibilityLabel, and keeps a trailing control its own target',()=>{
  let view=mount(h(ListRow,{testID:'s',label:'Withdrawal',description:rich,value:'$40',accessibilityLabel:'Withdrawal, $40, pending'}));
  const row=host(view,'s');expect(row.props.accessible).toBe(true);expect(row.props.accessibilityLabel).toBe('Withdrawal, $40, pending');
  const press=jest.fn();
  view=mount(h(ListRow,{testID:'t',label:'Withdrawal',value:'$40',accessibilityLabel:'Withdrawal, $40, pending',trailing:h(require('../../packages/hig/native/src/button').Button,{testID:'t-cancel',onPress:press},'Cancel')}));
  expect(host(view,'t').props.accessible).toBeUndefined();
  expect(view.findAll(node=>node.props.accessible===true&&node.props.accessibilityLabel==='Withdrawal, $40, pending'&&typeof node.type==='string')).toHaveLength(1);
  const value=host(view,'t-value');expect(value.props.accessibilityElementsHidden).toBe(true);
  const cancel=view.findAll(node=>node.props.testID==='t-cancel'&&node.props.accessibilityRole==='button'&&typeof node.type==='string')[0];let node=cancel;let hiddenAbove=false;while(node){if(node.props.accessibilityElementsHidden)hiddenAbove=true;node=node.parent;}expect(hiddenAbove).toBe(false);
 });
 it('names a switch row with accessibilityLabel, its description staying the hint',()=>{
  const view=mount(h(ListRow,{testID:'sw',label:'Alerts',description:'Price moves',checked:true,onCheckedChange:()=>{},accessibilityLabel:'Price alerts'}));
  const control=view.findAll(node=>node.props.accessibilityRole==='switch'&&typeof node.type==='string')[0];expect(control.props.accessibilityLabel).toBe('Price alerts');expect(control.props.accessibilityHint).toBe('Price moves');
 });
});

describe('SwapAmountCard and SwapPill (native, as web)',()=>{
 const {SwapAmountCard,SwapPill}=require('../../packages/hig/native/src/swap-amount-card');
 const blocks=require('../../packages/hig/native/src/blocks');
 const panel=require('../../packages/hig/native/src/swap-block');
 const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
 it('is exported from the blocks aggregate and the swap panel module',()=>{expect(blocks.SwapAmountCard).toBe(SwapAmountCard);expect(blocks.SwapPill).toBe(SwapPill);expect(panel.SwapAmountCard).toBe(SwapAmountCard);expect(panel.SwapPill).toBe(SwapPill);});
 it('draws the slot (context over name, actions and meta trailing) and the amount with prefix, typed fraction digits and a trailing dot',()=>{
  const max=jest.fn(),select=jest.fn();
  const view=mount(h(SwapAmountCard,{testID:'burn',name:'Bloxwap',symbol:'BLOX',context:'Hyperliquid',value:1.5,fractionDigits:2,trailingDot:false,prefix:'$',amountLabel:'Burn amount',onSelect:select,selectLabel:'Choose token',actions:h(SwapPill,{testID:'burn-max',onPress:max},'Max'),meta:'12.5 BLOX',conversion:h(SwapPill,{testID:'burn-usd'},'= $3.00')}));
  expect(text(host(view,'burn-name'))).toBe('Bloxwap');expect(text(host(view,'burn-context'))).toBe('Hyperliquid');expect(text(host(view,'burn-meta'))).toBe('12.5 BLOX');
  const amount=host(view,'burn-amount');expect(amount.props.accessibilityLabel).toBe('Burn amount');expect(amount.props.accessibilityValue).toEqual({text:'$1.50'});
  const readout=view.findAllByType(AnimatedNumberReadout)[0];expect(readout.props).toMatchObject({value:1.5,prefix:'$',suffix:''});expect(readout.props.options).toMatchObject({minimumFractionDigits:2,maximumFractionDigits:8,useGrouping:false});
  const slot=view.findAll(node=>node.props.testID==='burn-select'&&typeof node.props.onPress==='function')[0];expect(slot.props.accessibilityLabel).toBe('Choose token');act(()=>slot.props.onPress());expect(select).toHaveBeenCalledTimes(1);
  const pill=view.findAll(node=>node.props.testID==='burn-max'&&node.props.accessibilityRole==='button'&&typeof node.type!=='string')[0];expect(pill.props.accessibilityRole).toBe('button');act(()=>pill.props.onPress());expect(max).toHaveBeenCalledTimes(1);
  expect(all(host(view,'burn-conversion'),'burn-usd').length).toBeGreaterThan(0);
  const dotted=mount(h(SwapAmountCard,{testID:'d',name:'USD Coin',symbol:'USDC',value:12,trailingDot:true,suffix:'%',amountLabel:'Amount'}));
  expect(host(dotted,'d-amount').props.accessibilityValue).toEqual({text:'12.%'});expect(dotted.findAllByType(AnimatedNumberReadout)[0].props.suffix).toBe('.%');
  expect(all(dotted,'d-select')).toHaveLength(0);expect(all(dotted,'d-actions')).toHaveLength(0);
 });
 it('SwapPill draws text muted, passes Pressable props and reads as unavailable when disabled',()=>{
  const press=jest.fn();
  const view=mount(h(SwapPill,{testID:'pill',onPress:press,disabled:true,accessibilityLabel:'Use maximum',android_disableSound:true},'Max'));
  const pill=view.findAll(node=>node.props.testID==='pill'&&node.props.accessibilityRole==='button'&&typeof node.type!=='string')[0];
  expect(pill.props).toMatchObject({accessibilityLabel:'Use maximum',accessibilityState:{disabled:true},disabled:true,android_disableSound:true});expect(flat(pill).opacity).toBe(0.5);expect(flat(pill).minHeight).toBe(32);
  expect(view.findAll(node=>typeof node.type==='string'&&node.children.includes('Max')).map(node=>flat(node).color)).toContain(nativeSrgb.muted);
 });
});

describe('AssetBalanceRow trailingInteractive',()=>{
 const {AssetBalanceRow}=require('../../packages/hig/native/src/asset-balance-row');
 const {Button}=require('../../packages/hig/native/src/button');
 it('keeps a trailing control its own target beside the row button, out of the row reading',()=>{
  const select=jest.fn(),copy=jest.fn();
  const view=mount(h(AssetBalanceRow,{testID:'usdc',name:'USD Coin',symbol:'USDC',value:12,onSelect:select,trailing:h(Button,{testID:'usdc-copy',onPress:copy},'Copy'),trailingInteractive:true}));
  const main=view.findAll(node=>node.props.testID==='usdc-main'&&typeof node.props.onPress==='function'&&typeof node.type!=='string')[0];
  expect(main.props.accessibilityRole).toBe('button');expect(main.props.accessibilityLabel).toBe('USD Coin, USDC, $12.00');
  act(()=>main.props.onPress());expect(select).toHaveBeenCalledTimes(1);
  expect(all(main,'usdc-copy')).toHaveLength(0);
  const trailing=host(view,'usdc-trailing');expect(trailing.props.accessibilityElementsHidden).toBeUndefined();
  const copyButton=view.findAll(node=>node.props.testID==='usdc-copy'&&typeof node.props.onPress==='function'&&typeof node.type!=='string')[0];act(()=>copyButton.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));expect(copy).toHaveBeenCalledTimes(1);
 });
 it('without it, folds the trailing text into the row reading as before',()=>{
  const view=mount(h(AssetBalanceRow,{testID:'u',name:'USD Coin',symbol:'USDC',value:12,onSelect:()=>{},trailing:'Main'}));
  const row=view.findAll(node=>node.props.testID==='u'&&typeof node.props.onPress==='function'&&typeof node.type!=='string')[0];expect(row.props.accessibilityLabel).toBe('USD Coin, USDC, $12.00, Main');expect(all(view,'u-main')).toHaveLength(0);
 });
});

describe('Spinner hideLabel',()=>{
 const {Spinner}=require('../../packages/hig/native/src/status');
 it('draws the indicator alone and keeps the label as the accessibility label',()=>{
  jest.useFakeTimers();
  let view=mount(h(Spinner,{label:'Loading quote',hideLabel:true,testID:'spin'}),{reducedMotion:false});
  const spin=host(view,'spin');expect(spin.props.accessible).toBe(true);expect(spin.props.accessibilityLabel).toBe('Loading quote');
  expect(view.findAll(node=>typeof node.type==='string'&&node.children.includes('Loading quote'))).toHaveLength(0);
  const indicator=require('react-native').ActivityIndicator;
  act(()=>jest.advanceTimersByTime(999));expect(view.findAllByType(indicator)).toHaveLength(0);
  act(()=>jest.advanceTimersByTime(1));expect(view.findAllByType(indicator)).toHaveLength(1);
  jest.useRealTimers();
  view=mount(h(Spinner,{label:'Loading quote',testID:'spin'}));expect(view.findAll(node=>typeof node.type==='string'&&node.children.includes('Loading quote')).length).toBeGreaterThan(0);
 });
});
