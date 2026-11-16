/** Native RewardBlock: header, the promotion (prize pool or sweepstakes), the standings choice, the viewer's row, then the ranked rows. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {RewardBlock,rewardProgress}=require('../../packages/hig/native/src/reward-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
const entries=[{id:'a',rank:1,name:'0x4e79…949f',verified:true,detail:'$1,789,061 vol',score:795407},{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450,you:true},{id:'c',rank:3,name:'Zed',score:null}];
const pool={eyebrow:'Season 01',amount:4037,goal:250000,caption:goal=>`of ${goal} prize pool`,headline:'Top 100 traders split the pool.',description:'Funded by builder fees on every trade.'};
const base={title:'Leaderboard',entries};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(RewardBlock,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const button=(view,id)=>view.findAll(node=>node.props.testID===id&&'onPress' in node.props)[0];
const readings=view=>host(view,'reward-rows').children.map(row=>row.props.accessibilityLabel);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('measures the share of the goal reached, clamped, and unknown without a usable amount or goal',()=>{
 expect(rewardProgress(4037,250000)).toBeCloseTo(0.016148,6);expect(rewardProgress(300,200)).toBe(1);expect(rewardProgress(-5,200)).toBe(0);
 for(const [amount,goal] of [[null,200],[10,undefined],[10,0],[Number.NaN,200]])expect(rewardProgress(amount,goal)).toBeNull();
});

it('shows the host title as the heading, Back only with onBack, and the ranked rows in order',()=>{
 let view=mount();
 expect(text(host(view,'reward-title'))).toBe('Leaderboard');expect(host(view,'reward-title').props.accessibilityRole).toBe('header');expect(has(view,'reward-back')).toBe(false);
 expect(readings(view)).toEqual(['1, 0x4e79…949f, $1,789,061 vol, 795,407','2, you, $1,090,779 vol, 418,450','3, Zed, —']);
 expect(flat(host(view,'reward-rows'))).toMatchObject({gap:2,borderRadius:20,overflow:'hidden'});expect(flat(host(view,'reward-row-a'))).toMatchObject({minHeight:64,paddingHorizontal:20,backgroundColor:nativeSrgb.surface});
 // The viewer's row takes the action colour for the name and the positive tone for the score; others stay text.
 expect(flat(host(view,'reward-row-me-name')).color).toBe(nativeSrgb.action);expect(flat(host(view,'reward-row-a-name')).color).toBe(nativeSrgb.text);
 const score=id=>view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID===`reward-row-${id}-score`).props;
 expect(score('me')).toMatchObject({value:418450,tone:'positive'});expect(score('a').tone).toBe('text');expect(score('c').value).toBeNull();
 // Without artwork the avatar shows the first letters; nothing else is drawn without its props.
 expect(host(view,'reward-row-c').findAll(node=>node.type==='Text'&&node.props.children==='Ze')).toHaveLength(1);
 for(const id of ['reward-promo','reward-you','reward-tabs','reward-list-title','reward-footnote'])expect(has(view,id)).toBe(false);
 const back=jest.fn();view=mount({onBack:back,headerAction:h(View,{testID:'share'})});expect(has(view,'share')).toBe(true);
 act(()=>{all(view,'reward-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 expect(blocks.RewardBlock).toBe(RewardBlock);expect(blocks.rewardProgress).toBe(rewardProgress);
});

it('draws a prize pool: a muted eyebrow, one large figure, the goal in the caption under it, and a thin bar at the share reached',()=>{
 let view=mount({promo:pool});
 expect(text(host(view,'reward-eyebrow'))).toBe('Season 01');expect(flat(host(view,'reward-eyebrow'))).toMatchObject({textTransform:'uppercase',color:nativeSrgb.muted});
 expect(host(view,'reward-amount').props.accessibilityLabel).toBe('$4,037 of $250,000 prize pool');expect(text(host(view,'reward-caption'))).toBe('of $250,000 prize pool');
 const figure=host(view,'reward-amount').findAllByType(AnimatedNumberReadout)[0];expect(figure.props).toMatchObject({value:4037,tone:'positive',options:{style:'currency',currency:'USD',maximumFractionDigits:0}});// The same size as the SwapPanel and TargetBlock headline figures.
 expect(flat(figure)).toMatchObject({fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9});
 expect(flat(host(view,'reward-track'))).toMatchObject({height:4,borderRadius:2});expect(parseFloat(flat(host(view,'reward-fill')).width)).toBeCloseTo(1.6148,3);expect(flat(host(view,'reward-fill')).backgroundColor).toBe(nativeSrgb.action);expect(host(view,'reward-track').props.importantForAccessibility).toBe('no-hide-descendants');
 // One paragraph: the headline in the text colour, the description continuing it in the muted colour.
 const summary=host(view,'reward-summary');expect(text(summary)).toBe('Top 100 traders split the pool. Funded by builder fees on every trade.');expect(flat(summary).color).toBe(nativeSrgb.muted);
 expect(summary.findAll(node=>node.type==='Text'&&flat(node).color===nativeSrgb.text).map(text)).toEqual(['Top 100 traders split the pool.']);
 // Nothing sits under the bar, and there is no rules link or action without their props.
 for(const id of ['reward-progress','reward-updated','reward-headline','reward-description','reward-rules'])expect(has(view,id)).toBe(false);expect(button(view,'reward-action')).toBeUndefined();
 // Over the goal the bar is full; an unknown amount reads as a dash and an empty bar; the host formats the money.
 view=mount({promo:{...pool,amount:300000}});expect(flat(host(view,'reward-fill')).width).toBe('100%');
 view=mount({promo:{...pool,amount:null,amountOptions:{style:'currency',currency:'EUR',maximumFractionDigits:0}}});
 expect(host(view,'reward-amount').props.accessibilityLabel).toBe('— of €250,000 prize pool');expect(flat(host(view,'reward-fill')).width).toBe('0%');
 view=mount({promo:{eyebrow:'Pool',amount:10,goal:100,description:'Funded by fees.'}});expect(text(host(view,'reward-summary'))).toBe('Funded by fees.');expect(has(view,'reward-caption')).toBe(false);
 view=mount({promo:{eyebrow:'Pool',amount:10,goal:100}});expect(has(view,'reward-summary')).toBe(false);expect(has(view,'reward-track')).toBe(true);
});

it('draws a sweepstakes: a caption under the figure, no bar, and the rules link and action report presses',()=>{
 const rules=jest.fn(),action=jest.fn();
 const view=mount({promo:{eyebrow:'Sweepstakes',rules:{label:'Rules',onSelect:rules},amount:100000,caption:'top prize',action:{label:'Draws and winners',onSelect:action}}});
 expect(host(view,'reward-amount').props.accessibilityLabel).toBe('$100,000 top prize');expect(has(view,'reward-track')).toBe(false);
 // The rules control is a text link with a chevron, not a filled button.
 const link=host(view,'reward-rules');expect(link.props.accessibilityRole).toBe('button');expect(text(link.findAll(node=>node.type==='Text')[0])).toBe('Rules');expect(view.findAllByType(Button).some(node=>node.props.testID==='reward-rules')).toBe(false);
 expect(button(view,'reward-action').props).toMatchObject({accessibilityRole:'button',accessibilityLabel:'Draws and winners'});
 act(()=>{all(view,'reward-rules').find(node=>'onPress' in node.props).props.onPress({});});act(()=>{button(view,'reward-action').props.onPress({});});expect(rules).toHaveBeenCalledTimes(1);expect(action).toHaveBeenCalledTimes(1);
});

it('pins the viewer on a tinted row above the list, with column headings, a standings choice and a footnote',()=>{
 const change=jest.fn();
 const view=mount({you:{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450},listTitle:'Top 25 by volume',scoreTitle:'Entries',footnote:'Entries are provisional until audited.',tabs:{label:'Standings',options:[{value:'upcoming',label:'Upcoming draw'},{value:'winners',label:'Top winners'}],value:'upcoming',onValueChange:change}});
 const you=host(view,'reward-you');expect(you.props.accessibilityLabel).toBe('2, you, $1,090,779 vol, 418,450');
 expect(flat(you)).toMatchObject({marginTop:16,borderRadius:20});expect(flat(you).backgroundColor).not.toBe(nativeSrgb.surface);expect(flat(host(view,'reward-you-name')).color).toBe(nativeSrgb.action);
 expect(text(host(view,'reward-list-title'))).toBe('Top 25 by volume');expect(text(host(view,'reward-score-title'))).toBe('Entries');expect(text(host(view,'reward-footnote'))).toBe('Entries are provisional until audited.');
 const control=view.findByType(SegmentedControl);expect(control.props).toMatchObject({label:'Standings',value:'upcoming'});act(()=>{control.props.onValueChange('winners');});expect(change).toHaveBeenCalledWith('winners');
});

it('marks verified traders, read out only when the host names the mark, and formats scores as the host asks',()=>{
 let view=mount({verifiedLabel:'Verified',scoreOptions:{notation:'compact',maximumFractionDigits:1}});
 expect(readings(view)).toEqual(['1, 0x4e79…949f, Verified, $1,789,061 vol, 795.4K','2, you, $1,090,779 vol, 418.5K','3, Zed, —']);
 expect(has(view,'reward-row-a-verified')).toBe(true);expect(has(view,'reward-row-me-verified')).toBe(false);
 view=mount();expect(readings(view)[0]).toBe('1, 0x4e79…949f, $1,789,061 vol, 795,407');expect(has(view,'reward-row-a-verified')).toBe(true);
 view=mount({entries:[{id:'a',rank:1,name:'Ada',avatar:h(View,{testID:'ada-art'}),score:1}]});expect(has(view,'ada-art')).toBe(true);
});
describe('host slots (Unreleased)',()=>{
 const {ScrollView,Text}=require('react-native');
 it('names the pinned row, draws a status line between it and the list, live details and per-entry score formats',()=>{
  const prizes=[{id:'w1',rank:1,name:'Ada',score:1000},{id:'w2',rank:2,name:'Bo',score:12.5,scoreOptions:{style:'currency',currency:'USD'},detail:{value:1090779,options:{maximumFractionDigits:0},suffix:' vol'}}];
  const view=mount({testID:'board',entries:prizes,scoreOptions:{style:'currency',currency:'USD',maximumFractionDigits:0},you:{id:'me',rank:9,name:'you',score:3},youLabel:'Your rank',status:"You're not ranked yet"});
  // The block's testID prefixes every test ID inside it.
  expect(host(view,'board-you').props.accessibilityLabel).toBe('Your rank, 9, you, $3');
  expect(host(view,'board-rows').children.map(row=>row.props.accessibilityLabel)).toEqual(['1, Ada, $1,000','2, Bo, 1,090,779 vol, $12.50']);
  const detail=view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID==='board-row-w2-detail');expect(detail.props).toMatchObject({value:1090779,suffix:' vol',tone:'muted'});
  const status=host(view,'board-status');expect(text(status)).toBe("You're not ranked yet");expect(status.props.accessibilityLiveRegion).toBe('polite');
  const ids=host(view,'board').children.map(child=>child.props.testID);expect(ids.indexOf('board-you')).toBeLessThan(ids.indexOf('board-status'));expect(ids.indexOf('board-status')).toBeLessThan(ids.indexOf('board-list'));
  expect(has(view,'reward-you')).toBe(false);expect(has(view,'board-header')).toBe(true);expect(has(view,'board-title')).toBe(true);
 });
 it('shows skeleton rows while loading, pagination under the list and a host verified mark',()=>{
  const previous=jest.fn(),next=jest.fn();
  let view=mount({loading:true});const busy=host(view,'reward-loading');expect(busy.props.accessibilityState).toEqual({busy:true});expect(busy.children).toHaveLength(5);expect(has(view,'reward-rows')).toBe(false);
  view=mount({loading:true,loadingLabel:'Loading standings'});expect(host(view,'reward-loading').props).toMatchObject({accessible:true,accessibilityLabel:'Loading standings'});
  view=mount({testID:'board',verifiedMark:h(View,{testID:'genesis'}),pagination:{previous:{label:'Previous',onSelect:previous,disabled:true},next:{label:'Next',onSelect:next},label:'1–25'},footnote:'Updates every 15 minutes'});
  expect(has(view,'genesis')).toBe(true);
  expect(host(view,'board').children.map(child=>child.props.testID).slice(-3)).toEqual(['board-list','board-pagination','board-footnote']);
  expect(text(host(view,'board-page'))).toBe('1–25');
  const buttons=view.findAllByType(Button);expect(buttons.find(b=>b.props.testID==='board-previous').props.disabled).toBe(true);
  act(()=>{buttons.find(b=>b.props.testID==='board-next').props.onPress();});expect(next).toHaveBeenCalledTimes(1);expect(previous).not.toHaveBeenCalled();
 });
 it('pins the header in its own scroll view with stickyHeader: transparent at rest, filled once rows scroll under it',()=>{
  let view=mount({stickyHeader:true,testID:'board'});
  const scroll=view.findByType(ScrollView);expect(scroll.props.stickyHeaderIndices).toEqual([0]);expect(scroll.props.testID).toBe('board');
  expect(flat(host(view,'board-sticky-header')).backgroundColor).toBe('transparent');
  act(()=>{scroll.props.onScroll({nativeEvent:{contentOffset:{y:24}}});});expect(flat(host(view,'board-sticky-header')).backgroundColor).toBe(nativeSrgb.background);
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:0}}});});expect(flat(host(view,'board-sticky-header')).backgroundColor).toBe('transparent');
  function HostScroll(props){return h(ScrollView,{...props,testID:'host-scroll'});}
  view=mount({stickyHeader:true,stickyHeaderBackground:'#101010',scrollComponent:HostScroll});
  expect(has(view,'host-scroll')).toBe(true);
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:8}}});});expect(flat(host(view,'reward-sticky-header')).backgroundColor).toBe('#101010');
  view=mount();expect(view.findAllByType(ScrollView)).toHaveLength(0);
 });
 it('leaves the header out with header={false} (Unreleased)',()=>{
  const view=mount({header:false,testID:'board',onBack:()=>{}});
  expect(has(view,'board-header')).toBe(false);expect(has(view,'board-back')).toBe(false);expect(flat(host(view,'board'))).toMatchObject({padding:16,paddingTop:0});
 });
 it('keeps an interactive host verified mark in the accessibility tree, with the row read on the name (Unreleased)',()=>{
  // Without verifiedMarkInteractive the mark is artwork inside the row's one element, as before.
  const art=mount({verifiedLabel:'Genesis',verifiedMark:h(View,{testID:'genesis'}),entries:[{id:'a',rank:1,name:'Ada',verified:true,score:5}]});
  expect(host(art,'reward-row-a').props).toMatchObject({accessible:true,accessibilityLabel:'1, Ada, Genesis, 5'});
  const view=mount({verifiedLabel:'Genesis',verifiedMarkInteractive:true,verifiedMark:h(View,{testID:'genesis',accessible:true,accessibilityRole:'button',accessibilityLabel:'Genesis badge'}),entries:[{id:'a',rank:1,name:'Ada',verified:true,score:5}]});
  const row=host(view,'reward-row-a');expect(row.props.accessible).toBe(false);expect(row.props.accessibilityLabel).toBeUndefined();
  expect(host(view,'reward-row-a-name').props).toMatchObject({accessible:true,accessibilityLabel:'1, Ada, Genesis, 5'});
  const hiddenAncestor=node=>{for(let current=node;current;current=current.parent)if(current.props?.accessibilityElementsHidden)return true;return false;};
  expect(hiddenAncestor(host(view,'genesis'))).toBe(false);
 });
 it('animates a host-formatted detail (Unreleased)',()=>{
  const view=mount({entries:[{id:'a',rank:1,name:'Ada',detail:{value:1090779,formattedValue:'1.090.779',suffix:' vol'},score:5}]});
  expect(host(view,'reward-rows').children[0].props.accessibilityLabel).toBe('1, Ada, 1.090.779 vol, 5');
  const flow=view.findAllByType(AnimatedNumberReadout).find(node=>node.props.testID==='reward-row-a-detail');expect(flow.props).toMatchObject({formattedValue:'1.090.779',animateFormatted:true});
 });
 it('accepts host elements in the headline',()=>{
  const view=mount({promo:{...pool,headline:h(Text,{testID:'accent'},'Top 100')}});expect(has(view,'accent')).toBe(true);
 });
});
