import React,{useEffect,useMemo,useState} from 'react';
import {FlatList,type FlatListProps} from 'react-native';
import {GestureSheet,GestureSheetScrollView} from './gesture-sheet.js';
import {SwapHostContext,SwapBlock,swapParentView,type SwapBlockProps,type SwapToken,type SwapView} from './swap-block.js';
/** A picker list whose scroller is the sheet's: a drag at the top of the list moves the sheet, and the rows still window from scroll events. */
const SheetTokenList=React.forwardRef<FlatList<SwapToken>,FlatListProps<SwapToken>>(function SheetTokenList(props,ref){
 return <FlatList {...props} ref={ref} renderScrollComponent={scroll=><GestureSheetScrollView {...scroll}/>}/>;
});
export interface SwapSheetProps extends SwapBlockProps {
 open:boolean;onOpenChange:(open:boolean)=>void;
 /** Accessible name of the sheet. */
 title:string;
}
/**
 * SwapBlock presented in the gesture sheet. Pickers and settings push inside the same sheet, which resizes to the view
 * on show. A back press or a dismiss gesture pops a pushed view first and closes the sheet only from the main form;
 * closing always returns to the main form. Draw it inside a `GestureSheetHost`, as any modal gesture sheet.
 */
export function SwapSheet({open,onOpenChange,title,view:viewProp,onViewChange,style,...panel}:SwapSheetProps){
 const [ownView,keepView]=useState<SwapView>('main');const view=viewProp??ownView;
 const show=(next:SwapView)=>{if(next===view)return;if(viewProp===undefined)keepView(next);onViewChange?.(next);};
 useEffect(()=>{if(!open)show('main');},[open]);
 // The list hands drags at its scroll edge to the sheet; the sheet sizes to its content, so the panel keeps its height still.
 const host=useMemo(()=>({listComponent:SheetTokenList as unknown as React.ComponentType<FlatListProps<SwapToken>>,animateHeight:false}),[]);
 const leave=()=>{if(view==='main')return false;show(swapParentView(view));return true;};
 return <GestureSheet open={open} onOpenChange={next=>{if(!next&&leave())return;onOpenChange(next);}} title={title} contentMode='custom' enableDynamicSizing onHardwareBackPress={()=>{if(!leave())onOpenChange(false);return true;}}>
  <SwapHostContext.Provider value={host}><SwapBlock {...panel} view={view} onViewChange={show} style={[{paddingHorizontal:12,paddingBottom:16},style]}/></SwapHostContext.Provider>
 </GestureSheet>;
}
