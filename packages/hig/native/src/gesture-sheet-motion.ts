import {Easing} from 'react-native-reanimated';
import {SHEET_TRANSITION} from './gesture-sheet-model.js';

export const gestureSheetAnimationConfigs={
 duration:SHEET_TRANSITION.duration,
 easing:Easing.bezier(...SHEET_TRANSITION.curve),
};
