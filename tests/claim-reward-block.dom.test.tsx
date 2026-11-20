import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {ClaimRewardBlock,type ClaimRewardBlockProps} from '../packages/hig/react/src/blocks/claim-reward-block';

afterEach(cleanup);
const address='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77768';
const words={wallet:'Wallet',chain:'Chain',title:'Claim prize',claim:'Claim $20',cancel:'Cancel',claiming:'Sending your prize…',paid:'Prize paid',expired:'This prize was not claimed in time',withheld:'This prize is under review',attestationRequired:'Tick the box to claim',done:'Done'};
const attest='I accept the official rules.';
function page(overrides:Partial<ClaimRewardBlockProps>={}):ClaimRewardBlockProps{
 return {amount:20,symbol:'USDC',walletAddress:address,chain:'Base',details:[{label:'Draw',value:'#7'},{label:'Time left',value:'35m'}],labels:words,note:'Paid in USDC to your Bloxwap wallet.',status:'ready',
  attestation:{label:attest,checked:false,onCheckedChange:vi.fn(),links:[{label:'Official rules',href:'https://example.com/rules'}]},onClaim:vi.fn(),onCancel:vi.fn(),...overrides};
}
const claim=()=>screen.getByRole('button',{name:/^Claim \$20/}) as HTMLButtonElement;
const ticked=(props:ClaimRewardBlockProps)=>({...props.attestation!,checked:true});

it('offers Claim and Cancel and delegates each decision to the host',()=>{
 const props={amount:100,symbol:'USDC',walletAddress:'0x1234',chain:'Base',details:[{label:'Sweepstakes',value:'Weekly drawing'}],labels:{wallet:'Destination wallet',chain:'Chain',title:'Sweepstakes prize',claim:'Claim',cancel:'Cancel'},onClaim:vi.fn(),onCancel:vi.fn()};
 const {rerender}=render(<ClaimRewardBlock {...props}/>);
 for(const text of ['0x1234','Base','Weekly drawing']) expect(screen.getByText(text)).toBeTruthy();
 expect(screen.getAllByRole('button')).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
 expect(props.onCancel).toHaveBeenCalledOnce();
 expect(props.onClaim).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Claim'}));
 expect(props.onClaim).toHaveBeenCalledOnce();
 rerender(<ClaimRewardBlock {...props} amount={0}/>);
 expect((screen.getByRole('button',{name:'Claim'}) as HTMLButtonElement).disabled).toBe(true);
});

it('draws nothing of the claim step for a host that passes only the 0.10.0 props',()=>{
 const {container}=render(<ClaimRewardBlock amount={100} symbol='USDC' walletAddress='0x1234' chain='Base' labels={{wallet:'Wallet',chain:'Chain',title:'Prize',claim:'Claim',cancel:'Cancel'}} onClaim={()=>{}} onCancel={()=>{}}/>);
 const block=container.querySelector('.hig-claim-reward-block')!;
 expect([...block.children].map(child=>child.className)).toEqual(['hig-screen-header','hig-confirm-amount','hig-confirm-details','hig-confirm-actions']);
 expect(block.hasAttribute('data-status')).toBe(false);
 expect(screen.queryByRole('checkbox')).toBeNull();expect(screen.queryByRole('status')).toBeNull();expect(screen.queryByRole('link')).toBeNull();
 expect(container.querySelector('.hig-swap-back')).toBeNull();
 expect(screen.getByRole('button',{name:'Claim'}).hasAttribute('aria-describedby')).toBe(false);
});

it('keeps Claim unavailable, with its reason, until the attestation is ticked',()=>{
 const props=page();
 const {rerender}=render(<ClaimRewardBlock {...props}/>);
 expect(screen.getByText('#7')).toBeTruthy();expect(screen.getByText('35m')).toBeTruthy();expect(screen.getByText('Paid in USDC to your Bloxwap wallet.')).toBeTruthy();
 const box=screen.getByRole('checkbox',{name:attest}) as HTMLInputElement;
 expect(box.checked).toBe(false);
 expect(claim().disabled).toBe(true);
 expect(document.getElementById(claim().getAttribute('aria-describedby')!)?.textContent).toBe('Tick the box to claim');
 fireEvent.click(claim());expect(props.onClaim).not.toHaveBeenCalled();
 const rules=screen.getByRole('link',{name:'Official rules'});
 expect(rules.getAttribute('href')).toBe('https://example.com/rules');expect(rules.getAttribute('target')).toBe('_blank');
 fireEvent.click(box);
 expect(props.attestation!.onCheckedChange).toHaveBeenCalledWith(true);
 rerender(<ClaimRewardBlock {...props} attestation={ticked(props)}/>);
 expect(claim().disabled).toBe(false);expect(claim().hasAttribute('aria-describedby')).toBe(false);
 fireEvent.click(claim());expect(props.onClaim).toHaveBeenCalledOnce();
 // The status region is mounted and empty while ready, so the first status line is a change to announce.
 expect(screen.getByRole('status').textContent).toBe('');
});

it('holds the checkbox and Claim while the prize is being sent, and says so',()=>{
 const props=page();
 render(<ClaimRewardBlock {...props} attestation={ticked(props)} status='claiming'/>);
 expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
 expect(claim().disabled).toBe(true);expect(claim().getAttribute('aria-busy')).toBe('true');
 fireEvent.click(claim());expect(props.onClaim).not.toHaveBeenCalled();
 expect(screen.getByText('Sending your prize…').closest('[role="status"]')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(props.onCancel).toHaveBeenCalledOnce();
});

it('replaces the actions with the paid line and the transaction link',()=>{
 const props=page(),onSelect=vi.fn();
 const {rerender,container}=render(<ClaimRewardBlock {...props} attestation={ticked(props)} status='claiming'/>);
 const region=container.querySelector('.hig-claim-status')!;
 rerender(<ClaimRewardBlock {...props} attestation={ticked(props)} status='paid' transaction={{label:'View transaction',href:'https://example.com/tx/1'}}/>);
 // The same live region carries the new line.
 expect(container.querySelector('.hig-claim-status')).toBe(region);expect(region.getAttribute('role')).toBe('status');expect(region.textContent).toBe('Prize paid');
 expect(container.querySelector('.hig-claim-reward-block')!.getAttribute('data-status')).toBe('paid');
 expect(screen.queryByRole('checkbox')).toBeNull();expect(screen.queryByRole('button',{name:/Claim/})).toBeNull();expect(screen.queryByRole('button',{name:'Cancel'})).toBeNull();
 expect(screen.getByRole('link',{name:'View transaction'}).getAttribute('href')).toBe('https://example.com/tx/1');
 fireEvent.click(screen.getByRole('button',{name:'Done'}));expect(props.onCancel).toHaveBeenCalledOnce();
 rerender(<ClaimRewardBlock {...props} status='paid' labels={{...words,done:undefined}} transaction={{label:'View transaction',href:'https://example.com/tx/1',onSelect}}/>);
 expect(screen.queryAllByRole('button')).toHaveLength(0);
 const event=new MouseEvent('click',{bubbles:true,cancelable:true});
 screen.getByRole('link',{name:'View transaction'}).dispatchEvent(event);
 expect(onSelect).toHaveBeenCalledOnce();expect(event.defaultPrevented).toBe(true);
});

it.each([['expired','This prize was not claimed in time'],['withheld','This prize is under review']] as const)('shows the %s line and no way to claim',(status,line)=>{
 const props=page();
 render(<ClaimRewardBlock {...props} status={status} error='Ignored once final' transaction={{label:'View transaction',href:'https://example.com/tx/1'}}/>);
 expect(screen.getByRole('status').textContent).toBe(line);
 expect(screen.queryByRole('button',{name:/Claim/})).toBeNull();expect(screen.queryByRole('checkbox')).toBeNull();
 expect(screen.queryByRole('alert')).toBeNull();expect(screen.queryByRole('link')).toBeNull();
 expect(screen.getAllByRole('button').map(button=>button.textContent)).toEqual(['Done']);
});

it('shows a failed claim as an alert and leaves Claim available for another try',()=>{
 const props=page();
 render(<ClaimRewardBlock {...props} attestation={ticked(props)} error='The payout could not be sent. Try again.'/>);
 const alert=screen.getByRole('alert');
 expect(alert.textContent).toBe('The payout could not be sent. Try again.');
 expect(alert.compareDocumentPosition(claim())&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(claim().disabled).toBe(false);
 fireEvent.click(claim());expect(props.onClaim).toHaveBeenCalledOnce();
});

it('draws Back in the header and names the heading for a host dialog',()=>{
 const onBack=vi.fn();
 render(<ClaimRewardBlock {...page()} onBack={onBack} headingId='claim-heading' backProps={{'data-testid':'claim-back'} as ClaimRewardBlockProps['backProps']} stickyHeader/>);
 expect(screen.getByRole('heading',{name:'Claim prize'}).id).toBe('claim-heading');
 const back=screen.getByTestId('claim-back');
 expect(back.getAttribute('aria-label')).toBe('Back');
 fireEvent.click(back);expect(onBack).toHaveBeenCalledOnce();
 expect(document.querySelector('.hig-screen-header')!.getAttribute('data-sticky')).toBe('true');
});
