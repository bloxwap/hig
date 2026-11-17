/** Native TokenActionBlock: header, the assets and chains bars, then the token's actions. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {TokenActionBlock,tokenActionLabel}=require('../../packages/hig/native/src/token-action-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {BarMark}=require('../../packages/hig/native/src/bar-mark');
const {Button}=require('../../packages/hig/native/src/button');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const h=React.createElement;
let root;
const assets=[{id:'staked',label:'Staked',value:300,tone:'negative'},{id:'core',label:'Core',value:259,tone:'positive'},{id:'paper',label:'Paper',value:200}];
const chains=[{id:'base',label:'Base',value:120},{id:'hl',label:'Hyperliquid',value:639},{id:'sol',label:'Solana',value:0}];
const base={symbol:'HYPE',name:'Hyperliquid',assets,chains,actions:[]};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(TokenActionBlock,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const title=view=>text(all(view,'token-title').find(node=>typeof node.type==='string'));
const bars=view=>view.findAllByType(BarMark);
const total=view=>bars(view)[0].findAllByType(AnimatedNumberReadout)[0];
const buttons=view=>view.findAllByType(Button).filter(button=>String(button.props.testID).startsWith('token-action-'));
const label=button=>text(button.findAll(node=>typeof node.type==='string'&&node.props.testID===button.props.testID)[0]??button);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('shows the header: the symbol as the heading, Back only with onBack, and the host action on the trailing edge',()=>{
 let view=mount();
 expect(title(view)).toBe('HYPE');expect(all(view,'token-title')[0].props.accessibilityRole).toBe('header');expect(has(view,'token-back')).toBe(false);
 const back=jest.fn();view=mount({onBack:back,headerAction:h(View,{testID:'share'})});
 expect(has(view,'share')).toBe(true);const button=all(view,'token-back')[0];expect(button.props.label??button.props.accessibilityLabel).toBe('Back');
 act(()=>{all(view,'token-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
});
it('draws the assets bar under the token name with the total, from the prop, the sum, or unknown',()=>{
 let view=mount();
 expect(bars(view).map(bar=>bar.props.testID)).toEqual(['token-assets','token-chains']);expect(bars(view)[0].props).toMatchObject({title:'Hyperliquid',elements:assets});expect(bars(view)[0].props.size).toBeUndefined();
 expect(total(view).props).toMatchObject({value:759,options:{style:'currency',currency:'USD'},tone:'muted',testID:'token-value'});
 view=mount({value:1000});expect(total(view).props.value).toBe(1000);
 view=mount({value:null});expect(total(view).props.value).toBeNull();
 // Bad values count as nothing, as they do in the bar.
 view=mount({assets:[{label:'A',value:5},{label:'B',value:-3},{label:'C',value:Number.NaN}]});expect(total(view).props.value).toBe(5);
});
it('draws a chains bar the same size as the assets bar, titled Chains with the number of chains that hold the token',()=>{
 let view=mount();
 expect(bars(view)[1].props).toMatchObject({title:'Chains',elements:chains,description:'2'});expect(bars(view)[1].props.size).toBeUndefined();
 for(const singleOrEmpty of [[chains[0]],[]]){view=mount({chains:singleOrEmpty});expect(bars(view).map(bar=>bar.props.testID)).toEqual(['token-assets']);}
 view=mount({},{messages:{swapChains:'Chaînes'}});expect(bars(view)[1].props.title).toBe('Chaînes');
});
it('names the built-in actions, takes a host label, and falls back to the id',()=>{
 expect(['send','receive','stake','unstake'].map(id=>tokenActionLabel({id,onSelect(){}},{}))).toEqual(['Send','Receive','Stake','Unstake']);
 expect(tokenActionLabel({id:'send',label:'Transfer',onSelect(){}},{})).toBe('Transfer');expect(tokenActionLabel({id:'burn',onSelect(){}},{})).toBe('burn');
 expect(tokenActionLabel({id:'stake',onSelect(){}},{stake:'Staker'})).toBe('Staker');
 const noop=()=>{},actions=[{id:'send',onSelect:noop},{id:'receive',onSelect:noop},{id:'stake',onSelect:noop},{id:'unstake',onSelect:noop},{id:'burn',label:'Burn',onSelect:noop}];
 let view=mount({actions});
 expect(buttons(view).map(button=>button.props.testID)).toEqual(['token-action-send','token-action-receive','token-action-stake','token-action-unstake','token-action-burn']);
 expect(buttons(view).map(button=>button.props.children)).toEqual(['Send','Receive','Stake','Unstake','Burn']);
 view=mount({actions},{messages:{swapActionSend:'Envoyer',receive:'Recevoir',stake:'Staker',unstake:'Retirer'}});
 expect(buttons(view).map(button=>button.props.children)).toEqual(['Envoyer','Recevoir','Staker','Retirer','Burn']);
});
it('stacks full-width secondary actions that call the host, honours intent and disabled, and omits an empty block',()=>{
 const send=jest.fn(),stake=jest.fn(),burn=jest.fn();
 let view=mount({actions:[{id:'send',onSelect:send},{id:'stake',onSelect:stake,disabled:true},{id:'burn',label:'Burn',onSelect:burn,intent:'destructive'},{id:'buy',label:'Buy',onSelect(){},intent:'primary'}]});
 expect(buttons(view).map(button=>[button.props.intent,button.props.fullWidth,!!button.props.disabled])).toEqual([['secondary',true,false],['secondary',true,true],['destructive',true,false],['primary',true,false]]);
 act(()=>{buttons(view)[0].props.onPress({});});expect(send).toHaveBeenCalledTimes(1);
 const disabled=view.findAll(node=>node.props.testID==='token-action-stake'&&typeof node.type==='string')[0];
 expect(disabled.props.accessibilityState?.disabled??disabled.props.disabled).toBe(true);if(disabled.props.onPress)act(()=>{disabled.props.onPress({});});if(disabled.props.onClick)act(()=>{disabled.props.onClick({});});expect(stake).not.toHaveBeenCalled();
 expect(has(view,'token-actions')).toBe(true);view=mount();expect(has(view,'token-actions')).toBe(false);
 expect(blocks.TokenActionBlock).toBe(TokenActionBlock);expect(blocks.tokenActionLabel).toBe(tokenActionLabel);
});

it('draws both bars without a card, further apart than cards would be',()=>{
 const view=mount();
 expect(bars(view).map(bar=>[bar.props.testID,bar.props.surface])).toEqual([['token-assets',false],['token-chains',false]]);
 const group=all(view,'token-bars').find(node=>typeof node.type==='string');expect(Object.assign({},...[].concat(group.props.style).flat(Infinity).filter(Boolean))).toMatchObject({gap:20,marginTop:16,paddingHorizontal:4});
});
const styleOf=node=>Object.assign({},...[].concat(node.props.style).flat(Infinity).filter(Boolean));
it('draws a note under the actions, 8 below them, tinted by noteTone',()=>{
 const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
 const actions=[{id:'send',onSelect(){}}];
 let view=mount({actions,note:'View-only account'});
 const note=()=>all(view,'token-note').find(node=>typeof node.type==='string');
 expect(text(note())).toBe('View-only account');expect(styleOf(note())).toMatchObject({marginTop:8,paddingHorizontal:4});
 const children=note().parent.children.map(child=>child.props?.testID);expect(children.indexOf('token-note')).toBe(children.indexOf('token-actions')+1);
 view=mount({note:'View-only account',noteTone:'warning'});expect(styleOf(note())).toMatchObject({marginTop:16,borderRadius:16});expect(styleOf(note().findAll(node=>node.type==='Text')[0]).color).toBe(colors.warning);
 view=mount({actions});expect(has(view,'token-note')).toBe(false);
});
it('draws actions only without bars, or one bar without the other',()=>{
 let view=mount({assets:undefined,chains:undefined,name:undefined,actions:[{id:'send',onSelect(){}}]});
 expect(has(view,'token-bars')).toBe(false);expect(bars(view)).toHaveLength(0);expect(buttons(view)).toHaveLength(1);
 view=mount({assets:undefined});expect(bars(view).map(bar=>bar.props.testID)).toEqual(['token-chains']);
 view=mount({chains:undefined,name:undefined});expect(bars(view).map(bar=>[bar.props.testID,bar.props.title])).toEqual([['token-assets','HYPE']]);
});
it('moves live legend figures place by place inside the block',()=>{
 const view=mount({assets:[{id:'staked',label:'Staked',value:320,detail:{value:320,options:{style:'currency',currency:'USD'}}},{id:'core',label:'Core',value:239,detail:'$239'}]});
 const figure=view.findAllByType(AnimatedNumberReadout).find(node=>node.props.testID==='token-assets-detail-staked');expect(figure.props).toMatchObject({value:320,tone:'faint'});
 expect(all(view,'token-assets-legend-staked').find(node=>typeof node.type==='string').props.accessibilityLabel).toBe('Staked, $320.00, 57.2%');
});
