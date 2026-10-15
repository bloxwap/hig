"use client";
import React from 'react';
import {Surface,Text} from '../surface.js';
import {Usd} from '../data.js';
export function BalanceCard({label,balance,stale}: {label:string;balance:number|null;stale?:boolean}){return <Surface><Text>{label}</Text><Usd value={balance} stale={stale}/></Surface>;}
