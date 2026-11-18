import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {PositionsBlock,type OpenPosition} from '../packages/hig/react/src/blocks/positions-block';

it('filters by net P&L while Close All refers to every open position',()=>{
 const positions:OpenPosition[]=[{id:'a',name:'Bitcoin',side:'long',pnl:-.08,pnlPercent:-.1483},{id:'b',name:'Ether',side:'short',pnl:4},{id:'c',name:'Flat',side:'long',pnl:0}];
 const select=vi.fn(),close=vi.fn();
 const props={labels:{title:'Positions',all:'All',wins:'Wins',losses:'Losses',empty:'No matching positions',long:'Long',short:'Short',closeAll:(n:number)=>`Close All (${n})`},positions,onSelect:select,onCloseAll:close};
 const {rerender}=render(<PositionsBlock {...props}/>);
 expect(screen.getAllByRole('listitem')).toHaveLength(3);
 expect(screen.getByRole('list').contains(screen.getByRole('button',{name:'Close All (3)'}))).toBe(false);
 fireEvent.click(screen.getByRole('radio',{name:'Losses'}));
 expect(screen.getAllByRole('listitem')).toHaveLength(1);
 expect(screen.queryByText('Ether')).toBeNull();expect(screen.queryByText('Flat')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Bitcoin/}));expect(select).toHaveBeenCalledWith(positions[0]);
 fireEvent.click(screen.getByRole('radio',{name:'Wins'}));
 expect(screen.getByText('Ether')).toBeTruthy();expect(screen.queryByText('Bitcoin')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Close All (3)'}));expect(close).toHaveBeenCalledTimes(1);
 rerender(<PositionsBlock {...props} positions={[]}/>);
 expect(screen.queryByRole('list')).toBeNull();
 expect(screen.getByText('No matching positions')).toBeTruthy();
 expect((screen.getByRole('button',{name:'Close All (0)'}) as HTMLButtonElement).disabled).toBe(true);
});
