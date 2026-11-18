import type {ComponentPropsWithRef} from 'react';

type DivProps=ComponentPropsWithRef<'div'>;

// Fumadocs provides the outer dimensions and the classes for the single content wrapper.
export function Root({type:_type,...props}:DivProps & {type?:string}){
  return <div {...props}/>;
}
export function Viewport({children,style,...props}:DivProps){
  return <div tabIndex={0} role="region" aria-label="Documentation navigation" {...props}
    style={{overflowY:'auto',overflowX:'hidden',scrollbarWidth:'thin',...style}}>
    <div>{children}</div>
  </div>;
}
// The viewport paints the platform scrollbar and its thumb.
export function Scrollbar(){return null;}
export const ScrollAreaThumb=Scrollbar;
export const Corner=Scrollbar;
