'use client';
import React,{useState} from 'react';
import {HIGProvider} from '@bloxwap/hig-react/provider';
import {Button} from '@bloxwap/hig-react/button';
import {Field,AmountInput} from '@bloxwap/hig-react/field';
import {NumberReadout} from '@bloxwap/hig-react/data';
export function Client(){const [amount,setAmount]=useState('0.01');const [count,setCount]=useState(0);return <HIGProvider><Field label='Amount (BTC)' description='Host validates raw precision'><AmountInput value={amount} onChange={e=>setAmount(e.target.value)}/></Field><Button onClick={()=>setCount(count+1)}>Review order</Button><p role='status'>Accepted: {count}</p><p>Mark price <NumberReadout value={67234.56}/></p></HIGProvider>;}
