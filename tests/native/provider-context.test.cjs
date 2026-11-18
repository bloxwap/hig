/** Native HIGProvider: one context value for as long as nothing in it changes, so a provider that renders again re-renders no reader. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {HIGProvider,useHIG,useColors,usePresentNumber,useReadoutFormat}=require('../../packages/hig/native/src/provider');
const {Text}=require('../../packages/hig/native/src/surface');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
it('updates only currency subscribers when currency display changes',()=>{
 const reads={plain:0,currency:0};
 function Reader({currency}){
  reads[currency?'currency':'plain']++;
  const {locale,staleLabel}=useReadoutFormat(currency);
  return h(Text,null,locale+'/'+staleLabel);
 }
 const readers=Array.from({length:40},(_,i)=>h(Reader,{key:i,currency:i%2===0}));
 const host=(currencyDisplay,locale='en-US',stale='Stale')=>h(HIGProvider,{reducedMotion:true,numberFormat:{currencyDisplay,locale},messages:{stale}},readers);
 act(()=>{root=create(host('symbol'));});
 reads.plain=reads.currency=0;
 for(let i=0;i<5;i++)act(()=>root.update(host(i%2?'symbol':'code')));
 expect(reads).toEqual({plain:0,currency:100});
 act(()=>root.update(host('code','fr-FR')));
 act(()=>root.update(host('code','fr-FR','Périmé')));
 expect(root.root.findAllByType(Text).every(node=>node.props.children==='fr-FR/Périmé')).toBe(true);
 expect(reads).toEqual({plain:40,currency:140});
});

it('keeps numeric consumers idle for newly allocated equivalent options',()=>{
 let reads=0;
 function Reader(){
  reads++;
  const {locale}=useReadoutFormat();
  const format=usePresentNumber()({style:'currency'});
  return h(Text,null,[locale,format.currencyDisplay,format.useGrouping].join('/'));
 }
 const readers=Array.from({length:40},(_,key)=>h(Reader,{key}));
 const host=(locale,currencyDisplay,useGrouping)=>h(HIGProvider,{numberFormat:{locale,currencyDisplay,useGrouping},reducedMotion:true},readers);
 act(()=>{root=create(host('en-US','symbol',false));});
 reads=0;
 for(let i=0;i<5;i++)act(()=>root.update(host('en-US','symbol',false)));
 expect(reads).toBe(0);
 act(()=>root.update(host('fr-FR','symbol',false)));
 act(()=>root.update(host('fr-FR','code',false)));
 act(()=>root.update(host('fr-FR','code',true)));
 expect(reads).toBe(120);
 expect(root.root.findAllByType(Text).every(node=>node.props.children==='fr-FR/code/true')).toBe(true);
});

it('keeps readers idle when a nested translation repeats the inherited value',()=>{
 const inherited={close:'Fermer'};
 let reads=0;
 function Reader(){reads++;return h(Text,null,useHIG().messages.close);}
 const readers=Array.from({length:50},(_,key)=>h(Reader,{key}));
 const host=close=>h(HIGProvider,{messages:inherited,reducedMotion:true},h(HIGProvider,{messages:{close}},readers));
 act(()=>{root=create(host('Fermer'));});
 reads=0;
 for(let i=0;i<5;i++)act(()=>root.update(host('Fermer')));
 expect(reads).toBe(0);
 act(()=>root.update(host('Schließen')));
 expect(reads).toBe(50);
 expect(root.root.findAllByType(Text).every(node=>node.props.children==='Schließen')).toBe(true);
});

it('a provider that renders again with the same props re-renders no reader of the context or the colours',()=>{
 let reads=0,bump,setLocale;const seen=[];
 const Reader=React.memo(function Reader(){const value=useHIG();useColors();reads++;seen.push(value);return h(Text,null,value.locale);});
 const families={400:'Sans',600:'SansBold'},messages={close:'Fermer'};
 function Host(){const [,setTick]=React.useState(0),[locale,set]=React.useState('en-US');bump=()=>setTick(tick=>tick+1);setLocale=set;return h(HIGProvider,{locale,reducedMotion:true,fontFamily:'Sans',fontFamilies:families,messages},h(Reader));}
 act(()=>{root=create(h(Host));});
 const settled=reads;
 for(let turn=0;turn<5;turn++)act(()=>bump());
 expect(reads).toBe(settled);expect(new Set(seen.slice(settled-1)).size).toBe(1);
 act(()=>setLocale('fr-FR'));expect(reads).toBe(settled+1);expect(seen.at(-1).locale).toBe('fr-FR');
});

it('inherits omitted environment and font settings through a nested provider',()=>{
 let seen;
 function Reader(){seen=useHIG();return null;}
 act(()=>{root=create(h(HIGProvider,{locale:'ar-EG',direction:'rtl',reducedMotion:true,fontFamily:'Custom',maxFontSizeMultiplier:2},h(HIGProvider,{primaryColor:'#ffffff'},h(Reader))));});
 expect(seen).toMatchObject({locale:'ar-EG',direction:'rtl',reducedMotion:true,fontFamily:'Custom',maxFontSizeMultiplier:2});
});

it('keeps a native switch idle across density changes and uses the current feedback sink',()=>{
 const {Switch}=require('../../packages/hig/native/src/switch');
 const first={emit:jest.fn()},second={emit:jest.fn()};
 const control=h(Switch,{label:'Sound',hideLabel:true});
 const target=()=>root.root.findAll(node=>node.props.accessibilityRole==='switch'&&typeof node.props.onPress==='function')[0];
 const host=(density,feedback)=>h(HIGProvider,{density,feedback,reducedMotion:true},control);
 act(()=>{root=create(host('comfortable',first));});
 const originalStyle=target().props.style;
 act(()=>root.update(host('compact',first)));
 expect(target().props.style).toBe(originalStyle);
 act(()=>root.update(host('compact',second)));
 act(()=>target().props.onPress());
 expect(first.emit).not.toHaveBeenCalled();
 expect(second.emit).toHaveBeenCalledTimes(1);
 expect(second.emit.mock.calls[0][0]).toMatchObject({intent:'selection',origin:'native'});
});

it('keeps tab and layout views idle across density changes and propagates RTL',()=>{
 const {Tabs}=require('../../packages/hig/native/src/navigation');
 const {Stack,Surface}=require('../../packages/hig/native/src/surface');
 const {View,StyleSheet}=require('react-native');
 let reads=0;
 const items=[{get value(){reads++;return 'a';},label:'A',content:null},{value:'b',label:'B',content:null}];
 const child=h(Surface,{testID:'surface'},h(Stack,{testID:'stack'},h(Tabs,{label:'Sections',items})));
 const host=(density,direction)=>h(HIGProvider,{density,direction,reducedMotion:true},child);
 act(()=>{root=create(host('comfortable','ltr'));});
 const layoutViews=()=>root.root.findAllByType(View).filter(node=>['stack','surface'].includes(node.props.testID)||node.props.accessibilityRole==='tablist');
 const originalStyles=layoutViews().map(view=>view.props.style);
 expect(originalStyles).toHaveLength(3);
 expect(reads).toBeGreaterThan(0);
 reads=0;
 act(()=>root.update(host('compact','ltr')));
 expect(reads).toBe(0);
 layoutViews().forEach((view,index)=>expect(view.props.style).toBe(originalStyles[index]));
 act(()=>root.update(host('compact','rtl')));
 for(const testID of ['surface','stack']){
  const view=root.root.findAllByType(View).find(node=>node.props.testID===testID);
  expect(StyleSheet.flatten(view.props.style).direction).toBe('rtl');
 }
});
