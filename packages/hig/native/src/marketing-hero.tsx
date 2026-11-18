import React from 'react';
import {Link} from './button.js';
import {Stack,Heading,Text} from './surface.js';
export function MarketingHero({title,description,href,cta}: {title:string;description:string;href:string;cta:string}){return <Stack><Heading>{title}</Heading><Text>{description}</Text><Link href={href}>{cta}</Link></Stack>;}
