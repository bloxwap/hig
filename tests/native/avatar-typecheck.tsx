import React from 'react';
import {Avatar,type AvatarProps} from '../../packages/hig/native/src/avatar.js';
import {Avatar as StatusAvatar} from '../../packages/hig/native/src/status.js';
/**
 * Every prop of the native Avatar. An Avatar renders again only when one of them changes, and it reads each by name to decide
 * (`sameFrame` in avatar-frame.tsx, `sameProps` in avatar.tsx). A new prop does not compile here until it is listed: add it to
 * that comparison and to the changes `tests/native/avatar.test.cjs` makes, or the Avatar will not see it change.
 */
export const comparedProps:Record<keyof AvatarProps,true>={name:true,source:true,size:true,square:true,decorative:true,seed:true,variant:true,colors:true,faceColor:true};
/** The avatar entry takes the generated face; the status entry takes the same frame without it. */
export function Faces(){return <><Avatar name='Joe' seed='0x1111111111111111111111111111111111111111' variant='beam' size={20} colors={['#00ff3f','#35b5ff']} faceColor='#0a0a0a' square decorative/><Avatar name='Joe' source={{uri:'https://example.com/joe.png'}}/><StatusAvatar name='Joe' size={20} square decorative source={7}/></>;}
// @ts-expect-error the generated face needs the avatar entry, which loads react-native-svg
const seeded=<StatusAvatar name='Joe' seed='0x1111111111111111111111111111111111111111'/>;
// @ts-expect-error a face has a name
const unnamed=<Avatar seed='0x1111111111111111111111111111111111111111'/>;
// @ts-expect-error only the initials and the beam face are drawn
const marble=<Avatar name='Joe' variant='marble'/>;
void seeded;void unnamed;void marble;
