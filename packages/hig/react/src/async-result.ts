import {useEffect,useRef} from 'react';
/** Start an operation and test whether its result still belongs to this owner. */
export function useAsyncResult(owner:unknown){
 const state=useRef({owner,generation:0,alive:true});
 if(!Object.is(state.current.owner,owner)){state.current.owner=owner;state.current.generation++;}
 useEffect(()=>{state.current.alive=true;return()=>{state.current.alive=false;state.current.generation++;};},[]);
 return ()=>{const generation=++state.current.generation;return()=>state.current.alive&&state.current.generation===generation;};
}
