import React from 'react';
import {Avatar,avatarColorRoles,type AvatarProps} from '../packages/hig/react/src/avatar.js';
import {Avatar as StatusAvatar,type AvatarProps as StatusAvatarProps} from '../packages/hig/react/src/status.js';
import {avatarColorRoles as sharedRoles} from '../packages/hig/contracts/src/avatar.js';

/** The web status entry exports the same component and props as the avatar entry, and both name the palette roles of the shared model. */
const same:typeof Avatar=StatusAvatar;const props:StatusAvatarProps={name:'Joe'} satisfies AvatarProps;const roles:typeof sharedRoles=avatarColorRoles;
export const avatarTypecheck=<>
 <Avatar name='Joe'/>
 <Avatar name='Joe' src='/joe.png'/>
 <Avatar name='Joe' seed='0x1111111111111111111111111111111111111111' variant='beam' size={20} colors={['#00ff3f','color(display-p3 0.18 0.72 1)']} faceColor='#0a0a0a' square decorative/>
 <StatusAvatar {...props} seed='0x1111111111111111111111111111111111111111'/>
</>;
// @ts-expect-error a face has a name
const unnamed=<Avatar seed='0x1111111111111111111111111111111111111111'/>;
// @ts-expect-error only the initials and the beam face are drawn
const marble=<Avatar name='Joe' variant='marble'/>;
// @ts-expect-error the image is `src` on web; `source` is the native prop
const native=<Avatar name='Joe' source={{uri:'/joe.png'}}/>;
// @ts-expect-error size is a number of CSS pixels
const text=<Avatar name='Joe' size='20px'/>;
void same;void roles;void unnamed;void marble;void native;void text;
