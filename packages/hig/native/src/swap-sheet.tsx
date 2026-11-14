import React,{useEffect,useMemo,useState} from 'react';
import type {FlatListProps} from 'react-native';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {GestureSheet} from './gesture-sheet.js';
import {SwapHostContext,SwapPanel,swapParentView,type SwapPanelProps,type SwapToken,type SwapView} from './swap-panel.js';
export interface SwapSheetProps extends SwapPanelProps {
 open:boolean;onOpenChange:(open:boolean)=>void;
 /** Accessible name of the sheet. */
 title:string;
}
/**
 * SwapPanel presented in the gesture sheet. Pickers and settings push inside the same sheet, which resizes to the view
 * on show. A back press or a dismiss gesture pops a pushed view first and closes the sheet only from the main form;
 * closing always returns to the main form. Needs the optional gesture-sheet backend, which `recipes` does not load.
 */
export function SwapSheet({open,onOpenChange,title,view:viewProp,onViewChange,style,...panel}:SwapSheetProps){
 const [ownView,keepView]=useState<SwapView>('main');const view=viewProp??ownView;
 const show=(next:SwapView)=>{if(next===view)return;if(viewProp===undefined)keepView(next);onViewChange?.(next);};
 useEffect(()=>{if(!open)show('main');},[open]);
 // The backend's list hands drags at its scroll edge to the sheet; the sheet sizes to its content, so the panel keeps its height still.
 const host=useMemo(()=>({listComponent:BottomSheetFlatList as unknown as React.ComponentType<FlatListProps<SwapToken>>,animateHeight:false}),[]);
 const leave=()=>{if(view==='main')return false;show(swapParentView(view));return true;};
 return <GestureSheet open={open} onOpenChange={next=>{if(!next&&leave())return;onOpenChange(next);}} title={title} contentMode='custom' enableDynamicSizing keyboardBehavior='interactive' onHardwareBackPress={()=>{if(!leave())onOpenChange(false);return true;}}>
  <SwapHostContext.Provider value={host}><SwapPanel {...panel} view={view} onViewChange={show} style={[{paddingHorizontal:12,paddingBottom:16},style]}/></SwapHostContext.Provider>
 </GestureSheet>;
}
