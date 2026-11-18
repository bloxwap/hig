import {clsx,createEngine} from 'cn/engine';
import tables from '../.source/cn-tables.mjs';

// Cache merged strings across the docs shell and its panels.
const {mergeString}=createEngine(tables);
export const cn=(...inputs)=>mergeString(clsx(...inputs));
