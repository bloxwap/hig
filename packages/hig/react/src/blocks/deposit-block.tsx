'use client';
import React from 'react';
import {depositIcon} from '@bloxwap/hig/tokens/deposit-icons';
import {deposit} from '@bloxwap/hig/contracts/messages';
import {useHIG} from '../provider.js';
import {ListGroup, ListRow} from '../list-group.js';
import {ScreenHeader} from './screen-header.js';

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
  return <section className="hig-deposit-block">
    <ScreenHeader title={title ?? messages.deposit ?? deposit} onBack={onBack} action={headerAction} headingId={headingId}/>
    {description && <p className="hig-settings-description">{description}</p>}
    <ListGroup>{methods.map(method => {
      const svg = depositIcon(method.id);
      const leading = method.icon ?? (svg && <img src={`data:image/svg+xml,${encodeURIComponent(svg)}`} width={44} height={44} alt="" draggable={false}/>);
      return <ListRow key={method.id} leading={leading} label={method.label} description={method.description}
        disabled={method.disabled} onSelect={() => onSelect(method)}/>;
    })}</ListGroup>
  </section>;
}
