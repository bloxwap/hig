"use client";
import React from 'react';
import {Surface,Text} from '../surface.js';
export function CodeWindow({language,children}:React.PropsWithChildren<{language:string}>){return <Surface><Text>{language}</Text><pre tabIndex={0}><code>{children}</code></pre></Surface>;}
