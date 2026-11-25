const React=require('react');
const {create,act}=require('react-test-renderer');
const {ReferralCodeBlock}=require('../../packages/hig/native/src/referral-code-block');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const labels={title:'Referral code',volume:'Traded volume',goal:g=>'of '+g,remaining:r=>r+' to go',unlocked:'Unlocked',field:'Your code',set:'Set code',
 confirmTitle:c=>'Set '+c+'?',oneTime:'One time only',confirmWarning:'Cannot be changed',acknowledge:'I understand',confirm:'Confirm code',cancel:'Back',yourCode:'Your referral code',copy:'Copy code',copied:'Copied',share:'Share link'};
const mount=props=>{let root;act(()=>{root=create(React.createElement(HIGProvider,null,React.createElement(ReferralCodeBlock,{goal:10000,labels,onSetCode:()=>{},...props})));});return root;};
const text=root=>JSON.stringify(root.toJSON());
it('fills the bar to the traded share of the goal',()=>{
 const root=mount({volume:6250});
 try{
  expect(root.root.findByProps({testID:'referral-code-fill'}).props.style.width).toBe('62.5%');
  expect(text(root)).toContain('$3,750 to go');
 }finally{act(()=>root.unmount());}
});
it('confirms the code once ticked and then shares it',async()=>{
 const onSetCode=jest.fn(),onShare=jest.fn();
 const root=mount({volume:12000,onSetCode,onShare,shareUrl:'https://app.hyperliquid.xyz/join/BLOX'});
 try{
  act(()=>root.root.findByProps({testID:'referral-code-input'}).props.onChangeText('blox!'));
  act(()=>root.root.findByProps({testID:'referral-code-set'}).props.onPress());
  expect(root.root.findByProps({testID:'referral-code-confirm-button'}).props.disabled).toBe(true);
  expect(text(root)).toContain('Set BLOX?');
  await act(async()=>{root.root.findByProps({testID:'referral-code-confirm-button'}).props.onPress();});
  expect(onSetCode).not.toHaveBeenCalled();
  const {Checkbox}=require('../../packages/hig/native/src/checkbox');
  act(()=>root.root.findByType(Checkbox).props.onCheckedChange(true));
  await act(async()=>{root.root.findByProps({testID:'referral-code-confirm-button'}).props.onPress();});
  expect(onSetCode).toHaveBeenCalledWith('BLOX');
  act(()=>root.update(React.createElement(HIGProvider,null,React.createElement(ReferralCodeBlock,{goal:10000,labels,volume:12000,code:'BLOX',onSetCode,onShare,shareUrl:'https://app.hyperliquid.xyz/join/BLOX'}))));
  expect(text(root)).toContain('app.hyperliquid.xyz/join/BLOX');
  act(()=>root.root.findByProps({testID:'referral-code-share-button'}).props.onPress());
  expect(onShare).toHaveBeenCalledWith('BLOX','https://app.hyperliquid.xyz/join/BLOX');
 }finally{act(()=>root.unmount());}
});
