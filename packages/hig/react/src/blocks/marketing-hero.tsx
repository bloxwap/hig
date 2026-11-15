"use client";
import React from 'react';
import {Link} from '../button.js';
import {Heading,Text} from '../surface.js';
export function MarketingHero({title,description,href,cta}: {title:string;description:string;href:string;cta:string}){return <section><Heading level={1}>{title}</Heading><Text>{description}</Text><Link href={href}>{cta}</Link></section>;}
