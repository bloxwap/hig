/** Native TargetCard: header, the target as the headline figure, the price card, the unit, the custom row, the quick choices, then the actions. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {TargetCard,targetLayout,targetFormat}=require('../../packages/hig/native/src/target-card');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
// The host owns every trading word.
const labels={title:'Take Profit',submit:'Set Take Profit',entry:'Entry',mark:'Mark',trigger:'If triggered',unit:'Target in',units:{dollar:'Dollar',price:'Price',percent:'Percent'},custom:'Custom'};
const base={kind:'take-profit',labels,entry:64700,mark:64500,trigger:65000,unit:'dollar',value:2,onSubmit:()=>{}};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(TargetCard,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
const amount=view=>view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='target-amount');
const prices=view=>['target-entry','target-mark','target-trigger'].filter(id=>has(view,id));
const order=view=>view.findAll(node=>typeof node.type==='string'&&/^target-(entry|mark|trigger)$/.test(String(node.props.testID))).map(node=>node.props.accessibilityLabel);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('places the known prices on one axis and spans the stretch from the mark, or entry, to the trigger',()=>{
 expect(targetLayout({entry:100,mark:90,trigger:140})).toEqual({positions:{entry:0.2,mark:0,trigger:1},order:['mark','entry','trigger'],from:0,to:1});
 expect(targetLayout({entry:100,mark:120,trigger:80})).toEqual({positions:{entry:0.5,mark:1,trigger:0},order:['trigger','entry','mark'],from:0,to:1});
 expect(targetLayout({entry:100,mark:110,trigger:140})).toMatchObject({from:0.25,to:1});
 expect(targetLayout({entry:100,trigger:140})).toEqual({positions:{entry:0,trigger:1},order:['entry','trigger'],from:0,to:1});
 expect(targetLayout({entry:100,mark:90,trigger:null})).toEqual({positions:{entry:1,mark:0},order:['mark','entry'],from:0.5,to:0.5});
 expect(targetLayout({entry:100,mark:100,trigger:100}).order).toEqual(['entry','mark','trigger']);
 expect(targetLayout({entry:Number.NaN})).toEqual({positions:{},order:[],from:0.5,to:0.5});
 expect(targetFormat('dollar',undefined,10)).toMatchObject({style:'currency',signDisplay:'exceptZero',maximumFractionDigits:0});expect(targetFormat('dollar',undefined,0.5).maximumFractionDigits).toBeUndefined();
 expect(targetFormat('percent')).toMatchObject({style:'percent',signDisplay:'exceptZero'});expect(targetFormat('price',{style:'currency',currency:'EUR'})).toEqual({style:'currency',currency:'EUR'});
});

it('shows the host title as the heading, Back only with onBack, and the host action on the trailing edge',()=>{
 let view=mount();
 expect(text(host(view,'target-title'))).toBe('Take Profit');expect(host(view,'target-title').props.accessibilityRole).toBe('header');expect(has(view,'target-back')).toBe(false);
 const back=jest.fn();view=mount({onBack:back,headerAction:h(View,{testID:'share'})});
 expect(has(view,'share')).toBe(true);
 act(()=>{all(view,'target-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 expect(blocks.TargetCard).toBe(TargetCard);expect(blocks.targetLayout).toBe(targetLayout);
});

it('reads the target as the headline figure in the current unit',()=>{
 let view=mount();expect(amount(view).props).toMatchObject({value:2,options:{style:'currency',currency:'USD',signDisplay:'exceptZero'}});
 view=mount({unit:'percent',value:0.05});expect(amount(view).props.options).toMatchObject({style:'percent',signDisplay:'exceptZero'});
 view=mount({unit:'price',value:65250,trigger:undefined});expect(amount(view).props.options).toEqual({style:'currency',currency:'USD'});
 // In the price unit the target is the trigger.
 expect(host(view,'target-trigger').props.accessibilityLabel).toBe('If triggered, $65,250.00');
});

it('titles the price card with the position and order type and reads the three prices in price order',()=>{
 let view=mount({position:'BTC · Long 40×',orderType:'Take-limit',note:'Fills at your target price or better.'});
 expect(text(host(view,'target-position'))).toBe('BTC · Long 40×');expect(host(view,'target-position').props.accessibilityRole).toBe('header');expect(text(host(view,'target-order-type'))).toBe('Take-limit');
 expect(text(host(view,'target-note'))).toBe('Fills at your target price or better.');
 expect(order(view)).toEqual(['Mark, $64,500.00','Entry, $64,700.00','If triggered, $65,000.00']);
 // The stretch runs from the mark to the trigger, the trigger edge in the positive role, with entry as a tick.
 expect(flat(host(view,'target-move'))).toMatchObject({flexGrow:1,borderStartColor:nativeSrgb.text,borderEndColor:nativeSrgb.buy});expect(flat(host(view,'target-entry-tick')).start).toBe('40%');
 expect(host(view,'target-bar').props.importantForAccessibility).toBe('no-hide-descendants');
 const trigger=host(view,'target-trigger').findAllByType(AnimatedNumberReadout)[0];expect(trigger.props).toMatchObject({value:65000,tone:'positive'});
 // A stop loss under the mark leads with the trigger in the negative role.
 view=mount({kind:'stop-loss',mark:64800,trigger:64600,value:-0.5});
 expect(order(view)).toEqual(['If triggered, $64,600.00','Entry, $64,700.00','Mark, $64,800.00']);
 expect(flat(host(view,'target-move'))).toMatchObject({borderStartColor:nativeSrgb.sell,borderEndColor:nativeSrgb.text});expect(host(view,'target-trigger').findAllByType(AnimatedNumberReadout)[0].props.tone).toBe('negative');
 // Without a mark the stretch starts at entry with no separate tick; without a trigger there is no stretch; without host text there is no title row.
 view=mount({mark:null});expect(prices(view)).toEqual(['target-entry','target-trigger']);expect(has(view,'target-entry-tick')).toBe(false);expect(has(view,'target-move')).toBe(true);
 view=mount({trigger:undefined});expect(has(view,'target-move')).toBe(false);expect(prices(view)).toEqual(['target-entry','target-mark']);expect(has(view,'target-position')).toBe(false);expect(has(view,'target-note')).toBe(false);
 view=mount({priceOptions:{style:'currency',currency:'USD',maximumFractionDigits:0}});expect(order(view)[2]).toBe('If triggered, $65,000');
});

it('offers the units as one control, hidden with a single unit, and reports the choice',()=>{
 const change=jest.fn();let view=mount({onUnitChange:change});
 const control=view.findByType(SegmentedControl);expect(control.props).toMatchObject({label:'Target in',value:'dollar',options:[{value:'dollar',label:'Dollar'},{value:'price',label:'Price'},{value:'percent',label:'Percent'}]});
 act(()=>{control.props.onValueChange('percent');});expect(change).toHaveBeenCalledWith('percent');
 view=mount({units:['price','dollar']});expect(view.findByType(SegmentedControl).props.options.map(option=>option.value)).toEqual(['price','dollar']);
 view=mount({units:['dollar']});expect(view.findAllByType(SegmentedControl)).toHaveLength(0);
});

it('draws the quick choices in the unit format, selects the one equal to the target, and reports presses and the custom row',()=>{
 expect(has(mount(),'target-presets')).toBe(false);expect(has(mount(),'target-custom')).toBe(false);
 const change=jest.fn(),custom=jest.fn();let view=mount({presets:[1,2,5,10],onValueChange:change,onCustom:custom});
 const choices=()=>view.findAllByType(Button).filter(node=>String(node.props.testID).startsWith('target-preset-'));
 expect(choices().map(node=>[node.props.children,node.props.intent,node.props.accessibilityState.selected])).toEqual([['+$1','secondary',false],['+$2','primary',true],['+$5','secondary',false],['+$10','secondary',false]]);
 expect(flat(host(view,'target-presets'))).toMatchObject({flexDirection:'row',gap:8,marginTop:16});
 act(()=>{choices()[2].props.onPress({});});expect(change).toHaveBeenCalledWith(5);
 const row=host(view,'target-custom');expect(row.props.accessibilityRole).toBe('button');expect(row.findAll(node=>node.type==='Text'&&node.props.children==='Custom')).toHaveLength(1);
 act(()=>{all(view,'target-custom').find(node=>'onPress' in node.props).props.onPress({});});expect(custom).toHaveBeenCalledTimes(1);
 view=mount({kind:'stop-loss',value:-0.5,presets:[-0.5,-1,-2,-5]});expect(choices().map(node=>[node.props.children,node.props.intent])).toEqual([['-$0.50','destructive'],['-$1','secondary'],['-$2','secondary'],['-$5','secondary']]);
 view=mount({unit:'percent',value:0.1,presets:[0.05,0.1,0.25]});expect(choices().map(node=>node.props.children)).toEqual(['+5%','+10%','+25%']);
});

it('confirms in the role of its kind, with Cancel beside it only when the host handles it',()=>{
 const submit=jest.fn(),cancel=jest.fn();let view=mount({onSubmit:submit});
 expect(button(view,'target-cancel')).toBeUndefined();expect(button(view,'target-submit').props).toMatchObject({children:'Set Take Profit',intent:'primary',disabled:false});
 act(()=>{button(view,'target-submit').props.onPress({});});expect(submit).toHaveBeenCalledTimes(1);
 view=mount({kind:'stop-loss',labels:{...labels,submit:'Set Stop Loss'},onSubmit:submit,onCancel:cancel});
 expect(button(view,'target-submit').props).toMatchObject({children:'Set Stop Loss',intent:'destructive'});expect(button(view,'target-cancel').props).toMatchObject({children:'Cancel',intent:'secondary'});
 act(()=>{button(view,'target-cancel').props.onPress({});});expect(cancel).toHaveBeenCalledTimes(1);
 expect(flat(host(view,'target-actions'))).toMatchObject({flexDirection:'row',gap:8,marginTop:16});
 // An unknown target cannot be confirmed unless the host says otherwise; Cancel takes host or provider text.
 view=mount({value:null});expect(button(view,'target-submit').props.disabled).toBe(true);
 view=mount({value:null,submitDisabled:false,busy:true});expect(button(view,'target-submit').props).toMatchObject({disabled:false,busy:true});
 view=mount({onCancel:cancel},{messages:{cancel:'Annuler'}});expect(button(view,'target-cancel').props.children).toBe('Annuler');
 view=mount({onCancel:cancel,labels:{...labels,cancel:'Not now'}});expect(button(view,'target-cancel').props.children).toBe('Not now');
});
