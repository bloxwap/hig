import {Easing} from 'react-native-reanimated';
import {SHEET_RESIZE,SHEET_TRAVEL} from '@bloxwap/hig/contracts/gesture-sheet';

/** Opening, closing, snapping and returning after a drag. */
export const gestureSheetTravel={duration:SHEET_TRAVEL.duration,easing:Easing.bezier(...SHEET_TRAVEL.curve)};
/** A content-sized sheet moving to a new height. */
export const gestureSheetResize={duration:SHEET_RESIZE.duration,easing:Easing.bezier(...SHEET_RESIZE.curve)};
