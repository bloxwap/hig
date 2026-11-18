import React from 'react';

export function useBusySpinner(busy:boolean){
 const [visible,setVisible]=React.useState(false);
 // Reset with the completed operation so the next busy interval starts hidden.
 if(!busy&&visible)setVisible(false);
 React.useEffect(()=>{
  if(!busy)return;
  const timer=setTimeout(()=>setVisible(true),1000);
  return ()=>clearTimeout(timer);
 },[busy]);
 return busy&&visible;
}
