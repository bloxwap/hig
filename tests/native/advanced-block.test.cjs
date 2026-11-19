const React=require('react');
const {act,create}=require('react-test-renderer');
const {AdvancedBlock}=require('../../packages/hig/native/src/advanced-block');
const {ListGroup,ListRow}=require('../../packages/hig/native/src/list-group');

it('derives progress from host state and sends account actions to the matching callbacks',()=>{
 const onExport=jest.fn(),onSelect=jest.fn(),onDeleteAccount=jest.fn(),onUnifiedExchangeChange=jest.fn();
 const props={title:'Advanced',exchangeLabel:'Unified Exchange',unifiedExchange:false,onUnifiedExchangeChange,
  tasksTitle:'Tasks',completeLabel:'Complete',incompleteLabel:'Incomplete',
  tasks:[{id:'referral',label:'Referral',detail:'4% off',complete:false,onSelect}],
  warningTitle:'Sensitive',warningBody:'Never share private keys.',accountTitle:'Account',
  wallets:[{id:'sol',label:'Export Solana',address:'72ze1234567890129Gij',onExport}],deleteLabel:'Delete account',onDeleteAccount};
 let root;act(()=>{root=create(React.createElement(AdvancedBlock,props));});
 try{
  const row=label=>root.root.findAllByType(ListRow).find(node=>node.props.label===label);
  const count=()=>root.root.findAllByType(ListGroup).find(node=>node.props.title==='Tasks').props.titleAccessory;
  expect(count()).toBe('(0/1)');
  expect(row('Referral').props.accessibilityLabel).toContain('Incomplete');
  expect(row('Export Solana').props.value).toBe('72ze12…9Gij');
  row('Referral').props.onSelect();row('Export Solana').props.onSelect();row('Delete account').props.onSelect();
  row('Unified Exchange').props.onCheckedChange(true);
  expect(onSelect).toHaveBeenCalledTimes(1);expect(onExport).toHaveBeenCalledTimes(1);expect(onDeleteAccount).toHaveBeenCalledTimes(1);
  expect(onUnifiedExchangeChange).toHaveBeenCalledWith(true);
  act(()=>root.update(React.createElement(AdvancedBlock,{...props,unifiedExchange:true,tasks:[{...props.tasks[0],complete:true}]})));
  expect(count()).toBe('(1/1)');expect(row('Unified Exchange').props.checked).toBe(true);
 }finally{act(()=>root.unmount());}
});
