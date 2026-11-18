import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {ClaimRewardBlock} from '../packages/hig/react/src/blocks/claim-reward-block';

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
