import React from 'react';
import {QrCode} from '@bloxwap/icons/native/qr-code';
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
  const qr = methods.find(method => method.id === 'qr');
  const orderedMethods = qr ? [qr, ...methods.filter(method => method.id !== 'qr')] : methods;
  return <View style={{gap: 12}}>
    <ScreenHeader title={title ?? messages.deposit} onBack={onBack} action={headerAction} headingId={headingId}/>
    {description && <Text style={{color: colors.muted, fontSize: 14, textAlign: 'center'}}>{description}</Text>}
    <ListGroup>{orderedMethods.map(method => {
      const svg = depositIcon(method.id);
      const leading = method.icon ?? (method.id === 'qr' ? <View style={{width:44,height:44,borderRadius:10,backgroundColor:colors.background,alignItems:"center",justifyContent:"center"}}><QrCode size={24} color={colors.text}/></View> : svg && <SvgXml xml={svg} width={44} height={44}/>);
      return <ListRow key={method.id} leading={leading} label={method.label} description={method.description}
        disabled={method.disabled} onSelect={() => onSelect(method)}/>;
    })}</ListGroup>
  </View>;
}
