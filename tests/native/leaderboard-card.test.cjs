/** Native LeaderboardCard: header, the promotion (prize pool or sweepstakes), the standings choice, the viewer's row, then the ranked rows. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {LeaderboardCard,leaderboardProgress}=require('../../packages/hig/native/src/leaderboard-card');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {SegmentedControl}=require('../../packages/hig/native/src/radio-group');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
const entries=[{id:'a',rank:1,name:'0x4e79…949f',verified:true,detail:'$1,789,061 vol',score:795407},{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450,you:true},{id:'c',rank:3,name:'Zed',score:null}];
const pool={eyebrow:'Season 01 prize pool',amount:4037,goal:250000,progress:percent=>`${percent} to goal`,updated:'Updates every 15 minutes',headline:['Top ',{highlight:'100'},' traders split ',{highlight:'$250,000'},' pot'],description:'Funded by fees.'};
const base={title:'Leaderboard',entries};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(LeaderboardCard,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
const readings=view=>host(view,'leaderboard-rows').children.map(row=>row.props.accessibilityLabel);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('measures the share of the goal reached, clamped, and unknown without a usable amount or goal',()=>{
 expect(leaderboardProgress(4037,250000)).toBeCloseTo(0.016148,6);expect(leaderboardProgress(300,200)).toBe(1);expect(leaderboardProgress(-5,200)).toBe(0);
 for(const [amount,goal] of [[null,200],[10,undefined],[10,0],[Number.NaN,200]])expect(leaderboardProgress(amount,goal)).toBeNull();
});

it('shows the host title as the heading, Back only with onBack, and the ranked rows in order',()=>{
 let view=mount();
 expect(text(host(view,'leaderboard-title'))).toBe('Leaderboard');expect(host(view,'leaderboard-title').props.accessibilityRole).toBe('header');expect(has(view,'leaderboard-back')).toBe(false);
 expect(readings(view)).toEqual(['1, 0x4e79…949f, $1,789,061 vol, 795,407','2, you, $1,090,779 vol, 418,450','3, Zed, —']);
 expect(flat(host(view,'leaderboard-rows'))).toMatchObject({gap:2,borderRadius:20,overflow:'hidden'});expect(flat(host(view,'leaderboard-row-a'))).toMatchObject({minHeight:64,paddingHorizontal:20,backgroundColor:nativeSrgb.surface});
 // The viewer's row takes the action colour for the name and the positive tone for the score; others stay text.
 expect(flat(host(view,'leaderboard-row-me-name')).color).toBe(nativeSrgb.action);expect(flat(host(view,'leaderboard-row-a-name')).color).toBe(nativeSrgb.text);
 const score=id=>view.findAllByType(AnimatedNumberReadout).find(flow=>flow.props.testID===`leaderboard-row-${id}-score`).props;
 expect(score('me')).toMatchObject({value:418450,tone:'positive'});expect(score('a').tone).toBe('text');expect(score('c').value).toBeNull();
 // Without artwork the avatar shows the first letters; nothing else is drawn without its props.
 expect(host(view,'leaderboard-row-c').findAll(node=>node.type==='Text'&&node.props.children==='Ze')).toHaveLength(1);
 for(const id of ['leaderboard-promo','leaderboard-you','leaderboard-tabs','leaderboard-list-title','leaderboard-footnote'])expect(has(view,id)).toBe(false);
 const back=jest.fn();view=mount({onBack:back,headerAction:h(View,{testID:'share'})});expect(has(view,'share')).toBe(true);
 act(()=>{all(view,'leaderboard-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 expect(blocks.LeaderboardCard).toBe(LeaderboardCard);expect(blocks.leaderboardProgress).toBe(leaderboardProgress);
});

it('draws a prize pool: the figure against its goal, the bar at the share reached, and the lines under it',()=>{
 let view=mount({promo:pool});
 expect(text(host(view,'leaderboard-eyebrow'))).toBe('Season 01 prize pool');expect(flat(host(view,'leaderboard-eyebrow'))).toMatchObject({textTransform:'uppercase',color:nativeSrgb.action});
 expect(host(view,'leaderboard-amount').props.accessibilityLabel).toBe('$4,037 / $250,000');
 expect(host(view,'leaderboard-amount').findAllByType(AnimatedNumberReadout)[0].props).toMatchObject({value:4037,tone:'positive',options:{style:'currency',currency:'USD',maximumFractionDigits:0}});
 expect(parseFloat(flat(host(view,'leaderboard-fill')).width)).toBeCloseTo(1.6148,3);expect(flat(host(view,'leaderboard-fill')).backgroundColor).toBe(nativeSrgb.action);expect(host(view,'leaderboard-track').props.importantForAccessibility).toBe('no-hide-descendants');
 expect(text(host(view,'leaderboard-progress'))).toBe('2% to goal');expect(text(host(view,'leaderboard-updated'))).toBe('Updates every 15 minutes');
 expect(text(host(view,'leaderboard-headline'))).toBe('Top 100 traders split $250,000 pot');
 expect(host(view,'leaderboard-headline').findAll(node=>node.type==='Text'&&flat(node).color===nativeSrgb.action).map(text)).toEqual(['100','$250,000']);
 expect(text(host(view,'leaderboard-description'))).toBe('Funded by fees.');expect(button(view,'leaderboard-rules')).toBeUndefined();expect(button(view,'leaderboard-action')).toBeUndefined();
 // Over the goal the bar is full; an unknown amount reads as a dash and an empty bar; the host formats the money.
 view=mount({promo:{...pool,amount:300000}});expect(flat(host(view,'leaderboard-fill')).width).toBe('100%');expect(text(host(view,'leaderboard-progress'))).toBe('100% to goal');
 view=mount({promo:{...pool,amount:null,amountOptions:{style:'currency',currency:'EUR',maximumFractionDigits:0}}});
 expect(host(view,'leaderboard-amount').props.accessibilityLabel).toBe('— / €250,000');expect(flat(host(view,'leaderboard-fill')).width).toBe('0%');expect(text(host(view,'leaderboard-progress'))).toBe('— to goal');
 view=mount({promo:{eyebrow:'Pool',amount:10,goal:100}});expect(has(view,'leaderboard-progress')).toBe(false);expect(has(view,'leaderboard-headline')).toBe(false);
});

it('draws a sweepstakes: a caption instead of a goal, no bar, and the rules and action report presses',()=>{
 const rules=jest.fn(),action=jest.fn();
 const view=mount({promo:{eyebrow:'Sweepstakes',rules:{label:'See rules',onSelect:rules},amount:100000,caption:'top prize',action:{label:'Draws and winners',onSelect:action}}});
 expect(host(view,'leaderboard-amount').props.accessibilityLabel).toBe('$100,000 top prize');expect(has(view,'leaderboard-track')).toBe(false);
 expect(button(view,'leaderboard-rules').props.children).toBe('See rules');expect(button(view,'leaderboard-action').props).toMatchObject({children:'Draws and winners',fullWidth:true});
 act(()=>{button(view,'leaderboard-rules').props.onPress({});});act(()=>{button(view,'leaderboard-action').props.onPress({});});expect(rules).toHaveBeenCalledTimes(1);expect(action).toHaveBeenCalledTimes(1);
});

it('pins the viewer on a tinted row above the list, with column headings, a standings choice and a footnote',()=>{
 const change=jest.fn();
 const view=mount({you:{id:'me',rank:2,name:'you',detail:'$1,090,779 vol',score:418450},listTitle:'Top 25 by volume',scoreTitle:'Entries',footnote:'Entries are provisional until audited.',tabs:{label:'Standings',options:[{value:'upcoming',label:'Upcoming draw'},{value:'winners',label:'Top winners'}],value:'upcoming',onValueChange:change}});
 const you=host(view,'leaderboard-you');expect(you.props.accessibilityLabel).toBe('2, you, $1,090,779 vol, 418,450');
 expect(flat(you)).toMatchObject({marginTop:16,borderRadius:20});expect(flat(you).backgroundColor).not.toBe(nativeSrgb.surface);expect(flat(host(view,'leaderboard-you-name')).color).toBe(nativeSrgb.action);
 expect(text(host(view,'leaderboard-list-title'))).toBe('Top 25 by volume');expect(text(host(view,'leaderboard-score-title'))).toBe('Entries');expect(text(host(view,'leaderboard-footnote'))).toBe('Entries are provisional until audited.');
 const control=view.findByType(SegmentedControl);expect(control.props).toMatchObject({label:'Standings',value:'upcoming'});act(()=>{control.props.onValueChange('winners');});expect(change).toHaveBeenCalledWith('winners');
});

it('marks verified traders, read out only when the host names the mark, and formats scores as the host asks',()=>{
 let view=mount({verifiedLabel:'Verified',scoreOptions:{notation:'compact',maximumFractionDigits:1}});
 expect(readings(view)).toEqual(['1, 0x4e79…949f, Verified, $1,789,061 vol, 795.4K','2, you, $1,090,779 vol, 418.5K','3, Zed, —']);
 expect(has(view,'leaderboard-row-a-verified')).toBe(true);expect(has(view,'leaderboard-row-me-verified')).toBe(false);
 view=mount();expect(readings(view)[0]).toBe('1, 0x4e79…949f, $1,789,061 vol, 795,407');expect(has(view,'leaderboard-row-a-verified')).toBe(true);
 view=mount({entries:[{id:'a',rank:1,name:'Ada',avatar:h(View,{testID:'ada-art'}),score:1}]});expect(has(view,'ada-art')).toBe(true);
});
