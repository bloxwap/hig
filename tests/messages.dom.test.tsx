import React from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,cleanup,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {HIGMessages} from '@bloxwap/hig-contracts/messages';
import {HIGProvider,useMessages} from '../packages/react/src/provider';
import {Button} from '../packages/react/src/button';
import {Dialog,AlertDialog,Popover} from '../packages/react/src/overlay';
import {Toast,Spinner} from '../packages/react/src/status';
import {Pagination} from '../packages/react/src/navigation';
import {Field,Input} from '../packages/react/src/field';
import {NumberReadout,List} from '../packages/react/src/data';
afterEach(cleanup);
// Test fixtures only: HIG approves no translation locale, hosts own these catalogs.
const fr:Partial<HIGMessages>={close:'Fermer',cancel:'Annuler',dismiss:'Ignorer',busy:'En cours',dismissNotice:(message,dismiss)=>`${dismiss} : ${message}`};
const ar:Partial<HIGMessages>={close:'إغلاق',cancel:'إلغاء',dismiss:'تجاهل',busy:'جارٍ التنفيذ',dismissNotice:(message,dismiss)=>`${dismiss} ${message}`,pagination:'ترقيم الصفحات',previous:'السابق',next:'التالي',pageOf:(page,total)=>`الصفحة ${page} من ${total}`,stale:'(قديم)',required:'(مطلوب)',retry:'إعادة المحاولة',loadingItems:'جارٍ تحميل العناصر',loading:'جارٍ التحميل'};
const notices=[{id:'1',message:'Copié',severity:'success' as const}];

describe('translated built-in strings (web)',()=>{
 it('renders English defaults without a provider',()=>{
  render(<Dialog open onOpenChange={()=>{}} title='Review' description='Verify amount'><p/></Dialog>);
  expect(within(screen.getByRole('dialog')).getByRole('button',{name:'Close'})).toBeTruthy();
  cleanup();
  render(<><Toast notices={[{id:'1',message:'Copied',severity:'success'}]} onDismiss={()=>{}}/><Button busy>Confirm</Button></>);
  expect(screen.getByRole('button',{name:'Dismiss Copied'}).textContent).toBe('Dismiss');
  expect(screen.getByRole('button',{name:'Confirm · Working'})).toBeTruthy();
 });
 it('uses provider messages for Close, Cancel, Dismiss and busy with visible text equal to the accessible name',async()=>{
  const dismiss=vi.fn();
  render(<HIGProvider locale='fr-FR' messages={fr}><Dialog open onOpenChange={()=>{}} title='Vérifier' description='Montant'><p/></Dialog></HIGProvider>);
  const close=within(screen.getByRole('dialog')).getByRole('button',{name:'Fermer'});
  expect(close.textContent).toBe('Fermer');
  cleanup();
  render(<HIGProvider locale='fr-FR' messages={fr}><Toast notices={notices} onDismiss={dismiss}/><Button busy>Confirmer</Button><Popover label='Aide'><p>Texte</p></Popover></HIGProvider>);
  const ignore=screen.getByRole('button',{name:'Ignorer : Copié'});
  expect(ignore.textContent).toBe('Ignorer');
  expect(ignore.getAttribute('aria-label')).toContain(ignore.textContent);
  await userEvent.click(ignore);expect(dismiss).toHaveBeenCalledWith('1');
  const busy=screen.getByRole('button',{name:'Confirmer · En cours'});
  expect(busy.getAttribute('aria-busy')).toBe('true');
  expect(within(busy).getByRole('status').textContent).toBe(' · En cours');
  await userEvent.click(screen.getByRole('button',{name:'Aide'}));
  expect(screen.getByRole('button',{name:'Fermer'}).textContent).toBe('Fermer');
  expect(document.body.textContent).not.toMatch(/Close|Dismiss|Working/);
  cleanup();
  render(<HIGProvider messages={fr}><AlertDialog open onOpenChange={()=>{}} title='Supprimer' description='Irréversible'><p/></AlertDialog></HIGProvider>);
  expect(within(screen.getByRole('alertdialog')).getByRole('button',{name:'Annuler'})).toBeTruthy();
 });
 it('renders translated labels in RTL, inside portals too',()=>{
  render(<HIGProvider locale='ar-EG' direction='rtl' messages={ar}><Dialog open onOpenChange={()=>{}} title='مراجعة' description='تحقق من المبلغ'><Button busy>تأكيد</Button></Dialog></HIGProvider>);
  const dialog=screen.getByRole('dialog');
  expect(dialog.getAttribute('dir')).toBe('rtl');expect(dialog.getAttribute('lang')).toBe('ar-EG');
  expect(within(dialog).getByRole('button',{name:'إغلاق'}).textContent).toBe('إغلاق');
  expect(within(dialog).getByRole('button',{name:'تأكيد · جارٍ التنفيذ'}).getAttribute('aria-busy')).toBe('true');
  cleanup();
  render(<HIGProvider locale='ar-EG' direction='rtl' messages={ar}><Toast notices={[{id:'1',message:'تم النسخ',severity:'success'}]} onDismiss={()=>{}}/><Pagination page={2} total={10} onPageChange={()=>{}}/></HIGProvider>);
  const dismiss=screen.getByRole('button',{name:'تجاهل تم النسخ'});
  expect(dismiss.textContent).toBe('تجاهل');expect(dismiss.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
  const nav=screen.getByRole('navigation',{name:'ترقيم الصفحات'});
  expect(within(nav).getByText('الصفحة ٢ من ١٠')).toBeTruthy();
  expect(within(nav).getByRole('button',{name:'السابق'})).toBeTruthy();
 });
 it('lets per-component props override the provider and keeps busy state when the suffix is hidden',()=>{
  render(<HIGProvider messages={fr}><Dialog open onOpenChange={()=>{}} title='T' description='D' closeLabel='Terminé'><Button busy busyLabel=''>Envoyer</Button><Button busy busyLabel='Envoi'>Payer</Button></Dialog></HIGProvider>);
  const dialog=screen.getByRole('dialog');
  expect(within(dialog).getByRole('button',{name:'Terminé'})).toBeTruthy();
  expect(within(dialog).queryByRole('button',{name:'Fermer'})).toBeNull();
  const quiet=within(dialog).getByRole('button',{name:'Envoyer'});
  expect(quiet.getAttribute('aria-busy')).toBe('true');expect(quiet.querySelector('[role=status]')).toBeNull();
  expect(within(dialog).getByRole('button',{name:'Payer · Envoi'})).toBeTruthy();
  cleanup();
  render(<HIGProvider messages={fr}><Toast notices={notices} onDismiss={()=>{}} dismissLabel='Masquer'/></HIGProvider>);
  const masked=screen.getByRole('button',{name:'Masquer : Copié'});expect(masked.textContent).toBe('Masquer');
 });
 it('keeps translations through nested providers and translates markers in visible text and names',()=>{
  function Probe(){return <output>{useMessages().close}</output>;}
  render(<HIGProvider direction='rtl' locale='ar-EG' messages={ar}><HIGProvider density='compact' direction='rtl' locale='ar-EG' messages={{close:'اغلق'}}><Probe/><Field label='المبلغ' required><Input/></Field><NumberReadout label='الرصيد' value={5} stale/><List items={[]} keyFor={String} render={String} loading error='خطأ' onRetry={()=>{}}/><Spinner/></HIGProvider></HIGProvider>);
  expect(screen.getByText('اغلق')).toBeTruthy();
  expect(screen.getByRole('textbox',{name:'المبلغ (مطلوب)'})).toBeTruthy();
  expect(screen.getByLabelText('الرصيد: ٥ (قديم)').textContent).toBe('٥ (قديم)');
  expect(screen.getByRole('button',{name:'إعادة المحاولة'})).toBeTruthy();
  expect(screen.getByText('جارٍ تحميل العناصر')).toBeTruthy();
  expect(screen.getByText('جارٍ التحميل…')).toBeTruthy();
 });
});
