"use client";
import React from 'react';
import {Button} from '../button.js';
import {Row,Usd,Percent} from '../data.js';
export function MarketRow({symbol,name,price,change,onSelect}: {symbol:string;name:string;price:number|null;change:number|null;onSelect:()=>void}){return <Row><Button intent='ghost' onClick={onSelect}>{name} ({symbol})</Button><Usd value={price}/><Percent value={change}/></Row>;}
