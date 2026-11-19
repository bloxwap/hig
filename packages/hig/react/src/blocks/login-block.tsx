'use client';
import React, {useId, useState} from 'react';
import {ChevronDown} from '@bloxwap/icons/react/chevron-down';
import {Mail} from '@bloxwap/icons/react/mail';
import {Wallet} from '@bloxwap/icons/react/wallet';
import {HeaderClose, ScreenHeader} from './screen-header.js';
import {Info} from '@bloxwap/icons/react/info';
import {Button, IconButton} from '../button.js';
import {Switch} from '../selection.js';
import {Popover} from '../popover.js';
import {Badge} from '../status.js';
import {loginArtwork, loginCopy, loginTermsUrl, loginPrivacyUrl, type LoginBlockProps as SocialLoginProps, type LoginProvider} from '@bloxwap/hig/contracts/login';
export type {LoginProvider} from '@bloxwap/hig/contracts/login';
type WebLoginProvider = LoginProvider | 'email' | 'wallet';
const socialProviders = ['google', 'apple', 'twitter'] as const;
const additionalProviders = ['email', 'wallet'] as const;
const moreLabels = {moreOptions: 'More options', email: 'Continue with Email', wallet: 'Connect a wallet'};

export interface LoginBlockProps extends Omit<SocialLoginProps, 'lastUsed' | 'labels'> {
  lastUsed?: WebLoginProvider | null;
  labels?: SocialLoginProps['labels'] & Partial<typeof moreLabels>;
  /** Enables the web disclosure and handles its two authentication methods. */
  onMoreLogin?: (provider: 'email' | 'wallet') => void;
}

export function LoginBlock({onLogin, onMoreLogin, onClose, lastUsed, disabled, pending, analyticsEnabled, onAnalyticsChange, analyticsDisabled, onOpenLink, labels, termsUrl = loginTermsUrl, privacyUrl = loginPrivacyUrl}: LoginBlockProps) {
  const copy = {...loginCopy, ...moreLabels, ...labels};
  const [expanded, setExpanded] = useState(lastUsed === 'email' || lastUsed === 'wallet');
  const optionsId = useId();
  const primary = lastUsed ?? 'google';
  // A host that opens legal pages its own way takes the click; otherwise the link navigates to its URL.
  const opens = (url: string, link: 'terms' | 'privacy') => onOpenLink ? (event: React.MouseEvent) => { event.preventDefault(); onOpenLink(url, link); } : undefined;

  function providerButton(provider: WebLoginProvider) {
    const extra = provider === 'email' || provider === 'wallet';
    const icon = provider === 'email' ? <Mail size={20}/> : provider === 'wallet' ? <Wallet size={20}/> :
      <svg width="20" height="20" viewBox="0 0 24 24">{loginArtwork[provider].map(path =>
        <path key={path.d} d={path.d} fill={path.fill ?? 'currentColor'}/>)}</svg>;
    return <Button key={provider} className="hig-login-provider" fullWidth disabled={disabled || !!(pending as readonly WebLoginProvider[] | undefined)?.includes(provider)}
      intent={primary === provider ? 'primary' : 'secondary'}
      onClick={() => extra ? onMoreLogin?.(provider) : onLogin(provider)}>
      <span className="hig-login-provider-label"><span aria-hidden="true">{icon}</span>{copy[provider]}</span>
      {lastUsed === provider && <Badge>{copy.lastUsed}</Badge>}
    </Button>;
  }

  return <section className="hig-login-block">
    <ScreenHeader title={copy.title} action={<HeaderClose label={copy.close} onClose={onClose}/>}/>
    <div className="hig-login-providers">
      {socialProviders.map(providerButton)}
      {onMoreLogin && <>
        <Button intent="ghost" aria-expanded={expanded} aria-controls={optionsId} onClick={() => setExpanded(!expanded)}>
          {copy.moreOptions}<ChevronDown size={16} aria-hidden="true" style={{transform: expanded ? 'rotate(180deg)' : undefined}}/>
        </Button>
        <div id={optionsId} hidden={!expanded} className="hig-login-extra">
          {additionalProviders.map(providerButton)}
        </div>
      </>}
    </div>
    {onAnalyticsChange && <div className="hig-login-analytics">
      <span>{copy.analytics}</span>
      <Popover label={copy.analyticsInfo} closeLabel={copy.close}
        trigger={<IconButton label={copy.analyticsInfo} intent="ghost"><Info size={18}/></IconButton>}>
        <p>{copy.description}</p>
      </Popover>
      <Switch hideLabel label={copy.analytics} checked={!!analyticsEnabled} disabled={analyticsDisabled} onCheckedChange={onAnalyticsChange}/>
    </div>}
    <footer><a href={termsUrl} onClick={opens(termsUrl, 'terms')}>{copy.terms}</a><a href={privacyUrl} onClick={opens(privacyUrl, 'privacy')}>{copy.privacy}</a></footer>
  </section>;
}
