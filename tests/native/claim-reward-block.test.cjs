const React=require('react');
const {act,create}=require('react-test-renderer');
const {ClaimRewardBlock}=require('../../packages/hig/native/src/claim-reward-block');
const {Button}=require('../../packages/hig/native/src/button');

it('shows a prize with host-owned Claim and Cancel actions',()=>{
 const props={amount:100,symbol:'USDC',walletAddress:'0x1234',chain:'Base',details:[{label:'Sweepstakes',value:'Weekly drawing'}],labels:{wallet:'Destination wallet',chain:'Chain',title:'Sweepstakes prize',claim:'Claim',cancel:'Cancel'},onClaim:jest.fn(),onCancel:jest.fn()};
 let root;
 act(()=>{root=create(React.createElement(ClaimRewardBlock,props));});
 try {
  const buttons=root.root.findAllByType(Button);
  expect(buttons.map(b=>b.props.children)).toEqual(['Cancel','Claim']);
  act(()=>buttons[0].props.onPress());
  expect(props.onClaim).not.toHaveBeenCalled();
  expect(props.onCancel).toHaveBeenCalledTimes(1);
  act(()=>buttons[1].props.onPress());
  expect(props.onClaim).toHaveBeenCalledTimes(1);
 } finally {act(()=>root.unmount());}
});
