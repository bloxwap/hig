const React=require('react');
const {act,create}=require('react-test-renderer');
const {AccessibilityInfo,Platform,ScrollView}=require('react-native');
const {ClaimRewardBlock}=require('../../packages/hig/native/src/claim-reward-block');
const {Button,Link}=require('../../packages/hig/native/src/button');
const {Checkbox}=require('../../packages/hig/native/src/checkbox');
const {Alert}=require('../../packages/hig/native/src/status');

const h=React.createElement;
const address='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77768';
const words={wallet:'Wallet',chain:'Chain',title:'Claim prize',claim:'Claim $20',cancel:'Cancel',claiming:'Sending your prize…',paid:'Prize paid',expired:'This prize was not claimed in time',withheld:'This prize is under review',attestationRequired:'Tick the box to claim',done:'Done'};
const attest='I accept the official rules.';
const page=(overrides={})=>({amount:20,symbol:'USDC',walletAddress:address,chain:'Base',details:[{label:'Draw',value:'#7'},{label:'Time left',value:'35m'}],labels:words,note:'Paid in USDC to your Bloxwap wallet.',status:'ready',
 attestation:{label:attest,checked:false,onCheckedChange:jest.fn(),links:[{label:'Official rules',href:'https://example.com/rules',onSelect:jest.fn()}]},onClaim:jest.fn(),onCancel:jest.fn(),...overrides});
const ticked=props=>({...props.attestation,checked:true});
let root;
function mount(props){if(root)act(()=>root.unmount());act(()=>{root=create(h(ClaimRewardBlock,props));});return root.root;}
const update=props=>{act(()=>root.update(h(ClaimRewardBlock,props)));return root.root;};
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
// The Pressable a control renders: where its role, state and guarded press live.
const pressable=node=>node.findAll(child=>typeof child.type!=='string'&&!!child.props.accessibilityRole&&typeof child.props.onPress==='function')[0];
const press=node=>act(()=>pressable(node).props.onPress({stopPropagation(){},preventDefault(){},isDefaultPrevented:()=>false}));
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;jest.restoreAllMocks();});

it('shows a prize with host-owned Claim and Cancel actions',()=>{
 const props={amount:100,symbol:'USDC',walletAddress:'0x1234',chain:'Base',details:[{label:'Sweepstakes',value:'Weekly drawing'}],labels:{wallet:'Destination wallet',chain:'Chain',title:'Sweepstakes prize',claim:'Claim',cancel:'Cancel'},onClaim:jest.fn(),onCancel:jest.fn()};
 const view=mount(props);
 const buttons=view.findAllByType(Button);
 expect(buttons.map(b=>b.props.children)).toEqual(['Cancel','Claim']);
 act(()=>buttons[0].props.onPress());
 expect(props.onClaim).not.toHaveBeenCalled();
 expect(props.onCancel).toHaveBeenCalledTimes(1);
 act(()=>buttons[1].props.onPress());
 expect(props.onClaim).toHaveBeenCalledTimes(1);
 // Nothing of the claim step is drawn for the 0.10.0 props.
 expect(view.findAllByType(Checkbox)).toHaveLength(0);expect(view.findAllByType(Link)).toHaveLength(0);expect(view.findAllByType(Alert)).toHaveLength(0);
 for(const part of ['status','note','attestation','back'])expect(all(view,`claim-reward-${part}`)).toHaveLength(0);
 expect(buttons[1].props).toMatchObject({disabled:false,busy:false});expect(buttons[1].props.accessibilityHint).toBeUndefined();
});

it('keeps Claim unavailable, with its reason, until the attestation is ticked',()=>{
 const props=page();
 let view=mount(props);
 expect(text(host(view,'claim-reward-note'))).toBe('Paid in USDC to your Bloxwap wallet.');
 expect(view.findAll(node=>typeof node.type==='string'&&node.props.accessibilityLabel==='Time left, 35m')).toHaveLength(1);
 const box=view.findByType(Checkbox);
 expect(box.props).toMatchObject({label:attest,checked:false,disabled:false});
 expect(pressable(box).props).toMatchObject({accessibilityRole:'checkbox',accessibilityState:{checked:false,disabled:false}});
 expect(button(view,'claim-reward-claim').props).toMatchObject({disabled:true,accessibilityHint:'Tick the box to claim'});
 expect(pressable(button(view,'claim-reward-claim')).props.accessibilityState).toMatchObject({disabled:true});
 press(button(view,'claim-reward-claim'));expect(props.onClaim).not.toHaveBeenCalled();
 const rules=view.findByType(Link);
 expect(rules.props).toMatchObject({href:'https://example.com/rules',children:'Official rules'});expect(pressable(rules).props.accessibilityRole).toBe('link');
 press(rules);expect(props.attestation.links[0].onSelect).toHaveBeenCalledTimes(1);
 press(box);expect(props.attestation.onCheckedChange).toHaveBeenCalledWith(true);
 view=update({...props,attestation:ticked(props)});
 expect(button(view,'claim-reward-claim').props.disabled).toBe(false);expect(button(view,'claim-reward-claim').props.accessibilityHint).toBeUndefined();
 press(button(view,'claim-reward-claim'));expect(props.onClaim).toHaveBeenCalledTimes(1);
 // The status region is mounted and empty while ready.
 expect(text(host(view,'claim-reward-status'))).toBe('');
});

it('holds the checkbox and Claim while the prize is being sent, and says so',()=>{
 const props=page();
 const view=mount({...props,attestation:ticked(props),status:'claiming'});
 expect(view.findByType(Checkbox).props.disabled).toBe(true);
 expect(button(view,'claim-reward-claim').props).toMatchObject({busy:true});
 expect(pressable(button(view,'claim-reward-claim')).props.accessibilityState).toMatchObject({disabled:true,busy:true});
 press(button(view,'claim-reward-claim'));expect(props.onClaim).not.toHaveBeenCalled();
 expect(text(host(view,'claim-reward-status'))).toBe('Sending your prize…');
 press(button(view,'claim-reward-cancel'));expect(props.onCancel).toHaveBeenCalledTimes(1);
});

it('replaces the actions with the paid line and the transaction link',()=>{
 const props=page(),onSelect=jest.fn();
 let view=mount({...props,attestation:ticked(props),status:'claiming'});
 view=update({...props,attestation:ticked(props),status:'paid',transaction:{label:'View transaction',href:'https://example.com/tx/1',onSelect}});
 expect(text(host(view,'claim-reward-status'))).toBe('Prize paid');
 expect(view.findAllByType(Checkbox)).toHaveLength(0);
 expect(view.findAllByType(Button).map(node=>node.props.testID)).toEqual(['claim-reward-done']);
 const link=view.findByType(Link);
 expect(link.props).toMatchObject({testID:'claim-reward-transaction',href:'https://example.com/tx/1',children:'View transaction'});
 press(link);expect(onSelect).toHaveBeenCalledTimes(1);
 press(button(view,'claim-reward-done'));expect(props.onCancel).toHaveBeenCalledTimes(1);
 view=update({...props,status:'paid',labels:{...words,done:undefined}});
 expect(view.findAllByType(Button)).toHaveLength(0);expect(view.findAllByType(Link)).toHaveLength(0);
});

it.each([['expired','This prize was not claimed in time'],['withheld','This prize is under review']])('shows the %s line and no way to claim',(status,line)=>{
 const view=mount(page({status,error:'Ignored once final',transaction:{label:'View transaction',href:'https://example.com/tx/1'}}));
 expect(text(host(view,'claim-reward-status'))).toBe(line);
 expect(view.findAllByType(Checkbox)).toHaveLength(0);expect(view.findAllByType(Alert)).toHaveLength(0);expect(view.findAllByType(Link)).toHaveLength(0);
 expect(view.findAllByType(Button).map(node=>node.props.testID)).toEqual(['claim-reward-done']);
});

it('speaks a changed status line on iOS and not the line the pane opens with',()=>{
 const os=Platform.OS;Platform.OS='ios';
 // React Native's jest setup already mocks AccessibilityInfo; earlier tests have called it.
 const speak=jest.spyOn(AccessibilityInfo,'announceForAccessibilityWithOptions').mockImplementation(()=>{});
 const plain=jest.spyOn(AccessibilityInfo,'announceForAccessibility').mockImplementation(()=>{});
 speak.mockClear();plain.mockClear();
 try{
  const props=page();
  let view=mount({...props,status:'expired'});
  expect(speak).not.toHaveBeenCalled();
  expect(host(view,'claim-reward-status').props.accessibilityLiveRegion).toBe('none');
  view=mount({...props,attestation:ticked(props)});
  update({...props,attestation:ticked(props),status:'claiming'});
  expect(speak).toHaveBeenLastCalledWith('Sending your prize…',{queue:true});
  update({...props,attestation:ticked(props),status:'paid'});
  expect(speak).toHaveBeenLastCalledWith('Prize paid',{queue:true});
  expect(speak).toHaveBeenCalledTimes(2);
  // Android reads the same line through its live region, so nothing is spoken twice.
  Platform.OS='android';speak.mockClear();
  view=mount({...props,attestation:ticked(props)});
  expect(host(view,'claim-reward-status').props.accessibilityLiveRegion).toBe('polite');
  view=update({...props,attestation:ticked(props),status:'claiming'});
  expect(text(host(view,'claim-reward-status'))).toBe('Sending your prize…');
  expect(speak).not.toHaveBeenCalled();expect(plain).not.toHaveBeenCalled();
 }finally{Platform.OS=os;}
});

it('shows a failed claim as an alert and leaves Claim available for another try',()=>{
 const props=page();
 const view=mount({...props,attestation:ticked(props),error:'The payout could not be sent. Try again.'});
 expect(view.findByType(Alert).props).toMatchObject({severity:'error',title:'The payout could not be sent. Try again.'});
 expect(button(view,'claim-reward-claim').props).toMatchObject({disabled:false,busy:false});
 press(button(view,'claim-reward-claim'));expect(props.onClaim).toHaveBeenCalledTimes(1);
});

it('draws Back in the header, names the title and pins the header in its own scroller',()=>{
 const onBack=jest.fn();
 let view=mount(page({onBack,headingId:'claim-heading'}));
 expect(host(view,'claim-reward-title').props).toMatchObject({nativeID:'claim-heading',accessibilityRole:'header'});
 expect(text(host(view,'claim-reward-title'))).toBe('Claim prize');
 const back=view.find(node=>node.props.testID==='claim-reward-back'&&typeof node.type!=='string');
 press(back);expect(onBack).toHaveBeenCalledTimes(1);
 expect(view.findAllByType(ScrollView)).toHaveLength(0);
 view=mount(page({onBack,stickyHeader:true,testID:'prize'}));
 expect(view.findByType(ScrollView).props).toMatchObject({testID:'prize',stickyHeaderIndices:[0]});
 expect(all(view,'prize-sticky-header').length).toBeGreaterThan(0);expect(button(view,'prize-claim')).toBeTruthy();
});
