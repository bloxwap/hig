import React from 'react';
/** Visible string content of a node tree, for announcements and script detection. */
export function plainText(children:React.ReactNode):string{return React.Children.toArray(children).map(child=>typeof child==='string'||typeof child==='number'?String(child):React.isValidElement<{children?:React.ReactNode}>(child)?plainText(child.props.children):'').filter(Boolean).join(' ');}
