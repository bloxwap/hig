'use client';
import React from 'react';
import {QrCode} from '@bloxwap/icons/react/qr-code';
import {deposit} from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {ListGroup, ListRow} from '../list-group.js';
import {ScreenHeader} from './screen-header.js';

const builtInMethods = new Set(['apple-pay', 'cash-app', 'exchange', 'crypto', 'bank', 'blink']);

export interface DepositMethod {
  id: string;
  label: string;
  description: string;
  /** Optional artwork for a custom method or a replacement for its built-in icon. */
  icon?: React.ReactNode;
  disabled?: boolean;
}
export interface DepositBlockProps {
  title?: string;
  description?: string;
  methods: readonly DepositMethod[];
  onSelect: (method: DepositMethod) => void;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  headingId?: string;
}

export function DepositBlock({title, description, methods, onSelect, onBack, headerAction, headingId}: DepositBlockProps) {
  const {messages} = useHIG();
  const qr = methods.find(method => method.id === 'qr');
  const orderedMethods = qr ? [qr, ...methods.filter(method => method.id !== 'qr')] : methods;
  return <section className="hig-deposit-block">
    <ScreenHeader title={title ?? messages.deposit ?? deposit} onBack={onBack} action={headerAction} headingId={headingId}/>
    {description && <p className="hig-settings-description">{description}</p>}
    <ListGroup>{orderedMethods.map(method => {
      const leading = method.icon ?? (method.id === 'qr' ? <span aria-hidden="true" className="hig-deposit-qr"><QrCode size={24}/></span> : builtInMethods.has(method.id) &&
        <span aria-hidden="true" className="hig-deposit-icon" data-method={method.id}/>);
      return <ListRow key={method.id} leading={leading} label={method.label} description={method.description}
        disabled={method.disabled} onSelect={() => onSelect(method)}/>;
    })}</ListGroup>
  </section>;
}
