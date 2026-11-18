/** Advanced settings are controlled by the host. Wallet rows take public display addresses only. */
export interface AdvancedTask {
 id:string;
 label:string;
 detail:string;
 complete:boolean;
 onSelect:()=>void;
 disabled?:boolean;
}
export interface AdvancedWallet {
 id:string;
 label:string;
 address:string;
 onExport:()=>void;
 disabled?:boolean;
}
export interface AdvancedBlockProps {
 title:string;
 exchangeLabel:string;
 unifiedExchange:boolean;
 onUnifiedExchangeChange:(enabled:boolean)=>void;
 exchangeDisabled?:boolean;
 tasksTitle:string;
 tasks:readonly AdvancedTask[];
 completeLabel:string;
 incompleteLabel:string;
 warningTitle:string;
 warningBody:string;
 accountTitle:string;
 wallets:readonly AdvancedWallet[];
 deleteLabel:string;
 onDeleteAccount:()=>void;
 onBack?:()=>void;
 headingId?:string;
 testID?:string;
}
