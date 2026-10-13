import {exampleCode} from './example-code.mjs';
import {configurationCode} from '../apps/docs/src/configuration-code.mjs';
export function playgroundCode(name,platform='react',density='comfortable',state='default',preferences={sound:false,haptics:false,volume:.3,motion:true}){return configurationCode(exampleCode(name,platform,density,state),platform,preferences);}
