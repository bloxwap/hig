/** Native ExplainerBlock: an optional header, a lead paragraph, toned sections, steps, a caveat and one or two actions. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet}=require('react-native');
const {nativeSrgb:srgb,withAlpha}=require('@bloxwap/hig/tokens');
// `up` is the provider's market colour, buy by default.
const nativeSrgb={...srgb,up:srgb.buy};
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ExplainerBlock}=require('../../packages/hig/native/src/explainer-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const h=React.createElement;
let root;
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(ExplainerBlock,props)));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});
const glyph=testID=>h('View',{testID});
const trend=[
 {id:'up',tone:'up',icon:glyph('glyph-up'),title:'Up',meaning:'→ Momentum is rising',body:'Price is climbing.'},
 {id:'down',tone:'down',icon:glyph('glyph-down'),title:'Down',meaning:'→ Momentum is falling',body:'Price is sliding.'},
 {id:'watch',tone:'warning',icon:glyph('glyph-watch'),title:'Watch',body:'Price is coiling.',testID:'trend-watch'},
];

it('draws the How Trend works sheet: header, lead, toned icon sections with heading and meaning, a caveat and one action',()=>{
 const done=jest.fn();
 const view=mount({title:'How Trend works',headingId:'trend-heading',description:'Trend reads each market every minute.',sections:trend,caveat:'Trend is not advice.',primaryAction:{label:'Got it',onSelect:done}});
 expect(text(host(view,'explainer-title'))).toBe('How Trend works');expect(host(view,'explainer-title').props.nativeID).toBe('trend-heading');
 expect(text(host(view,'explainer-description'))).toBe('Trend reads each market every minute.');expect(flat(host(view,'explainer-description')).color).toBe(nativeSrgb.muted);
 const up=host(view,'explainer-section-up');expect(flat(up).backgroundColor).toBe(withAlpha(nativeSrgb.up,0.1));
 const icon=host(view,'explainer-section-up-icon');expect(icon.props.accessibilityElementsHidden).toBe(true);expect(flat(icon).backgroundColor).toBe(withAlpha(nativeSrgb.up,0.15));expect(has(view,'glyph-up')).toBe(true);
 const heading=host(view,'explainer-section-up-title');expect(heading.props.accessibilityRole).toBe('header');expect(text(heading)).toBe('Up → Momentum is rising');expect(flat(heading).color).toBe(nativeSrgb.up);
 expect(text(host(view,'explainer-section-up-body'))).toBe('Price is climbing.');
 expect(flat(host(view,'trend-watch')).backgroundColor).toBe(withAlpha(nativeSrgb.warning,0.1));expect(has(view,'explainer-section-watch')).toBe(false);
 expect(text(host(view,'explainer-caveat'))).toBe('Trend is not advice.');
 expect(has(view,'explainer-secondary')).toBe(false);expect(button(view,'explainer-primary').props.intent).toBe('primary');
 act(()=>button(view,'explainer-primary').props.onPress());expect(done).toHaveBeenCalledTimes(1);
});

it('draws the How Swing works sheet without a header: neutral sections with media, a section caveat and host nodes as given',()=>{
 const view=mount({testID:'swing-how',sections:[{id:'notification',title:'The notification',media:glyph('example-card'),body:'Each signal names a market.',caveat:'Signals expire.'},{id:'execution',title:'Execution',body:h('View',{testID:'rich'})}]});
 expect(has(view,'swing-how-header')).toBe(false);expect(has(view,'swing-how-title')).toBe(false);
 const section=host(view,'swing-how-section-notification');expect(flat(section).backgroundColor).not.toBe(withAlpha(nativeSrgb.up,0.1));expect(has(view,'swing-how-section-notification-icon')).toBe(false);
 expect(flat(host(view,'swing-how-section-notification-title')).color).toBe(nativeSrgb.text);
 expect(has(host(view,'swing-how-section-notification-media'),'example-card')).toBe(true);
 expect(text(host(view,'swing-how-section-notification-caveat'))).toBe('Signals expire.');
 expect(has(host(view,'swing-how-section-execution-body'),'rich')).toBe(true);
 expect(has(view,'swing-how-actions')).toBe(false);
});

it('draws a task dialog: Back with backProps, numbered steps, two actions with their intents, and pins the header with stickyHeader',()=>{
 const back=jest.fn(),pressIn=jest.fn(),copy=jest.fn(),later=jest.fn();
 const view=mount({testID:'invite',title:'Invite a friend',onBack:back,backProps:{onPressIn:pressIn},steps:['Copy your link.','Send it to a friend.'],primaryAction:{label:'Copy link',onSelect:copy,busy:true,testID:'invite-copy'},secondaryAction:{label:'Not now',onSelect:later},suppressFeedback:true});
 const backButton=all(view,'invite-back').find(node=>typeof node.props.onPressIn==='function');act(()=>backButton.props.onPressIn());act(()=>backButton.props.onPress());expect([back,pressIn].map(fn=>fn.mock.calls.length)).toEqual([1,1]);
 expect(text(host(view,'invite-step-0'))).toBe('1.Copy your link.');expect(text(host(view,'invite-step-1'))).toBe('2.Send it to a friend.');expect(host(view,'invite-step-0').props.accessible).toBe(true);
 const actions=host(view,'invite-actions');expect(actions.findAllByType(Button).map(node=>[node.props.testID,node.props.intent])).toEqual([['invite-secondary','secondary'],['invite-copy','primary']]);
 expect(button(view,'invite-copy').props).toMatchObject({busy:true,suppressFeedback:true});
 act(()=>button(view,'invite-secondary').props.onPress());expect(later).toHaveBeenCalledTimes(1);
 // pressProps reach the action's Button, such as Android sound off for a host that plays its own.
 const quiet=mount({testID:'quiet',primaryAction:{label:'Close',onSelect:later,pressProps:{android_disableSound:true}}});
 expect(button(quiet,'quiet-primary').props.android_disableSound).toBe(true);
 const sticky=mount({title:'Invite a friend',stickyHeader:true});expect(has(sticky,'explainer-sticky-header')).toBe(true);
 // A step drawn from a node may hold its own control, so the row stays open to VoiceOver and TalkBack.
 const rich=mount({testID:'rich',steps:['Copy your link.',h(Button,{testID:'rich-copy',onPress:()=>{}},'Copy')]});
 expect(host(rich,'rich-step-0').props.accessible).toBe(true);expect(host(rich,'rich-step-1').props.accessible).toBe(false);expect(has(host(rich,'rich-step-1'),'rich-copy')).toBe(true);
 expect(blocks.ExplainerBlock).toBe(ExplainerBlock);
});

it('draws an eyebrow over the title, a badge, a hero, host children before the actions, a trailing action icon and forwards titleRef',()=>{
 const ref=React.createRef(),approve=jest.fn();
 const view=mount({testID:'builder',title:'Keep the lights on.',eyebrow:'Builder fee',badge:'Demo',titleRef:ref,hero:glyph('donut'),description:'A small fee.',caveat:'Fees can change.',children:glyph('extra'),primaryAction:{label:'Approve',onSelect:approve,icon:glyph('arrow')}});
 const eyebrow=host(view,'builder-eyebrow');expect(text(eyebrow)).toBe('Builder fee');expect(flat(eyebrow)).toMatchObject({color:nativeSrgb.muted,textTransform:'uppercase',textAlign:'center'});
 // The eyebrow sits over the heading in the header's middle; the badge joins the heading's name.
 expect(has(host(view,'builder-header'),'builder-eyebrow')).toBe(true);
 expect(view.findAll(node=>node.props.accessibilityLabel==='Keep the lights on., Demo'&&node.props.accessibilityRole==='header'&&typeof node.type==='string')).toHaveLength(1);
 expect(ref.current).toBeTruthy();
 expect(has(host(view,'builder-hero'),'donut')).toBe(true);
 // Order: header, hero, lead, caveat, children, actions.
 const order=['builder-header','builder-hero','builder-description','builder-caveat','extra','builder-actions'];
 const ids=[];const walk=node=>{if(typeof node==='string')return;if(typeof node.type==='string'&&order.includes(node.props.testID)&&!ids.includes(node.props.testID))ids.push(node.props.testID);node.children.forEach(walk);};walk(view);expect(ids).toEqual(order);
 const icon=host(view,'builder-primary-icon');expect(icon.props.accessibilityElementsHidden).toBe(true);expect(has(icon,'arrow')).toBe(true);
 act(()=>button(view,'builder-primary').props.onPress());expect(approve).toHaveBeenCalledTimes(1);
 // Without a title the eyebrow is the first line; without the new props nothing new is drawn.
 const bare=mount({testID:'bare',eyebrow:'Builder fee',description:'Lead.'});expect(text(host(bare,'bare-eyebrow'))).toBe('Builder fee');expect(has(bare,'bare-header')).toBe(false);
 const plain=mount({testID:'plain',title:'Plain'});expect(has(plain,'plain-eyebrow')).toBe(false);expect(has(plain,'plain-hero')).toBe(false);
});

it('names an action with a Text glyph icon by its label alone, busy or not',()=>{
 const {Text}=require('react-native');
 const glyph=h(Text,null,'↗');
 const named=view=>view.findAll(node=>node.props.testID==='open'&&node.props.accessibilityRole==='button'&&typeof node.type==='string')[0].props.accessibilityLabel;
 let view=mount({title:'Open',primaryAction:{label:'Open',icon:glyph,testID:'open',onSelect(){}}});
 expect(named(view)).toBe('Open');
 view=mount({title:'Open',primaryAction:{label:'Open',icon:glyph,busy:true,testID:'open',onSelect(){}}});
 expect(named(view)).toMatch(/^Open( · Working)?$/);expect(named(view)).not.toContain('↗');
 // Without an icon the Button names itself, as before.
 view=mount({title:'Open',primaryAction:{label:'Open',busy:true,testID:'open',onSelect(){}}});
 expect(named(view)).toMatch(/^Open( · Working)?$/);
});
