"use client";
import React from 'react';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from '../provider.js';
import {Text} from '../surface.js';
export function ActivityList({items}: {items:readonly {id:string;label:string;status:string}[]}){const {messages}=useHIG();return items.length?<ul>{items.map(i=><li key={i.id}><strong>{i.label}</strong> — {i.status}</li>)}</ul>:<Text>{messages.noActivity??en.noActivity}</Text>;}
