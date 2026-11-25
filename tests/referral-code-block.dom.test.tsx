// @vitest-environment jsdom
import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {ReferralCodeBlock,type ReferralCodeLabels} from '../packages/hig/react/src/blocks/referral-code-block';
import {normalizeReferralCode,referralProgress,referralStage} from '../packages/hig/contracts/src/referral';
afterEach(cleanup);
const labels:ReferralCodeLabels={title:'Referral code',volume:'Traded volume',goal:g=>'of '+g,remaining:r=>r+' to go',unlocked:'Unlocked',field:'Your code',set:'Set code',
 confirmTitle:c=>'Set '+c+'?',oneTime:'One time only',confirmWarning:'Cannot be changed',acknowledge:'I understand',confirm:'Confirm code',cancel:'Back',yourCode:'Your referral code',copy:'Copy code',copied:'Copied',share:'Share link'};
it('picks the stage from volume, goal and code',()=>{
 expect(referralStage(6250,10000,null)).toBe('progress');
 expect(referralStage(null,10000,null)).toBe('progress');
 expect(referralStage(10000,10000,undefined)).toBe('create');
 expect(referralStage(500,10000,'BLOX')).toBe('share');
 expect(referralProgress(6250,10000)).toBe(.625);expect(referralProgress(20000,10000)).toBe(1);expect(referralProgress(null,10000)).toBe(0);expect(referralProgress(5,0)).toBe(0);
 expect(normalizeReferralCode(' bl-ox 99!')).toBe('BLOX99');expect(normalizeReferralCode('a'.repeat(30))).toHaveLength(20);
});
it('shows the volume as a progress bar with what is left to trade',()=>{
 render(<ReferralCodeBlock volume={6250} goal={10000} labels={labels} onSetCode={()=>{}}/>);
 const bar=screen.getByRole('progressbar',{name:'Traded volume'});
 expect(bar.getAttribute('aria-valuenow')).toBe('63');
 expect(screen.getByText('of $10,000')).toBeTruthy();
 expect(screen.getByText('$3,750 to go')).toBeTruthy();
 expect(screen.queryByLabelText(/Your code/)).toBeNull();
});
it('sets the code once, only after the acknowledgement',async()=>{
 const onSetCode=vi.fn();
 const view=render(<ReferralCodeBlock volume={12000} goal={10000} labels={labels} onSetCode={onSetCode}/>);
 const input=screen.getByLabelText(/Your code/) as HTMLInputElement;
 fireEvent.change(input,{target:{value:'blox!'}});
 expect(input.value).toBe('BLOX');
 fireEvent.click(screen.getByRole('button',{name:'Set code'}));
 expect(screen.getByRole('heading',{name:'Set BLOX?'})).toBeTruthy();
 const confirm=screen.getByRole('button',{name:'Confirm code'}) as HTMLButtonElement;
 expect(confirm.disabled).toBe(true);
 fireEvent.click(screen.getByRole('checkbox',{name:'I understand'}));
 expect(confirm.disabled).toBe(false);
 await act(async()=>{fireEvent.click(confirm);});
 expect(onSetCode).toHaveBeenCalledWith('BLOX');
 view.rerender(<ReferralCodeBlock volume={12000} goal={10000} code='BLOX' labels={labels} onSetCode={onSetCode}/>);
 expect(screen.getByText('BLOX')).toBeTruthy();
 expect(screen.queryByRole('checkbox')).toBeNull();
});
it('shares the code and its link and reads Copied after a copy',async()=>{
 const onCopy=vi.fn(),onShare=vi.fn();
 render(<ReferralCodeBlock volume={12000} goal={10000} code='BLOX' shareUrl='https://app.hyperliquid.xyz/join/BLOX' labels={labels} onSetCode={()=>{}} onCopy={onCopy} onShare={onShare}/>);
 expect(screen.getByText('app.hyperliquid.xyz/join/BLOX')).toBeTruthy();
 await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Copy code'}));});
 expect(onCopy).toHaveBeenCalledWith('BLOX');
 expect(screen.getByRole('button',{name:'Copied'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Share link'}));
 expect(onShare).toHaveBeenCalledWith('BLOX','https://app.hyperliquid.xyz/join/BLOX');
});
const rewardLabels={title:'Referral rewards',claim:'Claim to account',minimum:(m:string)=>'Claim once you have '+m+' or more.',note:'Paid to your account.'};
it('claims rewards at or above the minimum, and says why below it',async()=>{
 const {referralClaimable}=await import('../packages/hig/contracts/src/referral');
 expect(referralClaimable(1)).toBe(true);expect(referralClaimable(.99)).toBe(false);expect(referralClaimable(null)).toBe(false);expect(referralClaimable(0,0)).toBe(false);
 const onClaim=vi.fn();
 const block=(balance:number|null,extra={})=><ReferralCodeBlock volume={12000} goal={10000} code='BLOX' labels={labels} onSetCode={()=>{}} rewards={{balance,onClaim,labels:rewardLabels,...extra}}/>;
 const view=render(block(48.62));
 expect(screen.getByText('Referral rewards')).toBeTruthy();expect(screen.getByText('USDC')).toBeTruthy();expect(screen.getByText('Paid to your account.')).toBeTruthy();
 await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Claim to account'}));});
 expect(onClaim).toHaveBeenCalledTimes(1);
 view.rerender(block(.42));
 expect((screen.getByRole('button',{name:'Claim to account'}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getByText('Claim once you have $1 or more.')).toBeTruthy();
 view.rerender(block(48.62,{error:'Claim failed'}));
 expect(screen.getByRole('alert').textContent).toContain('Claim failed');
 view.rerender(<ReferralCodeBlock volume={6000} goal={10000} labels={labels} onSetCode={()=>{}} rewards={{balance:48.62,onClaim,labels:rewardLabels}}/>);
 expect(screen.queryByText('Referral rewards')).toBeNull();
});
