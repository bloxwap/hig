const React=require('react');
const {create,act}=require('react-test-renderer');
const {TextInput}=require('react-native');
const {HIGProvider}=require('../../packages/native/src/provider');
const {Button}=require('../../packages/native/src/button');
const {Dialog,Menu}=require('../../packages/native/src/overlay');
const {Toast,Progress,StatusIndicator}=require('../../packages/native/src/status');
const {Pagination,Search,BackButton}=require('../../packages/native/src/navigation');
const {Field,AmountInput}=require('../../packages/native/src/field');
const {NumberReadout}=require('../../packages/native/src/data');
const {Select}=require('../../packages/native/src/select');
const {TradeEntry,InstallCommand}=require('../../packages/native/src/recipes');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
const h=React.createElement;
function mount(element){act(()=>{root=create(element);});return root.root;}
const text=()=>JSON.stringify(root.toJSON());
const buttons=tree=>tree.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.onPress==='function'&&typeof n.type!=='string');
// Test-only strings: HIG ships English; approved product translations belong to the host (#62).
const locales={
 'fr-FR':{direction:'ltr',messages:{close:'Fermer',dismiss:'Ignorer',dismissNotice:(m,d)=>`${d} : ${m}`,busy:'En cours',pageOf:(p,t)=>`Page ${p} sur ${t}`,required:l=>`${l} (obligatoire)`,staleValue:v=>`${v} (périmé)`,previous:'Précédent',next:'Suivant'}},
 'ko-KR':{direction:'ltr',messages:{close:'닫기',dismiss:'닫기',dismissNotice:(m,d)=>`${m} ${d}`,busy:'처리 중',pageOf:(p,t)=>`${t}페이지 중 ${p}페이지`,required:l=>`${l} (필수)`,staleValue:v=>`${v} (오래됨)`,previous:'이전',next:'다음'}},
 'ar-EG':{direction:'rtl',messages:{close:'إغلاق',dismiss:'تجاهل',dismissNotice:(m,d)=>`${d} ${m}`,busy:'جارٍ التنفيذ',pageOf:(p,t)=>`الصفحة ${p} من ${t}`,required:l=>`${l} (مطلوب)`,staleValue:v=>`${v} (قديم)`,previous:'السابق',next:'التالي'}},
};
for(const [locale,{direction,messages}] of Object.entries(locales)){
 it(`native renders translated Close, Dismiss and busy labels in ${locale} (${direction})`,()=>{
  const tree=mount(h(HIGProvider,{locale,direction,messages},
   h(Button,{busy:true},'OK'),
   h(Toast,{notices:[{id:'1',message:'Copié',severity:'success'}],onDismiss:()=>{}}),
   h(Pagination,{page:2,total:5,onPageChange:()=>{}}),
   h(Field,{label:'Montant',required:true},h(AmountInput,{value:'1'})),
   h(NumberReadout,{value:1,stale:true,label:'Solde'}),
   h(Dialog,{open:true,onOpenChange:()=>{},title:'T',description:'D'},null)));
  const output=text();
  expect(output).toContain(` · ${messages.busy}`);expect(buttons(tree)[0].props.accessibilityState.busy).toBe(true);
  const dismiss=tree.findAll(n=>n.props.accessibilityLabel===messages.dismissNotice('Copié',messages.dismiss));expect(dismiss.length).toBeGreaterThan(0);
  expect(output).toContain(messages.pageOf(2,5));expect(output).toContain(messages.close);
  expect(tree.findByType(TextInput).props.accessibilityLabel).toBe(messages.required('Montant'));
  expect(tree.findAll(n=>typeof n.props.accessibilityLabel==='string'&&n.props.accessibilityLabel.startsWith('Solde: ')&&n.props.accessibilityLabel.endsWith(messages.staleValue('').trim())).length).toBeGreaterThan(0);
  for(const english of ['"Close"','"Dismiss"','Working','(required)','(stale)','Previous','Next'])expect(output).not.toContain(english);
 });
}
it('native component overrides win and an empty busy label leaves only the busy state',()=>{
 const tree=mount(h(HIGProvider,{messages:locales['fr-FR'].messages},
  h(Button,{busy:true,busyLabel:''},'Envoyer'),
  h(Toast,{notices:[{id:'1',message:'Copié',severity:'info'}],onDismiss:()=>{},dismissLabel:'Masquer'}),
  h(BackButton,{onBack:()=>{},label:'Retour'}),
  h(Dialog,{open:true,onOpenChange:()=>{},title:'T',description:'D',closeLabel:'Terminé'},null)));
 const output=text();
 expect(output).not.toContain(' · ');expect(buttons(tree)[0].props.accessibilityState.busy).toBe(true);
 expect(tree.findAll(n=>n.props.accessibilityLabel==='Masquer : Copié').length).toBeGreaterThan(0);
 expect(output).toContain('Retour');expect(output).toContain('Terminé');expect(output).not.toContain('Fermer');
});
it('native nested providers inherit messages and recipes use them',()=>{
 const tree=mount(h(HIGProvider,{direction:'rtl',messages:{reviewOrder:'مراجعة الطلب',tradeHeading:a=>`طلب ${a}`,amountLabel:a=>`المبلغ (${a})`,copyInstallCommand:'نسخ الأمر',availableActions:'الإجراءات',choose:'اختر',labelledValue:(l,v)=>`${l}: ${v}`,statusState:s=>({online:'متصل',offline:'غير متصل',stale:'قديم'})[s],inProgress:'قيد التنفيذ',searching:'جارٍ البحث…',search:'بحث'}},
  h(HIGProvider,{direction:'rtl',messages:{busy:'جارٍ التنفيذ'}},
   h(TradeEntry,{asset:'BTC',amount:'1',onAmountChange:()=>{},onConfirm:()=>{},available:'2 BTC',busy:true}),
   h(InstallCommand,{command:'npm ci',onCopy:()=>{}}),
   h(Menu,{label:'Plus',items:[]}),
   h(Select,{label:'Côté',options:[{value:'buy',label:'Achat'}]}),
   h(StatusIndicator,{label:'Flux',state:'online'}),
   h(Progress,{label:'Envoi'}),
   h(Search,{query:'x',onQueryChange:()=>{},results:[],loading:true}))));
 const output=text();
 for(const expected of ['طلب BTC','مراجعة الطلب',' · جارٍ التنفيذ','نسخ الأمر','Côté: اختر','Flux: متصل','جارٍ البحث…'])expect(output).toContain(expected);
 expect(tree.findAll(n=>n.props.accessibilityValue?.text==='قيد التنفيذ').length).toBeGreaterThan(0);
 expect(tree.findAll(n=>n.props.accessibilityLabel==='المبلغ (BTC)').length).toBeGreaterThan(0);
});
