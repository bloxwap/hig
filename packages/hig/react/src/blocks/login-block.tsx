'use client';
import React from 'react';
import {HeaderClose, ScreenHeader} from './screen-header.js';
import {Info} from '@bloxwap/icons/react/info';
import {IconButton} from '../button.js';
import {Switch} from '../selection.js';
import {Popover} from '../popover.js';
import {ListRow} from '../list-group.js';
import {Badge} from '../status.js';
import {loginProviders, loginArtwork, loginCopy, loginTermsUrl, loginPrivacyUrl, type LoginBlockProps} from '@bloxwap/hig/contracts/login';
export type {LoginBlockProps, LoginProvider} from '@bloxwap/hig/contracts/login';

export function LoginBlock({onLogin, onClose, lastUsed, disabled, analyticsEnabled, onAnalyticsChange, labels, termsUrl = loginTermsUrl, privacyUrl = loginPrivacyUrl}: LoginBlockProps) {
  const copy = {...loginCopy, ...labels};
  return <section className="hig-login-block">
    <ScreenHeader title={copy.title} action={<HeaderClose label={copy.close} onClose={onClose}/>}/>
    <div className="hig-login-providers">{loginProviders.map(provider =>
      <ListRow key={provider} label={copy[provider]} disabled={disabled} disclosure="none" onSelect={() => onLogin(provider)}
        leading={<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">{loginArtwork[provider].map(path =>
          <path key={path.d} d={path.d} fill={path.fill ?? 'currentColor'}/>)}</svg>}
        trailing={lastUsed === provider ? <Badge tone="positive">{copy.lastUsed}</Badge> : undefined}/>
    )}</div>
    <div className="hig-login-analytics">
      <span>{copy.analytics}</span>
      <Popover label={copy.analyticsInfo} closeLabel={copy.close}
        trigger={<IconButton label={copy.analyticsInfo} intent="ghost"><Info size={18}/></IconButton>}>
        <p>{copy.description}</p>
      </Popover>
      <Switch hideLabel label={copy.analytics} checked={analyticsEnabled} onCheckedChange={onAnalyticsChange}/>
    </div>
    <footer><a href={termsUrl}>{copy.terms}</a><a href={privacyUrl}>{copy.privacy}</a></footer>
  </section>;
}
