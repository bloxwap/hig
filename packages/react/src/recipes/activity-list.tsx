"use client";
import React from 'react';
import {Text} from '../surface.js';
import {useMessages} from '../provider.js';
import * as en from '@bloxwap/hig-contracts/messages';
export function ActivityList({items}: {items:readonly {id:string;label:string;status:string}[]}){const messages=useMessages();return items.length?<ul>{items.map(i=><li key={i.id}><strong>{i.label}</strong> — {i.status}</li>)}</ul>:<Text>{(messages.noActivity??en.noActivity)}</Text>;}
