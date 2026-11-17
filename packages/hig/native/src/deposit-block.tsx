import React from 'react';
import {depositIcon} from '@bloxwap/hig/tokens/deposit-icons';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useColors, useMessages} from './provider.js';
import {Text} from './surface.js';
import {ListGroup, ListRow} from './list-group.js';
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
  const messages = useMessages();
  const colors = useColors();
  return <View style={{gap: 12}}>
    <ScreenHeader title={title ?? messages.deposit} onBack={onBack} action={headerAction} headingId={headingId}/>
    {description && <Text style={{color: colors.muted, fontSize: 14, textAlign: 'center'}}>{description}</Text>}
    <ListGroup>{methods.map(method => {
      const svg = depositIcon(method.id);
      const leading = method.icon ?? (svg && <SvgXml xml={svg} width={44} height={44}/>);
      return <ListRow key={method.id} leading={leading} label={method.label} description={method.description}
        disabled={method.disabled} onSelect={() => onSelect(method)}/>;
    })}</ListGroup>
  </View>;
}
