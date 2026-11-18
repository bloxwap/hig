const React=require('react');
const {create,act}=require('react-test-renderer');
const {AppState}=require('react-native');
const {Rect,Stop,Circle}=require('react-native-svg');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {AltimeterChart}=require('../../packages/hig/native/src/chart');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
let root,callback,appChange;
function tree(props,motion=false){return h(HIGProvider,{reducedMotion:motion},h(AltimeterChart,{summary:'Market',...props}));}
function chartView(){return root.root.findAll(n=>n.props.accessibilityRole==='image'&&n.props.onLayout)[0];}
function mount(props,motion=false){
 act(()=>{root=create(tree(props,motion));});
 act(()=>appChange('active'));
 act(()=>chartView().props.onLayout({nativeEvent:{layout:{width:390}}}));
}
function frame(now){act(()=>callback(now));}
beforeEach(()=>{
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(fn=>{callback=fn;return 1;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(()=>{});
 jest.spyOn(AppState,'addEventListener').mockImplementation((event,fn)=>{if(event==='change')appChange=fn;return {remove:jest.fn()};});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});

it('reads percentage profit and independently paints the short trail and net-loss capsule',()=>{
 mount({price:99,position:{side:'short',breakEvenPrice:100,pnl:-2,capsule:{returnRatio:-.02}},targets:[{id:'entry',price:100,label:'Entry'}]},true);
 frame(1000);
 expect(chartView().props.accessibilityLabel).toMatch(/-2.00%.*Entry.*100/);
 expect(root.root.findAllByType(Stop).some(s=>s.props.stopColor===nativeSrgb.positive)).toBe(true);
 expect(root.root.findByType(Rect).props.stroke).toBe(nativeSrgb.negative);
});
it('bursts only on crossing and drops the effect when reduced motion is enabled',()=>{
 const props={price:100,targets:[{id:'entry',price:100.01}],degen:true};
 mount(props);frame(1000);
 expect(root.root.findAllByType(Circle)).toHaveLength(0);
 act(()=>root.update(tree({...props,price:100.02})));frame(1200);frame(1500);
 expect(root.root.findAllByType(Circle)).toHaveLength(48);
 act(()=>root.update(tree({...props,price:100.02},true)));
 expect(root.root.findAllByType(Circle)).toHaveLength(0);
});
it('shows stale data and disconnects and reconnects the feed with the app lifecycle',()=>{
 const stop=jest.fn();let push,expire;
 const feed=jest.fn((next,stale)=>{push=next;expire=stale;return stop;});
 mount({feed});act(()=>push(123));frame(1000);
 expect(chartView().props.accessibilityLabel).toMatch(/123/);
 act(()=>expire());frame(1300);expect(chartView().props.accessibilityLabel).not.toMatch(/123/);
 act(()=>appChange('background'));expect(stop).toHaveBeenCalledTimes(1);
 act(()=>appChange('active'));expect(feed).toHaveBeenCalledTimes(2);
 act(()=>root.unmount());root=null;expect(stop).toHaveBeenCalledTimes(2);
});
