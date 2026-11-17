import { ChevronDown } from '@bloxwap/icons/native/chevron-down';
import { CircleCheck } from '@bloxwap/icons/native/circle-check';
import { CircleX } from '@bloxwap/icons/native/circle-x';
import { Eye } from '@bloxwap/icons/native/eye';
import { Inbox } from '@bloxwap/icons/native/inbox';
import { Info } from '@bloxwap/icons/native/info';
import { PenLine } from '@bloxwap/icons/native/pen-line';
import { QrCode } from '@bloxwap/icons/native/qr-code';
import { Search } from '@bloxwap/icons/native/search';
import { TrendingDown } from '@bloxwap/icons/native/trending-down';
import { TrendingUp } from '@bloxwap/icons/native/trending-up';
import { TriangleAlert } from '@bloxwap/icons/native/triangle-alert';
import { X } from '@bloxwap/icons/native/x';
import React from 'react';
/** Decorative shared symbols. The containing control or text carries the name. */
export function SearchIcon({color}: {color:string}){return <Search size={18} color={color}/>;}
export function ChevronIcon({color}: {color:string}){return <ChevronDown size={20} color={color}/>;}
export function QrIcon({color}: {color:string}){return <QrCode size={20} color={color}/>;}
export function CloseIcon({color}: {color:string}){return <X size={20} color={color}/>;}
export function EditIcon({color}: {color:string}){return <PenLine size={20} color={color}/>;}
export function EmptyIcon({color}: {color:string}){return <Inbox size={48} color={color}/>;}
export function EyeIcon({color}: {color:string}){return <Eye size={20} color={color}/>;}
export type SeverityIconKind='info'|'success'|'warning'|'error';
const severitySymbols={info:Info,success:CircleCheck,warning:TriangleAlert,error:CircleX};
export function SeverityIcon({kind,color}: {kind:SeverityIconKind;color:string}){const Symbol=severitySymbols[kind];return <Symbol size={20} color={color}/>;}
export function TrendIcon({color,direction}: {color:string;direction:'up'|'down'}){const Symbol=direction==='down'?TrendingDown:TrendingUp;return <Symbol size={20} color={color}/>;}
