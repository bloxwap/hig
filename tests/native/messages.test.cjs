const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,TextInput,View}=require('react-native');
const {HIGProvider,useMessages}=require('../../packages/hig/native/src/provider');
const {Button}=require('../../packages/hig/native/src/button');
const {Dialog,Menu}=require('../../packages/hig/native/src/overlay');
const {Toast,Progress,StatusIndicator}=require('../../packages/hig/native/src/status');
const {Pagination,Search,BackButton}=require('../../packages/hig/native/src/navigation');
const {Field,Input,SearchInput}=require('../../packages/hig/native/src/field');
const {NumberReadout}=require('../../packages/hig/native/src/data');
const {Select}=require('../../packages/hig/native/src/selection');
const h=React.createElement;
// Test fixtures only: HIG approves no translation locale, hosts own these catalogs.
const fr={close:'Fermer',dismiss:'Ignorer',busy:'En cours',dismissNotice:(message,dismiss)=>`${dismiss} : ${message}`};
const ar={close:'إغلاق',dismiss:'تجاهل',busy:'جارٍ التنفيذ',dismissNotice:(message,dismiss)=>`${dismiss} ${message}`,previous:'السابق',next:'التالي',pageOf:(page,total)=>`الصفحة ${page} من ${total}`,stale:'(قديم)',required:'(مطلوب)',search:'بحث',resultCount:(count,locale)=>`${new Intl.NumberFormat(locale).format(count)} نتيجة`,back:'رجوع',menuDescription:'الإجراءات المتاحة',choose:'اختر',chooseOne:'اختر خيارًا واحدًا.',inProgress:'قيد التقدم',progressValue:(value,max)=>`${value} من ${max}`,statusOnline:'متصل'};
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}
const texts=tree=>tree.findAllByType(RNText).map(n=>[].concat(n.props.children).filter(c=>typeof c==='string'||typeof c==='number').join(''));
const pressables=tree=>tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function');
const buttonText=node=>node.findAllByType(RNText).map(n=>[].concat(n.props.children).join('')).join('');

it('native defaults stay English without a provider',()=>{
 const tree=mount(h(View,null,h(Dialog,{open:true,onOpenChange:()=>{},title:'Review',description:'Verify amount'},null),h(Toast,{notices:[{id:'1',message:'Copied',severity:'success'}],onDismiss:()=>{}}),h(Button,{busy:true},'Confirm')));
 expect(texts(tree)).toEqual(expect.arrayContaining(['Close','Copied','Confirm']));
 // Dismiss and busy wording are accessible names now: the toast shows an x and the busy button a spinner.
 expect(texts(tree).join('|')).not.toMatch(/Dismiss|Working/);
 expect(pressables(tree).some(p=>p.props.accessibilityLabel==='Confirm · Working'&&p.props.accessibilityState.busy)).toBe(true);
 expect(pressables(tree).some(p=>p.props.accessibilityLabel==='Dismiss Copied')).toBe(true);
});
it('native provider messages translate Close, Dismiss and busy in visible text and accessible names',()=>{
 const dismissed=jest.fn();
 const tree=mount(h(HIGProvider,{locale:'fr-FR',messages:fr},h(Dialog,{open:true,onOpenChange:()=>{},title:'Vérifier',description:'Montant'},null),h(Toast,{notices:[{id:'1',message:'Copié',severity:'success'}],onDismiss:dismissed}),h(Button,{busy:true},'Confirmer')));
 const all=texts(tree);
 expect(all).toEqual(expect.arrayContaining(['Fermer']));
 expect(all.join('|')).not.toMatch(/Close|Dismiss|Working/);
 const close=pressables(tree).find(p=>buttonText(p)==='Fermer');expect(close).toBeTruthy();expect(close.props.accessibilityLabel).toBeUndefined();
 const dismiss=pressables(tree).find(p=>p.props.accessibilityLabel==='Ignorer : Copié');
 expect(buttonText(dismiss)).toBe('');
 act(()=>dismiss.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));expect(dismissed).toHaveBeenCalledWith('1');
 const busy=pressables(tree).find(p=>buttonText(p)==='Confirmer');expect(busy.props.accessibilityState).toEqual({disabled:true,busy:true});expect(busy.props.accessibilityLabel).toBe('Confirmer · En cours');
});
it('native RTL roots render translated labels with RTL writing direction',()=>{
 const tree=mount(h(HIGProvider,{locale:'ar-EG',direction:'rtl',messages:ar},h(Dialog,{open:true,onOpenChange:()=>{},title:'مراجعة',description:'تحقق من المبلغ'},h(Button,{busy:true},'تأكيد')),h(Toast,{notices:[{id:'1',message:'تم النسخ',severity:'success'}],onDismiss:()=>{}}),h(Pagination,{page:2,total:10,onPageChange:()=>{}})));
 const close=pressables(tree).find(p=>buttonText(p)==='إغلاق');expect(close).toBeTruthy();
 const label=close.findAllByType(RNText)[0];expect([].concat(label.props.style).find(s=>s&&s.writingDirection).writingDirection).toBe('rtl');
 expect(pressables(tree).find(p=>buttonText(p)==='تأكيد').props.accessibilityState.busy).toBe(true);
 const dismiss=pressables(tree).find(p=>p.props.accessibilityLabel==='تجاهل تم النسخ');expect(dismiss).toBeTruthy();
 expect(texts(tree)).toEqual(expect.arrayContaining(['الصفحة ٢ من ١٠','السابق','التالي']));
});
it('native per-component props override the provider; an empty busy label keeps busy state',()=>{
 const tree=mount(h(HIGProvider,{messages:fr},h(Dialog,{open:true,onOpenChange:()=>{},title:'T',description:'D',closeLabel:'Terminé'},h(Button,{busy:true,busyLabel:''},'Envoyer')),h(Toast,{notices:[{id:'1',message:'Copié',severity:'success'}],onDismiss:()=>{},dismissLabel:'Masquer'})));
 const all=texts(tree);
 expect(all).toContain('Terminé');expect(all).not.toContain('Fermer');
 const quiet=pressables(tree).find(p=>buttonText(p)==='Envoyer');expect(quiet.props.accessibilityState.busy).toBe(true);
 expect(pressables(tree).find(p=>p.props.accessibilityLabel==='Masquer : Copié')).toBeTruthy();
});
it('native nested providers, markers, value text and menus use the catalog',()=>{
 function Probe(){return h(RNText,null,useMessages().close);}
 const tree=mount(h(HIGProvider,{locale:'ar-EG',direction:'rtl',messages:ar},h(HIGProvider,{locale:'ar-EG',direction:'rtl',density:'compact',messages:{close:'اغلق'}},
  h(Probe),h(Field,{label:'المبلغ',required:true},h(Input)),h(NumberReadout,{label:'الرصيد',value:5,stale:true}),h(Progress,{label:'تحميل'}),h(Progress,{label:'تحميل',value:3,max:10}),h(StatusIndicator,{label:'الشبكة',state:'online'}),
  h(Search,{query:'',onQueryChange:()=>{},results:[{id:'a',label:'BTC',onSelect:()=>{}}]}),h(BackButton,{onBack:()=>{}}),h(Menu,{label:'المزيد',items:[]}),h(Select,{label:'الجانب',options:[{value:'buy',label:'شراء'}]}))));
 const all=texts(tree);
 expect(all).toEqual(expect.arrayContaining(['اغلق','المبلغ (مطلوب)','٥ (قديم)','الشبكة: متصل','١ نتيجة','رجوع','الجانب: شراء']));
 expect(tree.findAllByType(TextInput).map(n=>n.props.accessibilityLabel)).toEqual(['المبلغ (مطلوب)','بحث']);
 expect(tree.findAll(n=>n.props.accessibilityLabel==='الرصيد: ٥ (قديم)').length).toBeGreaterThan(0);
 const values=tree.findAll(n=>n.props.accessibilityRole==='progressbar').map(n=>n.props.accessibilityValue.text);
 expect([...new Set(values)]).toEqual(['قيد التقدم','٣ من ١٠']);
});

it('updates message readers only when their translations change',()=>{
 const reads=[];
 const Reader=React.memo(function Reader(){reads.push(useMessages().close);return null;});
 const child=h(Reader);
 mount(h(HIGProvider,{messages:fr},child));
 const before=reads.length;
 act(()=>root.update(h(HIGProvider,{messages:fr,density:'compact'},child)));
 expect(reads.length).toBe(before);
 act(()=>root.update(h(HIGProvider,{messages:ar,density:'compact'},child)));
 expect(reads.slice(before)).toEqual([ar.close]);
});

it('formats the search announcement again only when its inputs change',()=>{
 const messages={resultCount:jest.fn((count,locale)=>locale+' '+count)};
 const select=()=>{};
 const results=[{id:'1',label:'First',onSelect:select},{id:'2',label:'Second',onSelect:select}];
 const scene=(query,items,locale)=>h(HIGProvider,{messages,locale},h(Search,{query,results:items,onQueryChange:select}));
 mount(scene('',results,'en-US'));
 act(()=>root.update(scene('f',results.slice(),'en-US')));
 expect(messages.resultCount.mock.calls).toEqual([[2,'en-US']]);
 act(()=>root.update(scene('fi',results.slice(0,1),'en-US')));
 act(()=>root.update(scene('fi',results.slice(0,1),'fr-FR')));
 expect(messages.resultCount.mock.calls).toEqual([[2,'en-US'],[1,'en-US'],[1,'fr-FR']]);
 expect(texts(root.root)).toContain('fr-FR 1');
});

it('keeps button press handlers stable when the number locale changes',()=>{
 const actions=Array.from({length:40},(_,i)=>h(Button,{key:i},'Action '+i));
 const scene=locale=>h(HIGProvider,{numberFormat:{locale}},actions);
 mount(scene('en-US'));
 const handlers=()=>[...new Set(pressables(root.root).map(node=>node.props.onPress))];
 const previous=handlers();
 expect(previous).toHaveLength(actions.length);
 act(()=>root.update(scene('fr-FR')));
 expect(handlers().filter((handler,i)=>handler!==previous[i]).length).toBe(0);
});

it('preserves search input handlers across number-format updates and refreshes accessibility hints',()=>{
 const field=description=>h(Field,{label:'Asset',description},h(SearchInput,{value:'BTC',onClear:()=>{}}));
 const first=field('Choose an asset');
 const scene=(locale,child)=>h(HIGProvider,{numberFormat:{locale}},child);
 mount(scene('en-US',first));
 const input=()=>root.root.findByType(TextInput);
 const onFocus=input().props.onFocus;
 act(()=>root.update(scene('fr-FR',first)));
 expect(input().props.onFocus).toBe(onFocus);
 act(()=>root.update(scene('fr-FR',field('Choose a different asset'))));
 expect(input().props.accessibilityHint).toBe('Choose a different asset');
});

it('refreshes progress value text when the reading, locale or translation changes',()=>{
 const progressValue=jest.fn((value,max)=>value+' of '+max);
 const messages={progressValue};
 const scene=(label,value,locale,copy=messages)=>h(HIGProvider,{messages:copy,locale},h(Progress,{label,value,max:5000}));
 mount(scene('Download',1200,'en-US'));
 act(()=>root.update(scene('Upload',1200,'en-US')));
 expect(progressValue.mock.calls).toEqual([['1,200','5,000']]);
 act(()=>root.update(scene('Upload',1400,'en-US')));
 act(()=>root.update(scene('Upload',1400,'de-DE')));
 expect(progressValue.mock.calls.slice(1)).toEqual([['1,400','5,000'],['1.400','5.000']]);
 const translated={progressValue:(value,max)=>value+' von '+max};
 act(()=>root.update(scene('Upload',1400,'de-DE',translated)));
 const bar=root.root.findAll(n=>n.props.accessibilityRole==='progressbar')[0];
 expect(bar.props.accessibilityValue.text).toBe('1.400 von 5.000');
});

it('reuses the pagination reading while sending navigation to the latest callback',()=>{
 const pageOf=jest.fn((page,total)=>page+' / '+total);
 const messages={pageOf},first=jest.fn(),second=jest.fn();
 const scene=(page,locale,onPageChange)=>h(HIGProvider,{locale,messages},h(Pagination,{page,total:2000,onPageChange}));
 mount(scene(1200,'en-US',first));
 const onPress=()=>root.root.findAllByType(Button).map(button=>button.props.onPress);
 const mounted=onPress();
 act(()=>root.update(scene(1200,'en-US',first)));
 expect(onPress()).toEqual(mounted);
 act(()=>root.update(scene(1200.9,'en-US',second)));
 expect(pageOf.mock.calls).toEqual([['1,200','2,000']]);
 const next=root.root.findAllByType(Button).find(b=>b.props.children==='Next');
 act(()=>next.props.onPress());
 expect(second).toHaveBeenCalledWith(1201);expect(first).not.toHaveBeenCalled();
 act(()=>root.update(scene(1201,'de-DE',second)));
 expect(texts(root.root)).toContain('1.201 / 2.000');
});

it('keeps the online pulse attached while the status label changes',()=>{
 const {Animated}=require('react-native');
 const interpolate=jest.spyOn(Animated.Value.prototype,'interpolate');
 try{
  const scene=(label,reducedMotion=false)=>h(HIGProvider,{reducedMotion},h(StatusIndicator,{label,state:'online'}));
  mount(scene('Network'));
  expect(interpolate).toHaveBeenCalledTimes(2);
  interpolate.mockClear();
  act(()=>root.update(scene('Service')));
  expect(interpolate).not.toHaveBeenCalled();
  expect(texts(root.root)).toContain('Service: online');
  act(()=>root.update(scene('Service',true)));
  expect(root.root.findAllByType(Animated.View)).toHaveLength(0);
 }finally{interpolate.mockRestore();}
});
