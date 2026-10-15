import {nativeSrgb as colors} from '@bloxwap/hig-tokens';
/** Semantic token roles a host may choose for a control or status accent. Raw colours are not accepted, so product palettes are never copied into HIG consumers. */
export const accentRoles=['action','positive','negative','warning','info','buy','sell'] as const;
export type AccentRole=typeof accentRoles[number];
/** Resolves a role to its token colour; anything outside the role list (for example a hex string from untyped JS) falls back to the component default. */
export function roleColor(role:unknown,fallback:AccentRole):string{return colors[(accentRoles as readonly unknown[]).includes(role)?role as AccentRole:fallback];}
