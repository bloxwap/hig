/** Native RewardBlock: header, the promotion (prize pool or sweepstakes), the standings choice, the viewer's row, then the ranked rows. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {RewardBlock,rewardProgress}=require('../../packages/hig/native/src/reward-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {NumberFlow}=require('../../packages/hig/native/src/animated-number');
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
const readings=(view,prefix='reward')=>host(view,`${prefix}-rows`).findAll(node=>typeof node.type==='string'&&node.props.testID?.startsWith(`${prefix}-row-`)&&node.props.accessible===true).map(row=>row.props.accessibilityLabel);
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
 // Names and scores use the same text colour for every standing.
 expect(flat(host(view,'reward-row-me-name')).color).toBe(nativeSrgb.text);expect(flat(host(view,'reward-row-a-name')).color).toBe(nativeSrgb.text);
 const score=id=>view.findAllByType(NumberFlow).find(flow=>flow.props.testID===`reward-row-${id}-score`).props;
 expect(score('me')).toMatchObject({value:418450,tone:'text'});expect(score('a').tone).toBe('text');expect(score('c').value).toBeNull();
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
 const figure=host(view,'reward-amount').findAllByType(NumberFlow)[0];expect(figure.props).toMatchObject({value:4037,tone:'text',options:{style:'currency',currency:'USD',maximumFractionDigits:0}});// The same size as the SwapPanel and TargetBlock headline figures.
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
 expect(flat(you)).toMatchObject({marginTop:16,borderRadius:20});expect(flat(you).backgroundColor).not.toBe(nativeSrgb.surface);expect(flat(host(view,'reward-you-name')).color).toBe(nativeSrgb.text);
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
  expect(readings(view,'board')).toEqual(['1, Ada, $1,000','2, Bo, 1,090,779 vol, $12.50']);
  const detail=view.findAllByType(NumberFlow).find(flow=>flow.props.testID==='board-row-w2-detail');expect(detail.props).toMatchObject({value:1090779,suffix:' vol',tone:'muted'});
  const status=host(view,'board-status');expect(text(status)).toBe("You're not ranked yet");expect(status.props.accessibilityLiveRegion).toBe('polite');
  const ids=host(view,'board').findAll(child=>typeof child.type==='string').map(child=>child.props.testID);expect(ids.indexOf('board-you')).toBeLessThan(ids.indexOf('board-status'));expect(ids.indexOf('board-status')).toBeLessThan(ids.indexOf('board-list'));
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
  expect(host(view,'reward-row-a').props.accessibilityLabel).toBe('1, Ada, 1.090.779 vol, 5');
  const flow=view.findAllByType(NumberFlow).find(node=>node.props.testID==='reward-row-a-detail');expect(flow.props).toMatchObject({formattedValue:'1.090.779',animateFormatted:true});
 });
 it('accepts host elements in the headline',()=>{
  const view=mount({promo:{...pool,headline:h(Text,{testID:'accent'},'Top 100')}});expect(has(view,'accent')).toBe(true);
 });
});

it('draws a host-text amount read with a text caption, a node caption that reads itself, a host figure, and no list without entries',()=>{
 let view=mount({entries:undefined,promo:{eyebrow:'Sweepstakes',amount:'$500',caption:'top prize'}});
 const amount=host(view,'reward-amount');expect(amount.props.accessibilityLabel).toBe('$500 top prize');expect(view.findAllByType(NumberFlow)).toHaveLength(0);
 expect(view.findAll(node=>typeof node.type==='string'&&node.children.includes('$500')).map(node=>flat(node).color)).toContain(nativeSrgb.text);
 expect(has(view,'reward-list')).toBe(false);expect(has(view,'reward-rows')).toBe(false);
 view=mount({promo:{eyebrow:'Sweepstakes',amount:500,caption:h(View,{testID:'countdown'})}});
 expect(host(view,'reward-amount').props.accessibilityLabel).toBe('$500');
 const caption=host(view,'reward-caption');expect(caption.props.accessibilityElementsHidden).toBeUndefined();expect(has(caption,'countdown')).toBe(true);
 view=mount({promo:{eyebrow:'Pool',figure:h(View,{testID:'live'}),caption:'so far'}});
 const slot=host(view,'reward-amount');expect(slot.props.accessible).toBeUndefined();expect(has(host(view,'reward-figure'),'live')).toBe(true);expect(text(host(view,'reward-caption'))).toBe('so far');
 view=mount({promo:{eyebrow:'Soon',headline:'Draws open Monday.'}});expect(has(view,'reward-amount')).toBe(false);
});

it('rolls the drawing clock to expiry while showing the viewer’s streak multiplier',()=>{
 jest.useFakeTimers();
 try{
  const drawing={at:Date.now()+1500,label:'Prize drawing in',endedLabel:'Drawing time reached'};
  const view=mount({promo:{eyebrow:'Sweepstakes',drawing,streak:{label:'Current streak',count:{value:7,suffix:' days'},rewardLabel:'Entry multiplier',reward:{value:2,suffix:'×'}}}});
  expect(text(view)).toContain('Entry multiplier');
  const timer=()=>view.find(node=>node.type===require('../../packages/hig/native/src/animated-number').NumberFlow&&node.props.trend===-1);
  expect(timer().props.formattedValue).toBe('0:00:02');
  act(()=>jest.advanceTimersByTime(500));expect(timer().props.value).toBe(1);
  act(()=>jest.advanceTimersByTime(1000));expect(text(view)).toContain(drawing.endedLabel);
 }finally{jest.useRealTimers();}
});

it('skips all standings data while loading the list',()=>{
 const scores=jest.fn(()=>1);
 const entries=Array.from({length:10000},(_,i)=>({id:String(i),rank:i+1,name:'Trader '+i,get score(){return scores();}}));
 mount({entries,loading:true});
 expect(scores).not.toHaveBeenCalled();
});

it('windows a large sticky leaderboard with the pinned rank before the standings and pages after them',()=>{
 const {VirtualizedList}=require('react-native');
 const entries=Array.from({length:10000},(_,i)=>({id:String(i),rank:i+1,name:'Trader '+i,score:i}));
 const tree=mount({stickyHeader:true,entries,you:entries[0],promo:pool,pagination:{label:'Page 1'},listTitle:'Rank',testID:'standings'});
 const list=tree.findByType(VirtualizedList);
 expect(list.props.data).toBe(entries);
 expect(list.props.getItemCount(entries)).toBe(10001);
 expect(list.props.getItem(entries,0)).toBe(null);
 expect(list.props.getItem(entries,10000)).toBe(entries[9999]);
 expect(list.props.stickyHeaderIndices).toEqual([0]);
 expect(has(tree,'standings-promo')).toBe(true);
 expect(has(tree,'standings-you')).toBe(true);
 expect(has(tree,'standings-row-0')).toBe(true);
 expect(has(tree,'standings-row-9999')).toBe(false);
 expect(has(tree,'standings-page')).toBe(true);
 const last=list.props.renderItem({item:entries[9999],index:10000});
 expect(last.props.children.props.entry).toBe(entries[9999]);
});

it('uses the host list as the only scroller for a headerless pane, including while loading',()=>{
 const {FlatList}=require('react-native');
 const listComponent=props=>h(FlatList,props);
 const many=Array.from({length:10000},(_,i)=>({id:String(i),name:'Trader '+i,rank:i+1,score:i}));
 const props={header:false,stickyHeader:true,listComponent,entries:many,promo:pool,testID:'hosted'};
 let view=mount({...props,loading:true});
 let list=view.findByType(listComponent);
 expect(list.props.data).toEqual([null]);
 expect(list.props.ListHeaderComponent).toBeNull();
 expect(list.props.stickyHeaderIndices).toBeUndefined();
 expect(has(view,'hosted-loading')).toBe(true);
 view=mount(props);list=view.findByType(listComponent);
 expect(view.findAllByType(FlatList)).toHaveLength(1);
 expect(list.props.data.at(-1)).toBe(many.at(-1));
 expect(has(view,'hosted-row-0')).toBe(true);
 expect(has(view,'hosted-row-9999')).toBe(false);
});

it('leaves unchanged standings alone when the leaderboard status changes',()=>{
 const reads=jest.fn(()=>100);
 const entries=Array.from({length:40},(_,i)=>({id:String(i),name:'Trader',rank:i+1,get score(){return reads();}}));
 mount({entries,you:entries[0],status:'Live'});
 expect(reads).toHaveBeenCalled();
 reads.mockClear();
 act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(RewardBlock,{...base,entries,you:entries[0],status:'Updated'}))));
 expect(reads).not.toHaveBeenCalled();
});

it('reads only the changed standing when a sticky leaderboard refreshes',()=>{
 const reads=new Set();
 const makeEntry=(index,score)=>({id:String(index),name:'Trader '+index,rank:index+1,get score(){reads.add(index);return score;}});
 const entries=Array.from({length:1000},(_,i)=>makeEntry(i,i));
 const tree=mount({stickyHeader:true,entries});
 reads.clear();
 const next=entries.slice();next[2]=makeEntry(2,77);
 act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(RewardBlock,{...base,stickyHeader:true,entries:next}))));
 expect([...reads]).toEqual([2]);
 expect(host(tree,'reward-row-2').props.accessibilityLabel).toContain('77');
});

it('leaves standings untouched when the host changes its feedback handler',()=>{
 const read=jest.fn(i=>'Trader '+i);
 const rows=Array.from({length:30},(_,i)=>({id:String(i),rank:i+1,get name(){return read(i);},score:i}));
 const block=h(RewardBlock,{title:'Leaderboard',entries:rows});
 act(()=>{root=render(h(HIGProvider,{reducedMotion:true},block));});
 read.mockClear();
 act(()=>root.update(h(HIGProvider,{reducedMotion:true,onAccepted:jest.fn()},block)));
 expect(read).not.toHaveBeenCalled();
});

describe('entry action (Unreleased)',()=>{
 const place='Open your place on PrizeRail';
 const me={id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450};
 it('leaves rows without an action as plain views with the same reading',()=>{
  const view=mount({you:me,youLabel:'Your rank'});
  for(const id of ['reward-you','reward-row-a','reward-row-me','reward-row-c']){expect(button(view,id)).toBeUndefined();expect(host(view,id).props.accessibilityRole).toBeUndefined();expect(host(view,id).props.onClick).toBeUndefined();}
  expect(host(view,'reward-you').props).toMatchObject({accessible:true,accessibilityLabel:'Your rank, 2, you, $1,090,779 vol, 418,450'});
  expect(readings(view)).toEqual(['1, 0x4e79…949f, $1,789,061 vol, 795,407','2, you, $1,090,779 vol, 418,450','3, Zed, —']);
 });
 it('makes the pinned row and a list row one button each, read as the row and then the action',()=>{
  const pinned=jest.fn(),inList=jest.fn();
  const view=mount({youLabel:'Your rank',verifiedLabel:'Verified',you:{...me,verified:true,action:{label:place,onSelect:pinned}},entries:entries.map(entry=>entry.id==='me'?{...entry,action:{label:place,onSelect:inList}}:entry)});
  expect(host(view,'reward-you').props).toMatchObject({accessible:true,accessibilityRole:'button',accessibilityLabel:`Your rank, 2, you, Verified, $1,090,779 vol, 418,450, ${place}`});
  expect(host(view,'reward-row-me').props).toMatchObject({accessible:true,accessibilityRole:'button',accessibilityLabel:`2, you, $1,090,779 vol, 418,450, ${place}`});
  act(()=>button(view,'reward-you').props.onPress());expect(pinned).toHaveBeenCalledTimes(1);expect(inList).not.toHaveBeenCalled();
  act(()=>button(view,'reward-row-me').props.onPress());expect(inList).toHaveBeenCalledTimes(1);
  // The row keeps its layout and fill at rest, and presses to the fills HIG rows use.
  expect(flat(host(view,'reward-row-me'))).toMatchObject({minHeight:64,paddingHorizontal:20,backgroundColor:nativeSrgb.surface});
  expect(button(view,'reward-row-me').props.style({pressed:true}).backgroundColor).toBe(nativeSrgb.nested);
  expect(flat(host(view,'reward-you'))).toMatchObject({marginTop:16,borderRadius:20});expect(button(view,'reward-you').props.style({pressed:true}).backgroundColor).not.toBe(button(view,'reward-you').props.style({pressed:false}).backgroundColor);
  // The other rows are not controls.
  expect(button(view,'reward-row-a')).toBeUndefined();expect(host(view,'reward-row-a').props.accessibilityRole).toBeUndefined();
 });
 it('makes a row with href a link: it opens the URL, unless the host handles the press',()=>{
  const {Linking}=require('react-native');
  const open=jest.spyOn(Linking,'openURL').mockResolvedValue(undefined);
  try{
   const select=jest.fn();
   const view=mount({you:{...me,action:{label:place,href:'https://example.com/me'}},entries:[{id:'a',rank:1,name:'Ada',score:5,action:{label:'Open Ada',href:'https://example.com/ada',onSelect:select}}]});
   expect(host(view,'reward-you').props).toMatchObject({accessibilityRole:'link',accessibilityLabel:`2, you, $1,090,779 vol, 418,450, ${place}`});
   act(()=>button(view,'reward-you').props.onPress());expect(open).toHaveBeenCalledTimes(1);expect(open).toHaveBeenCalledWith('https://example.com/me');
   expect(host(view,'reward-row-a').props.accessibilityRole).toBe('link');
   act(()=>button(view,'reward-row-a').props.onPress());expect(select).toHaveBeenCalledTimes(1);expect(open).toHaveBeenCalledTimes(1);
  }finally{open.mockRestore();}
 });
 it('keeps an interactive verified mark its own element: the row takes the press and the name is the control that is read',()=>{
  const select=jest.fn();
  const view=mount({verifiedLabel:'Genesis',verifiedMarkInteractive:true,verifiedMark:h(View,{testID:'genesis',accessible:true,accessibilityRole:'button',accessibilityLabel:'Genesis badge'}),
   entries:[{id:'a',rank:1,name:'Ada',verified:true,score:5,action:{label:'Open Ada',onSelect:select}},{id:'b',rank:2,name:'Bo',score:4,action:{label:'Open Bo',onSelect:select}}]});
  // The row is not one accessible element, so the mark is not swallowed by it.
  const row=host(view,'reward-row-a');expect(row.props.accessible).toBe(false);expect(row.props.accessibilityLabel).toBeUndefined();expect(row.props.accessibilityRole).toBeUndefined();
  const name=button(view,'reward-row-a-name');expect(name.props).toMatchObject({accessible:true,accessibilityRole:'button',accessibilityLabel:'1, Ada, Genesis, 5, Open Ada'});
  const hiddenAncestor=node=>{for(let current=node;current;current=current.parent)if(current.props?.accessibilityElementsHidden)return true;return false;};
  expect(hiddenAncestor(host(view,'genesis'))).toBe(false);expect(hiddenAncestor(host(view,'reward-row-a-name'))).toBe(false);
  act(()=>button(view,'reward-row-a').props.onPress());expect(select).toHaveBeenCalledTimes(1);
  act(()=>name.props.onPress());expect(select).toHaveBeenCalledTimes(2);
  // A row without a mark in the same list is the control itself.
  expect(host(view,'reward-row-b').props).toMatchObject({accessible:true,accessibilityRole:'button',accessibilityLabel:'2, Bo, 4, Open Bo'});expect(button(view,'reward-row-b-name')).toBeUndefined();
 });
 it('carries the action into a windowed list',()=>{
  const select=jest.fn();
  const many=Array.from({length:60},(_,i)=>({id:String(i),rank:i+1,name:'Trader '+i,score:i,...(i===0?{action:{label:place,onSelect:select}}:null)}));
  const view=mount({stickyHeader:true,entries:many,testID:'standings'});
  expect(host(view,'standings-row-0').props).toMatchObject({accessibilityRole:'button',accessibilityLabel:`1, Trader 0, 0, ${place}`});
  act(()=>button(view,'standings-row-0').props.onPress());expect(select).toHaveBeenCalledTimes(1);
 });
});
