const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,TextInput,View}=require('react-native');
const {HIGProvider,useMessages}=require('../../packages/native/src/provider');
const {Button}=require('../../packages/native/src/button');
const {Dialog,Menu}=require('../../packages/native/src/overlay');
const {Toast,Progress,StatusIndicator}=require('../../packages/native/src/status');
const {Pagination,Search,BackButton}=require('../../packages/native/src/navigation');
const {Field,Input}=require('../../packages/native/src/field');
const {NumberReadout}=require('../../packages/native/src/data');
const {Select}=require('../../packages/native/src/selection');
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
 expect(texts(tree)).toEqual(expect.arrayContaining(['Close','Dismiss','· Working']));
 expect(pressables(tree).some(p=>p.props.accessibilityLabel==='Dismiss Copied')).toBe(true);
});
it('native provider messages translate Close, Dismiss and busy; visible text and labels agree',()=>{
 const dismissed=jest.fn();
 const tree=mount(h(HIGProvider,{locale:'fr-FR',messages:fr},h(Dialog,{open:true,onOpenChange:()=>{},title:'Vérifier',description:'Montant'},null),h(Toast,{notices:[{id:'1',message:'Copié',severity:'success'}],onDismiss:dismissed}),h(Button,{busy:true},'Confirmer')));
 const all=texts(tree);
 expect(all).toEqual(expect.arrayContaining(['Fermer','Ignorer','· En cours']));
 expect(all.join('|')).not.toMatch(/Close|Dismiss|Working/);
 const close=pressables(tree).find(p=>buttonText(p)==='Fermer');expect(close).toBeTruthy();expect(close.props.accessibilityLabel).toBeUndefined();
 const dismiss=pressables(tree).find(p=>p.props.accessibilityLabel==='Ignorer : Copié');
 expect(buttonText(dismiss)).toBe('Ignorer');expect(dismiss.props.accessibilityLabel).toContain(buttonText(dismiss));
 act(()=>dismiss.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));expect(dismissed).toHaveBeenCalledWith('1');
 const busy=pressables(tree).find(p=>buttonText(p)==='Confirmer· En cours');expect(busy.props.accessibilityState).toEqual({disabled:true,busy:true});
});
it('native RTL roots render translated labels with RTL writing direction',()=>{
 const tree=mount(h(HIGProvider,{locale:'ar-EG',direction:'rtl',messages:ar},h(Dialog,{open:true,onOpenChange:()=>{},title:'مراجعة',description:'تحقق من المبلغ'},h(Button,{busy:true},'تأكيد')),h(Toast,{notices:[{id:'1',message:'تم النسخ',severity:'success'}],onDismiss:()=>{}}),h(Pagination,{page:2,total:10,onPageChange:()=>{}})));
 const close=pressables(tree).find(p=>buttonText(p)==='إغلاق');expect(close).toBeTruthy();
 const label=close.findAllByType(RNText)[0];expect([].concat(label.props.style).find(s=>s&&s.writingDirection).writingDirection).toBe('rtl');
 expect(pressables(tree).find(p=>buttonText(p)==='تأكيد· جارٍ التنفيذ').props.accessibilityState.busy).toBe(true);
 const dismiss=pressables(tree).find(p=>p.props.accessibilityLabel==='تجاهل تم النسخ');expect(buttonText(dismiss)).toBe('تجاهل');
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
 expect(all).toEqual(expect.arrayContaining(['اغلق','المبلغ (مطلوب)','٥ (قديم)','الشبكة: متصل','١ نتيجة','رجوع','الجانب: اختر']));
 expect(tree.findAllByType(TextInput).map(n=>n.props.accessibilityLabel)).toEqual(['المبلغ (مطلوب)','بحث']);
 expect(tree.findAll(n=>n.props.accessibilityLabel==='الرصيد: ٥ (قديم)').length).toBeGreaterThan(0);
 const values=tree.findAll(n=>n.props.accessibilityRole==='progressbar').map(n=>n.props.accessibilityValue.text);
 expect([...new Set(values)]).toEqual(['قيد التقدم','٣ من ١٠']);
});
