/** Native PositionBlock: header with Close, the summary lines, a note, the paper trading switch, then the setting groups. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {PositionBlock}=require('../../packages/hig/native/src/position-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {ListGroup,ListRow}=require('../../packages/hig/native/src/list-group');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
const usd={style:'currency',currency:'USD'};
// The host owns every trading word.
const base={title:'Position',details:[{label:'Notional',value:{value:400,options:{...usd,maximumFractionDigits:0}}},{label:'Fee',value:{value:0.53,options:usd},tone:'negative'},{label:'Liquidation',value:{value:-0.025,options:{style:'percent',maximumFractionDigits:2}},tone:'negative'}],groups:[]};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(PositionBlock,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const lines=view=>view.findAll(node=>typeof node.type==='string'&&String(node.props.testID).startsWith('position-detail-')).map(node=>node.props.accessibilityLabel);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('shows the host title as the heading, Close and Back only with their handlers, and a host control in place of Close',()=>{
 let view=mount();
 expect(text(host(view,'position-title'))).toBe('Position');expect(host(view,'position-title').props.accessibilityRole).toBe('header');expect(has(view,'position-close')).toBe(false);expect(has(view,'position-back')).toBe(false);
 const close=jest.fn(),back=jest.fn();view=mount({onClose:close,onBack:back});
 expect(all(view,'position-close')[0].props.label).toBe('Close');
 act(()=>{all(view,'position-close').find(node=>node.props.onPress).props.onPress({});});act(()=>{all(view,'position-back').find(node=>node.props.onPress).props.onPress({});});expect(close).toHaveBeenCalledTimes(1);expect(back).toHaveBeenCalledTimes(1);
 view=mount({onClose:close,headerAction:h(View,{testID:'share'})});expect(has(view,'share')).toBe(true);expect(has(view,'position-close')).toBe(false);
 view=mount({onClose:close},{messages:{close:'Fermer'}});expect(all(view,'position-close')[0].props.label).toBe('Fermer');
 expect(blocks.PositionBlock).toBe(PositionBlock);
});

it('reads the summary in order: live figures, host text, tones, and an unknown figure as a dash',()=>{
 let view=mount();
 expect(lines(view)).toEqual(['Notional, $400','Fee, $0.53','Liquidation, -2.5%']);
 const flows=view.findAllByType(AnimatedNumberReadout);expect(flows.map(flow=>[flow.props.value,flow.props.tone])).toEqual([[400,'text'],[0.53,'negative'],[-0.025,'negative']]);
 expect(flat(host(view,'position-details'))).toMatchObject({gap:12,marginTop:16,paddingHorizontal:20});expect(flat(host(view,'position-details')).backgroundColor).toBeUndefined();expect(flat(host(view,'position-details')).borderRadius).toBeUndefined();
 view=mount({details:[{id:'fee',label:'Fee',value:'2% of profit',tone:'muted'},{label:'Bust',value:{value:null},tone:'positive'},{label:'Size',value:{value:10,prefix:'~',suffix:' USDC'}}],note:'Minimum $10 margin.'});
 expect(lines(view)).toEqual(['Fee, 2% of profit','Bust, —','Size, ~10 USDC']);expect(has(view,'position-detail-fee')).toBe(true);
 const words=host(view,'position-detail-fee').findAll(node=>node.type==='Text'&&node.props.children==='2% of profit')[0];expect(flat(words).color).toBe(nativeSrgb.muted);
 expect(view.findAllByType(AnimatedNumberReadout)).toHaveLength(2);expect(text(host(view,'position-note'))).toBe('Minimum $10 margin.');
 view=mount({details:[]});expect(has(view,'position-details')).toBe(false);expect(has(view,'position-note')).toBe(false);expect(has(view,'position-groups')).toBe(false);
});

it('draws each group as one list of rows that report a press, with values, static rows and disabled rows',()=>{
 const size=jest.fn(),stop=jest.fn(),positions=jest.fn();
 const view=mount({groups:[[{id:'size',label:'Size',value:'$10',onSelect:size},{id:'leverage',label:'Leverage',value:'40×'},{id:'stop',label:'Stop Loss',onSelect:stop,disabled:true}],[],[{id:'positions',label:'Positions',value:'2',onSelect:positions}]]});
 // The empty group is not drawn.
 expect(view.findAllByType(ListGroup).map(group=>group.findAllByType(ListRow).map(row=>[row.props.label,row.props.value]))).toEqual([[['Size','$10'],['Leverage','40×'],['Stop Loss',undefined]],[['Positions','2']]]);
 expect(flat(host(view,'position-groups'))).toMatchObject({gap:24,marginTop:16});
 const press=id=>{const row=all(view,`position-row-${id}`).find(node=>typeof node.type!=='string'&&'onPress' in node.props);if(row&&!row.props.disabled)act(()=>{row.props.onPress({});});return row;};
 press('size');press('positions');expect(size).toHaveBeenCalledTimes(1);expect(positions).toHaveBeenCalledTimes(1);
 expect(press('stop').props.disabled).toBe(true);expect(stop).not.toHaveBeenCalled();expect(press('leverage')).toBeUndefined();
 expect(has(view,'position-row-size-chevron')).toBe(true);expect(has(view,'position-row-leverage-chevron')).toBe(false);
});

it('adds the paper trading switch as a row of its own above the settings and reports the change',()=>{
 expect(has(mount({groups:[[{id:'size',label:'Size'}]]}),'position-paper-trade')).toBe(false);
 const change=jest.fn();let view=mount({paperTrade:{label:'Paper trade',checked:false,onCheckedChange:change},groups:[[{id:'size',label:'Size',value:'$10',onSelect:()=>{}}]]});
 const flag=()=>host(view,'position-paper-trade');
 expect(flag().props.accessibilityRole).toBe('switch');expect(flag().props.accessibilityLabel).toBe('Paper trade');expect(flag().props.accessibilityState).toMatchObject({checked:false,disabled:false});
 expect(flat(flag())).toMatchObject({minHeight:56,paddingHorizontal:20,borderRadius:20,backgroundColor:nativeSrgb.surface,opacity:1});
 expect(flat(host(view,'position-paper-trade-track'))).toMatchObject({width:40,height:24,backgroundColor:nativeSrgb.nested,alignItems:'flex-start'});
 // The switch comes before the first group.
 const order=host(view,'position-groups').children.map(child=>child.props.testID);expect(order[0]).toBe('position-paper-trade');expect(order).toHaveLength(2);
 act(()=>{all(view,'position-paper-trade').find(node=>'onPress' in node.props).props.onPress({});});expect(change).toHaveBeenCalledWith(true);
 view=mount({paperTrade:{label:'Paper trade',checked:true,onCheckedChange:change,disabled:true}});
 expect(flag().props.accessibilityState).toMatchObject({checked:true,disabled:true});expect(flat(flag()).opacity).toBe(0.5);
 expect(flat(host(view,'position-paper-trade-track'))).toMatchObject({backgroundColor:nativeSrgb.action,alignItems:'flex-end'});
});

it('strikes a waived value through, reads the host word after it, and keeps a label accessory reachable',()=>{
 const explain=jest.fn();
 const view=mount({details:[{id:'fee',label:'Fee',value:{value:0.53,options:usd},tone:'muted',struck:'Waived'},{id:'genesis',label:'Builder fee',value:'2.5 bps',labelAccessory:h(View,{testID:'genesis-badge',accessible:true,accessibilityRole:'button',onPress:explain})},{id:'plain',label:'Notional',value:'$400'}]});
 expect(host(view,'position-detail-fee').props.accessibilityLabel).toBe('Fee, $0.53, Waived');
 const line=host(view,'position-detail-fee-struck').children.find(child=>child.props.pointerEvents==='none');expect(flat(line)).toMatchObject({position:'absolute',top:'50%',height:1,backgroundColor:nativeSrgb.muted});
 expect(host(view,'position-detail-fee-struck').findAllByType(AnimatedNumberReadout)).toHaveLength(1);
 // With an accessory the line is not one element: the label reads the line, and the accessory is its own element after it.
 expect(host(view,'position-detail-genesis').props.accessible).toBeUndefined();expect(host(view,'position-detail-genesis-label').props.accessibilityLabel).toBe('Builder fee, 2.5 bps');expect(has(view,'genesis-badge')).toBe(true);
 expect(has(view,'position-detail-plain-struck')).toBe(false);expect(host(view,'position-detail-plain').props.accessibilityLabel).toBe('Notional, $400');
});

it('draws an action on the paper trading row card, under the switch',()=>{
 const change=jest.fn(),harvest=jest.fn();
 let view=mount({paperTrade:{label:'Farming',checked:true,onCheckedChange:change,action:{label:'Harvest',onSelect:harvest}}});
 const card=host(view,'position-paper-trade-card');expect(flat(card)).toMatchObject({borderRadius:20,backgroundColor:nativeSrgb.surface});
 expect(host(view,'position-groups').children[0].props.testID).toBe('position-paper-trade-card');expect(card.findAll(node=>node.props.testID==='position-paper-trade').length).toBeGreaterThan(0);
 const {Button}=require('../../packages/hig/native/src/button');const action=view.findAllByType(Button).find(node=>node.props.testID==='position-paper-trade-action');
 expect([action.props.intent,action.props.children,action.props.fullWidth]).toEqual(['primary','Harvest',true]);act(()=>{action.props.onPress({});});expect(harvest).toHaveBeenCalledTimes(1);expect(change).not.toHaveBeenCalled();
 view=mount({paperTrade:{label:'Farming',checked:true,onCheckedChange:change,action:{label:'Confirm',onSelect:harvest,intent:'destructive',busy:true}}});
 const busy=view.findAllByType(Button).find(node=>node.props.testID==='position-paper-trade-action');expect([busy.props.intent,busy.props.busy]).toEqual(['destructive',true]);
});

it('takes switch rows and live figures inside the groups',()=>{
 const change=jest.fn();
 const view=mount({groups:[[{id:'size',label:'Size',value:{value:10,options:usd},onSelect:()=>{}},{id:'reduce',label:'Reduce only',value:'Off',checked:false,onCheckedChange:change}]]});
 const size=all(view,'position-row-size').find(node=>typeof node.type!=='string'&&'onPress' in node.props);expect(size.props.accessibilityLabel).toBe('Size, $10.00');
 expect(view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='position-row-size-value').props.value).toBe(10);
 const toggle=host(view,'position-row-reduce');expect(toggle.props.accessibilityRole).toBe('switch');expect(toggle.props.accessibilityLabel).toBe('Reduce only');expect(toggle.props.accessibilityHint).toBe('Off');expect(toggle.props.accessibilityState).toMatchObject({checked:false});
 expect(flat(toggle)).toMatchObject({minHeight:56,paddingHorizontal:20,backgroundColor:nativeSrgb.surface});
 act(()=>{all(view,'position-row-reduce').find(node=>'onPress' in node.props).props.onPress({});});expect(change).toHaveBeenCalledWith(true);
});

it('splits the header out for a host scroller that pins it, stacking exactly as the whole block',()=>{
 const {PositionBlockHeader}=require('../../packages/hig/native/src/position-block');
 expect(blocks.PositionBlockHeader).toBe(PositionBlockHeader);
 let view=mount({header:false,onClose:()=>{}});expect(has(view,'position-header')).toBe(false);expect(flat(view.findAll(node=>typeof node.type==='string')[0])).toMatchObject({padding:16,paddingTop:0});
 const close=jest.fn();act(()=>{root.update(h(HIGProvider,{reducedMotion:true},h(PositionBlockHeader,{title:'Position',onClose:close,headingId:'position-heading',testID:'pinned',style:{backgroundColor:'#000'}})));});
 view=root.root;expect(flat(host(view,'pinned'))).toMatchObject({paddingTop:16,paddingHorizontal:16,backgroundColor:'#000'});expect(text(host(view,'position-title'))).toBe('Position');expect(host(view,'position-title').props.nativeID).toBe('position-heading');
 act(()=>{all(view,'position-close').find(node=>node.props.onPress).props.onPress({});});expect(close).toHaveBeenCalledTimes(1);
 view=mount({headingId:'whole'});expect(host(view,'position-title').props.nativeID).toBe('whole');expect(flat(view.findAll(node=>typeof node.type==='string')[0])).toEqual({padding:16});
});
