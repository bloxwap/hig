import React from 'react';
import {GestureSheet,type GestureSheetBackendProps,type GestureSheetContentProps} from '../packages/react/src/gesture-sheet';
const change=(open:boolean)=>{void open;};
const backend:GestureSheetBackendProps={snapPoints:[0.4,0.9],fadeFromIndex:1,activeSnapPoint:0.4,setActiveSnapPoint:()=>{},handleOnly:false,repositionInputs:false,shouldScaleBackground:true,dismissible:false,autoFocus:false};
const content:GestureSheetContentProps={'data-host-card':'markets',className:'host-card',style:{bottom:12,maxHeight:'80dvh'},onOpenAutoFocus:event=>event.preventDefault(),onEscapeKeyDown:event=>event.preventDefault()};
<GestureSheet open onOpenChange={change} title='Markets' backendProps={backend} contentProps={content} contentRef={React.createRef<HTMLDivElement>()} contentMode='custom' handleProps={{style:{width:100},preventCycle:true}}><h2>Markets</h2></GestureSheet>;
// @ts-expect-error HIG owns controlled open and the modal root.
const unsafeRoot:GestureSheetBackendProps={modal:false};
// @ts-expect-error HIG owns the generated id and accessible associations.
const unsafeContent:GestureSheetContentProps={id:'foreign'};
// @ts-expect-error A fade index requires explicit snap points in the backend union.
const missingPoints:GestureSheetBackendProps={fadeFromIndex:1};
void [unsafeRoot,unsafeContent,missingPoints];
