import React from 'react';
import {afterEach,describe,it,expect} from 'vitest';
import {render,screen,cleanup,within} from '@testing-library/react';
import {defaultMessages,type HIGMessages} from '@bloxwap/hig-contracts';
import {HIGProvider} from '../packages/react/src/provider';
import {Button} from '../packages/react/src/button';
import {Dialog,AlertDialog} from '../packages/react/src/overlay';
import {Toast,Spinner,StatusIndicator} from '../packages/react/src/status';
import {Pagination,Search} from '../packages/react/src/navigation';
import {Field,Input} from '../packages/react/src/field';
import {Usd} from '../packages/react/src/data';
import {TradeEntry,InstallCommand} from '../packages/react/src/recipes';
afterEach(cleanup);
// Test-only strings: HIG ships English; approved product translations belong to the host (#62).
const locales:Record<string,{direction:'ltr'|'rtl';messages:Partial<HIGMessages>}>={
 'fr-FR':{direction:'ltr',messages:{close:'Fermer',cancel:'Annuler',dismiss:'Ignorer',dismissNotice:(message,dismiss)=>`${dismiss} : ${message}`,busy:'En cours',pageOf:(page,total)=>`Page ${page} sur ${total}`,required:label=>`${label} (obligatoire)`,staleValue:value=>`${value} (périmé)`}},
 'ko-KR':{direction:'ltr',messages:{close:'닫기',cancel:'취소',dismiss:'닫기',dismissNotice:(message,dismiss)=>`${message} ${dismiss}`,busy:'처리 중',pageOf:(page,total)=>`${total}페이지 중 ${page}페이지`,required:label=>`${label} (필수)`,staleValue:value=>`${value} (오래됨)`}},
 'ar-EG':{direction:'rtl',messages:{close:'إغلاق',cancel:'إلغاء',dismiss:'تجاهل',dismissNotice:(message,dismiss)=>`${dismiss} ${message}`,busy:'جارٍ التنفيذ',pageOf:(page,total)=>`الصفحة ${page} من ${total}`,required:label=>`${label} (مطلوب)`,staleValue:value=>`${value} (قديم)`}},
};
describe('Localized built-in strings (#62)',()=>{
 for(const [locale,{direction,messages}] of Object.entries(locales)){
  it(`renders translated Close, Dismiss and busy labels in ${locale} (${direction})`,()=>{
   const {container}=render(<HIGProvider locale={locale} direction={direction} messages={messages}>
    <Button busy>OK</Button>
    <Toast notices={[{id:'1',message:'Copié',severity:'success'}]} onDismiss={()=>{}}/>
    <Pagination page={2} total={5} onPageChange={()=>{}}/>
    <Field label='Montant' required><Input/></Field>
    <Usd value={1} stale label='Solde'/>
   </HIGProvider>);
   const root=container.firstElementChild as HTMLElement;expect(root.dir).toBe(direction);expect(root.lang).toBe(locale);
   const busy=screen.getByRole('button',{name:`OK · ${messages.busy}`});expect(busy.getAttribute('aria-busy')).toBe('true');expect(busy.textContent).toBe(`OK · ${messages.busy}`);
   const dismiss=screen.getByRole('button',{name:messages.dismissNotice!('Copié',messages.dismiss!)});expect(dismiss.textContent).toBe(messages.dismiss);
   expect(screen.getByText(messages.pageOf!(2,5))).toBeTruthy();
   expect(screen.getByLabelText(messages.required!('Montant'))).toBeTruthy();
   expect(container.querySelector('.hig-number')?.getAttribute('aria-label')).toBe(`Solde: ${messages.staleValue!(new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(1))}`);
   for(const english of ['Close','Dismiss','Working','(required)','(stale)'])expect(document.body.textContent).not.toContain(english);
   cleanup();render(<HIGProvider locale={locale} direction={direction} messages={messages}><Dialog open onOpenChange={()=>{}} title='T' description='D'><p>Body</p></Dialog></HIGProvider>);
   const dialog=screen.getByRole('dialog');expect(within(dialog).getByRole('button',{name:messages.close}).textContent).toBe(messages.close);
   for(const english of ['Close','Dismiss','Working','(required)','(stale)'])expect(document.body.textContent).not.toContain(english);
  });
 }
 it('lets a component override the provider and hides an empty busy suffix',()=>{
  render(<HIGProvider messages={locales['fr-FR'].messages}>
   <Button busy busyLabel=''>Envoyer</Button><Button busy busyLabel='Patientez'>Payer</Button>
   <Toast notices={[{id:'1',message:'Copié',severity:'success'}]} onDismiss={()=>{}} dismissLabel='Masquer'/>
  </HIGProvider>);
  const silent=screen.getByRole('button',{name:'Envoyer'});expect(silent.getAttribute('aria-busy')).toBe('true');expect(silent.querySelector('.hig-busy')).toBeNull();
  expect(screen.getByRole('button',{name:'Payer · Patientez'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Masquer : Copié'}).textContent).toBe('Masquer');
  cleanup();render(<HIGProvider messages={locales['fr-FR'].messages}><AlertDialog open onOpenChange={()=>{}} title='T' description='D' closeLabel='Retour'><p>Body</p></AlertDialog></HIGProvider>);
  expect(within(screen.getByRole('alertdialog')).getByRole('button',{name:'Retour'})).toBeTruthy();
 });
 it('inherits outer provider messages, falls back to English for missing keys and localizes recipes',()=>{
  render(<HIGProvider messages={{close:'Fermer',reviewOrder:'Vérifier l’ordre',tradeHeading:asset=>`Ordre ${asset}`,amountLabel:asset=>`Montant (${asset})`,copyInstallCommand:'Copier la commande',noResults:'Aucun résultat',search:'Rechercher',statusState:s=>({online:'en ligne',offline:'hors ligne',stale:'périmé'})[s],labelledValue:(l,v)=>`${l} : ${v}`}}>
   <HIGProvider density='compact' messages={{busy:'En cours'}}>
    <TradeEntry asset='BTC' amount='1' onAmountChange={()=>{}} onConfirm={()=>{}} available='2 BTC' busy/>
    <InstallCommand command='npm ci' onCopy={()=>{}}/>
    <Search query='x' onQueryChange={()=>{}} results={[]}/>
    <StatusIndicator label='Flux' state='online'/>
    <Spinner/>
   </HIGProvider>
  </HIGProvider>);
  expect(screen.getByRole('heading',{name:'Ordre BTC'})).toBeTruthy();
  expect(screen.getByLabelText('Montant (BTC)')).toBeTruthy();
  expect(screen.getByRole('button',{name:'Vérifier l’ordre · En cours'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Copier la commande'})).toBeTruthy();
  expect(screen.getByLabelText('Rechercher')).toBeTruthy();expect(screen.getByText('Aucun résultat')).toBeTruthy();
  expect(screen.getByText('Flux : en ligne')).toBeTruthy();
  expect(screen.getByText(`${defaultMessages.loading}…`)).toBeTruthy();
 });
});
