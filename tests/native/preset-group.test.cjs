// PresetGroup: quick choices as equal-width chips that wrap into rows, single choice or none, each chip a HIG Button that reads selected.
const React=require('react');
const {create,act}=require('react-test-renderer');
const {StyleSheet,View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {PresetGroup}=require('../../packages/hig/native/src/selection');
const {Button}=require('../../packages/hig/native/src/button');
const h=React.createElement;
const sizes=[{value:10,label:'$10',testID:'size-10'},{value:25,label:'$25'},{value:50,label:'$50'},{value:100,label:'$100'},{value:1000,label:'$1,000',disabled:true},{value:-1,label:'Max',testID:'size-max'}];
let root;
function mount(props,provider={}){act(()=>{root=create(h(HIGProvider,provider,h(PresetGroup,{options:sizes,...props})));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
const chips=tree=>tree.findAllByType(Button);
const host=(tree,id)=>tree.findAll(node=>node.props.testID===id&&typeof node.type==='string')[0];
const flat=node=>StyleSheet.flatten(node.props.style);
const press=(node)=>act(()=>{node.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false});});

it('draws one Button per option in the selected intent, reading selected, with per-option test IDs',()=>{
 const tree=mount({value:25,testID:'size',label:'Size'});
 expect(chips(tree).map(chip=>[chip.props.children,chip.props.intent,chip.props.accessibilityState.selected,chip.props.disabled])).toEqual([['$10','secondary',false,undefined],['$25','primary',true,undefined],['$50','secondary',false,undefined],['$100','secondary',false,undefined],['$1,000','secondary',false,true],['Max','secondary',false,undefined]]);
 // An option's own test ID wins; otherwise `<group>-<value>`.
 expect(chips(tree).map(chip=>chip.props.testID)).toEqual(['size-10','size-25','size-50','size-100','size-1000','size-max']);
 // React Native has no named group, so the group's name is each chip's hint, and the container is not read.
 expect(host(tree,'size').props.accessibilityLabel).toBeUndefined();
 expect(chips(tree).map(chip=>chip.props.accessibilityHint)).toEqual(Array(6).fill('Size'));
 expect(host(tree,'size-25').props.accessibilityHint).toBe('Size');
 // Each chip is a 44dp Button with its 48dp touch target, the label in the provider's interface face.
 expect(chips(tree).every(chip=>chip.props.suppressFeedback===true)).toBe(true);
 expect(flat(host(tree,'size-25'))).toMatchObject({minHeight:44,flex:1,alignSelf:'auto',paddingHorizontal:8});
 expect(host(tree,'size-25').props.hitSlop).toEqual({top:2,bottom:2,left:4,right:4});
});

it('gives every chip a 48dp touch target whose slop meets, but never overlaps, its neighbours 8 apart',()=>{
 const tree=mount({value:null,testID:'size',columns:4});
 const slop=host(tree,'size-25').props.hitSlop,height=flat(host(tree,'size-25')).minHeight;
 // 44 + 2 + 2 = 48 tall.
 expect(height+slop.top+slop.bottom).toBe(48);
 // Chips and rows are 8 apart: the two slops between neighbours add to no more than the gap.
 const rows=host(tree,'size').children.filter(node=>typeof node!=='string');
 const columnGap=flat(rows[0]).gap,rowGap=flat(host(tree,'size')).gap;
 expect(slop.left+slop.right).toBeLessThanOrEqual(columnGap);expect(slop.top+slop.bottom).toBeLessThanOrEqual(rowGap);
 // A chip squeezed under 48 wide (seven columns in 320dp: (320 - 6 x 8) / 7 = 38.9) still reaches its column pitch.
 const chipWidth=(320-6*columnGap)/7;expect(chipWidth+slop.left+slop.right).toBeCloseTo(chipWidth+columnGap);
 // Without a label no hint is set.
 expect(mount({value:null,testID:'plain'}).findAllByType(Button).every(chip=>chip.props.accessibilityHint===undefined)).toBe(true);
});

it('defaults to one row and wraps into equal-width rows with columns, holding the short row\'s empty cells',()=>{
 let tree=mount({value:null,testID:'size',style:{marginTop:16}});
 expect(flat(host(tree,'size'))).toMatchObject({flexDirection:'row',gap:8,marginTop:16,direction:'ltr',alignSelf:'stretch'});expect(chips(tree).every(chip=>!chip.props.accessibilityState.selected)).toBe(true);
 tree=mount({value:null,testID:'size',columns:4,style:{marginTop:16}});
 const group=host(tree,'size');expect(flat(group)).toMatchObject({gap:8,marginTop:16,alignSelf:'stretch'});expect(flat(group).flexDirection).toBeUndefined();
 const rows=group.children.filter(node=>typeof node!=='string');expect(rows).toHaveLength(2);
 expect(rows.map(row=>row.findAllByType(Button).length)).toEqual([4,2]);
 expect(rows.every(row=>flat(row).flexDirection==='row'&&flat(row).gap===8)).toBe(true);
 // Two empty flex cells keep the last row's chips one column wide.
 const cells=rows[1].findAll(node=>typeof node.type==='string'&&node.children.length===0&&flat(node)?.flex===1);expect(cells).toHaveLength(2);expect(cells.every(cell=>flat(cell).flex===1)).toBe(true);
});

it('keeps the column width in one row when columns outnumber the options, like the web grid',()=>{
 const tree=mount({options:sizes.slice(0,3),columns:4,testID:'size'});
 const group=host(tree,'size');expect(flat(group).flexDirection).toBe('row');expect(chips(tree)).toHaveLength(3);
 expect(group.findAll(node=>typeof node.type==='string'&&node.children.length===0&&flat(node)?.flex===1)).toHaveLength(1);
});

it('follows the provider direction',()=>{
 expect(flat(host(mount({testID:'size'},{direction:'rtl'}),'size')).direction).toBe('rtl');
});

it('reports a new choice once and ignores the selected chip and a dimmed one; a disabled group dims every chip',()=>{
 const change=jest.fn();let tree=mount({value:25,onValueChange:change});
 press(chips(tree)[2]);expect(change).toHaveBeenCalledWith(50);
 press(chips(tree)[1]);press(chips(tree)[4]);expect(change).toHaveBeenCalledTimes(1);
 tree=mount({value:25,onValueChange:change,disabled:true});expect(chips(tree).every(chip=>chip.props.disabled===true)).toBe(true);
});

it('keeps its own selection when uncontrolled and plays selection feedback, unless suppressed',()=>{
 const emit=jest.fn(),change=jest.fn();let tree=mount({defaultValue:10,onValueChange:change},{feedback:{emit}});
 press(chips(tree)[3]);expect(change).toHaveBeenCalledWith(100);expect(chips(tree)[3].props.accessibilityState.selected).toBe(true);
 expect(emit).toHaveBeenCalledTimes(1);expect(emit.mock.calls[0][0]).toMatchObject({intent:'selection',origin:'native'});
 act(()=>root.unmount());root=null;emit.mockClear();
 tree=mount({defaultValue:10,suppressFeedback:true},{feedback:{emit}});press(chips(tree)[3]);expect(chips(tree)[3].props.accessibilityState.selected).toBe(true);expect(emit).not.toHaveBeenCalled();
});

it('takes the selected intent the host gives it',()=>{
 expect(chips(mount({value:-1,selectedIntent:'destructive'}))[5].props.intent).toBe('destructive');
});
