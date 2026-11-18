import {lazy} from 'react';

// These previews publish transient notices through the shared Sonner host.
export const toastExamples=new Set(['Toaster','WalletAddress','DepositBlock','SwapBlock','InstallCommand','ClaimRewardBlock']);
export const PreviewToaster=lazy(()=>import('./preview-toaster').then(module=>({default:module.PreviewToaster})));
