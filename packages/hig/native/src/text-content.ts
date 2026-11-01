import React from 'react';
function concat(children:React.ReactNode):string{return React.Children.toArray(children).map(child=>typeof child==='string'||typeof child==='number'?String(child):React.isValidElement<{children?:React.ReactNode}>(child)?concat(child.props.children):'').join('');}
/** Visible string content of a node tree, for announcements, accessible names and script detection. Text nodes are concatenated as rendered (no separator is added) and whitespace runs collapse to one space, so `<>Display-only <Text>value</Text> strings</>` reads `Display-only value strings`. */
export function plainText(children:React.ReactNode):string{return concat(children).replace(/\s+/gu,' ').trim();}
/** Text of children laid out as separate blocks (siblings in a View, such as an Alert body): each top-level child is read as its own run, joined by a space. */
export function blockText(children:React.ReactNode):string{return React.Children.toArray(children).map(plainText).filter(Boolean).join(' ');}
