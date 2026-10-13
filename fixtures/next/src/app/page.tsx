import React from 'react';
import {formatNumber} from '@bloxwap/hig-contracts';
import {Client} from './client';
export default function Page(){return <main><h1>SSR + client boundary</h1><p>Server display: {formatNumber(1250.45)}</p><Client/></main>;}
