/** Where a trader stands with their referral code. `progress`: still trading towards the goal. `create`: the goal is met and no code is set. `share`: the code is set. */
export type ReferralStage='progress'|'create'|'share';
/** Every word the block draws. The host owns them, so the goal and the code read in the host's language and currency. */
export interface ReferralCodeLabels {
 /** Heading: Referral code. */
 title:string;
 /** Over the traded volume while trading towards the goal: Traded volume. */
 volume:string;
 /** Under the traded volume, given the formatted goal: of $10,000. */
 goal:(goal:string)=>string;
 /** Beside the bar, given the formatted amount still to trade: $3,750 to go. */
 remaining:(remaining:string)=>string;
 /** Under the bar while trading towards the goal: Trade $10,000 to create your referral code. */
 progressNote?:string;
 /** Over the field once the goal is met: Referral code unlocked. */
 unlocked:string;
 /** Under `unlocked`: Pick a code to share. You can set it once. */
 unlockedNote?:string;
 /** The field's label: Your code. */
 field:string;
 /** Under the field: Letters and numbers, up to 20. */
 fieldHint?:string;
 /** The button that asks to confirm the code: Set code. */
 set:string;
 /** Heading of the confirmation, given the code: Set BLOX as your code? */
 confirmTitle:(code:string)=>string;
 /** Heading of the warning in the confirmation: One time only. */
 oneTime:string;
 /** The warning's sentence: You can only set a referral code once. It can't be changed later. */
 confirmWarning:string;
 /** The checkbox the trader ticks before confirming: I understand this is one time. */
 acknowledge:string;
 /** The confirming button: Confirm code. */
 confirm:string;
 /** Returns from the confirmation to the field: Back. */
 cancel:string;
 /** Over the set code: Your referral code. */
 yourCode:string;
 /** Under the code, such as what a friend gets: Friends who join with your code get 4% off fees. */
 shareNote?:string;
 /** The copy button: Copy code. */
 copy:string;
 /** The copy button's text for a moment after a copy: Copied. */
 copied:string;
 /** The share button: Share link. */
 share:string;
}
/** The share of `goal` that `volume` has reached, from 0 to 1. An unknown volume, or a goal that is not above zero, reads as 0. */
export function referralProgress(volume:number|null|undefined,goal:number):number{
 if(volume==null||!Number.isFinite(volume)||!Number.isFinite(goal)||!(goal>0))return 0;
 return Math.min(1,Math.max(0,volume/goal));
}
/** The stage the block draws: a set code shares; otherwise the goal decides between trading on and creating the code. */
export function referralStage(volume:number|null|undefined,goal:number,code:string|null|undefined):ReferralStage{
 if(code)return 'share';
 return volume!=null&&Number.isFinite(volume)&&Number.isFinite(goal)&&volume>=goal?'create':'progress';
}
/** How many characters a code keeps by default. */
export const referralCodeMaxLength=20;
/** The default cleanup of what the trader types: capitals, letters and numbers only, at most `referralCodeMaxLength`. */
export function normalizeReferralCode(input:string):string{
 return input.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,referralCodeMaxLength);
}
/** What the referrer has earned, shown once the code is set, and how to claim it. The host reads the balance and sends the payout. */
export interface ReferralRewards {
 /** The unclaimed balance, in `symbol` units. `null` reads as unknown. It rolls with NumberFlow as it changes. */
 balance:number|null;
 /** The token the rewards are paid in, after the balance. Defaults to USDC. */
 symbol?:string;
 /** The smallest balance that can be claimed. Defaults to 1, Hyperliquid's claim threshold. */
 minimum?:number;
 /** Claims the whole balance. The host sends it to the trader's account and passes the new `balance`. */
 onClaim:()=>unknown;
 /** The claim is being sent: Claim shows a spinner and ignores presses. */
 claiming?:boolean;
 /** Why the claim failed. Drawn above Claim, which stays available for another try. */
 error?:string;
 labels:{
  /** Over the balance: Referral rewards. */
  title:string;
  /** The claim button: Claim to account. */
  claim:string;
  /** Under the balance while it is below `minimum`, given the formatted minimum: Claim once you have $1 or more. */
  minimum:(minimum:string)=>string;
  /** Under the balance, such as where the claim goes: Paid in USDC to your trading account. */
  note?:string;
 };
}
/** Two fraction digits, the default format of a rewards balance. */
export const referralRewardsFormat:Intl.NumberFormatOptions={minimumFractionDigits:2,maximumFractionDigits:2};
/** Whether a rewards balance can be claimed: known, finite, and at least the minimum (and above zero). */
export function referralClaimable(balance:number|null|undefined,minimum=1):boolean{
 return balance!=null&&Number.isFinite(balance)&&balance>0&&balance>=minimum;
}
export interface ReferralCodeBlockProps {
 /** What the trader has traded so far, in the goal's currency. `null` reads as unknown and draws an empty bar. The figure rolls with NumberFlow as it changes. */
 volume:number|null;
 /** The volume that unlocks a code: 10000 on Hyperliquid. */
 goal:number;
 /** Format of `volume`, the goal and the amount still to trade. Defaults to whole US dollars. */
 volumeOptions?:Intl.NumberFormatOptions;
 /** The trader's code once set. It moves the block to sharing; until then the goal decides between the bar and the field. */
 code?:string|null;
 labels:ReferralCodeLabels;
 /** Called with the code once the trader has ticked the acknowledgement and confirmed. The host saves it and passes it back as `code`; a rejected promise or `error` keeps the confirmation open. */
 onSetCode:(code:string)=>unknown;
 /** Saving the code: Confirm shows a spinner, and Back and the checkbox wait. */
 busy?:boolean;
 /** Why the code was not saved, such as a code already taken. Drawn under the field, or in the confirmation while it is open. */
 error?:string;
 /** Replaces the default cleanup of what is typed (capitals, letters and numbers, at most 20). */
 normalizeCode?:(input:string)=>string;
 /** The link to share once the code is set, such as https://app.hyperliquid.xyz/join/BLOX. Drawn under the code. */
 shareUrl?:string;
 /** Shows Copy code. The host writes `code` to the clipboard. */
 onCopy?:(code:string)=>unknown;
 /** Shows Share link. The host opens its share sheet with `shareUrl`, or the code when there is no link. */
 onShare?:(code:string,url:string|undefined)=>unknown;
 /** Adds the rewards card under the code once it is set: the balance and Claim. */
 rewards?:ReferralRewards;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** `id` of the header's heading, so a host dialog or sheet can name itself with `aria-labelledby`. */
 headingId?:string;
}
/** Whole US dollars, the default format of the volume and goal. */
export const referralVolumeFormat:Intl.NumberFormatOptions={style:'currency',currency:'USD',maximumFractionDigits:0};
/** How long Copy code reads Copied after a copy, in milliseconds. */
export const referralCopiedMs=2000;
