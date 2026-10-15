"use client";
import React from 'react';
import {Text} from '../surface.js';
export function ActivityList({items}: {items:readonly {id:string;label:string;status:string}[]}){return items.length?<ul>{items.map(i=><li key={i.id}><strong>{i.label}</strong> — {i.status}</li>)}</ul>:<Text>No activity yet</Text>;}
