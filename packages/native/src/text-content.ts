import React from 'react';
/** Visible string content of a node tree, for announcements and script detection. */
export function plainText(children:React.ReactNode):string{
 const collect=(nodes:React.ReactNode):string=>React.Children.toArray(nodes).map(child=>typeof child==='string'||typeof child==='number'?String(child):React.isValidElement<{children?:React.ReactNode}>(child)?collect(child.props.children):'').join('');
 return collect(children).replace(/\s+/g,' ').trim();
}
