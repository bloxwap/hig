const React=require('react');
const {act,create}=require('react-test-renderer');
const {PositionsBlock}=require('../../packages/hig/native/src/positions-block');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {PositionSummaryRow}=require('../../packages/hig/native/src/manage-position-block');
const {Button}=require('../../packages/hig/native/src/button');

it('keeps the bulk close action below the filtered rows and counts every position',()=>{
 const positions=[{id:'btc',name:'Bitcoin',side:'long',pnl:-.08,pnlPercent:-.1483},{id:'eth',name:'Ethereum',side:'short',pnl:4}];
 const onSelect=jest.fn(),onCloseAll=jest.fn();
 const labels={title:'Positions',all:'All',wins:'Wins',losses:'Losses',empty:'No matching positions',long:'Long',short:'Short',closeAll:n=>'Close All ('+n+')'};
 let tree;
 act(()=>{tree=create(React.createElement(PositionsBlock,{positions,labels,onSelect,onCloseAll}));});
 try{
  act(()=>tree.root.findByType(SegmentedControl).props.onValueChange('losses'));
  const rows=tree.root.findAllByType(PositionSummaryRow);
  expect(rows.map(row=>row.props.position.id)).toEqual(['btc']);
  act(()=>rows[0].props.position.onSelect());expect(onSelect).toHaveBeenCalledWith(positions[0]);
  const close=tree.root.findByType(Button);expect(close.props.children).toBe('Close All (2)');
  act(()=>close.props.onPress());expect(onCloseAll).toHaveBeenCalledTimes(1);
 }finally{act(()=>tree.unmount());}
});
