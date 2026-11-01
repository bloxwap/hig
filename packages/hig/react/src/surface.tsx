import React from 'react';
export function Text(props:React.HTMLAttributes<HTMLParagraphElement>){return <p {...props} className={`hig-text ${props.className??''}`}/>;}
export function Heading({level=2,...props}:React.HTMLAttributes<HTMLHeadingElement> & {level?:1|2|3|4|5|6}){return React.createElement(`h${level}`,{...props,className:`hig-heading ${props.className??''}`});}
export function Stack(props:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className={`hig-stack ${props.className??''}`}/>;}
export function Inline(props:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className={`hig-inline ${props.className??''}`}/>;}
export function Surface(props:React.HTMLAttributes<HTMLDivElement>){return <div {...props} className={`hig-surface ${props.className??''}`}/>;}
export const Card=Surface;
export function Separator(props:React.HTMLAttributes<HTMLHRElement>){return <hr {...props} className={`hig-separator ${props.className??''}`}/>;}
