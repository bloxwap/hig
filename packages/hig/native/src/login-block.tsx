import React from 'react';
import {View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {HeaderClose, ScreenHeader} from './screen-header.js';
import {Switch} from './switch.js';
import {Dialog} from './overlay.js';
import {SeverityIcon} from './icons.js';
import {ListRow} from './list-group.js';
import {Badge} from './status.js';
import {Text} from './surface.js';
import {Button, Link} from './button.js';
import {useColors} from './provider.js';
import {loginProviders, loginArtwork, loginCopy, loginTermsUrl, loginPrivacyUrl, type LoginBlockProps} from '@bloxwap/hig/contracts/login';
export type {LoginBlockProps, LoginProvider} from '@bloxwap/hig/contracts/login';

export function LoginBlock({onLogin, onClose, lastUsed, disabled, analyticsEnabled, onAnalyticsChange, labels, termsUrl = loginTermsUrl, privacyUrl = loginPrivacyUrl}: LoginBlockProps) {
  const copy = {...loginCopy, ...labels};
  const colors = useColors();
  const [infoOpen, setInfoOpen] = React.useState(false);
  const infoTrigger = React.useRef<React.ComponentRef<typeof View>>(null);
  const linkStyle = {color: colors.muted, textDecorationLine: 'underline'} as const;
  return <View style={{gap: 16}}>
    <ScreenHeader title={copy.title} action={<HeaderClose label={copy.close} onClose={onClose}/>}/>
    <View style={{gap: 8}}>{loginProviders.map(provider =>
      <View key={provider} style={{borderRadius: 16, overflow: 'hidden'}}>
        <ListRow label={copy[provider]} disabled={disabled} disclosure="none" onSelect={() => onLogin(provider)}
          leading={<Svg width={20} height={20} viewBox="0 0 24 24">{loginArtwork[provider].map(path =>
            <Path key={path.d} d={path.d} fill={path.fill ?? colors.text}/>)}</Svg>}
          accessibilityLabel={lastUsed === provider ? `${copy[provider]}, ${copy.lastUsed}` : copy[provider]}
          trailing={lastUsed === provider ? <Badge tone="positive">{copy.lastUsed}</Badge> : undefined}/>
      </View>
    )}</View>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={{flexShrink: 1}}>{copy.analytics}</Text>
      <Button ref={infoTrigger} intent="ghost" contentMode="custom" accessibilityLabel={copy.analyticsInfo}
        style={{width: 44, paddingHorizontal: 0}} onPress={() => setInfoOpen(true)}>
        <SeverityIcon kind="info" color={colors.muted}/>
      </Button>
      <View style={{marginStart: 'auto'}}><Switch hideLabel label={copy.analytics} checked={analyticsEnabled} onCheckedChange={onAnalyticsChange}/></View>
    </View>
    <Dialog open={infoOpen} onOpenChange={setInfoOpen} title={copy.analyticsInfo} closeLabel={copy.close} returnFocusRef={infoTrigger}>
      <Text>{copy.description}</Text>
    </Dialog>
    <View style={{flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16}}>
      <Link href={termsUrl} contentMode="custom"><Text style={linkStyle}>{copy.terms}</Text></Link>
      <Link href={privacyUrl} contentMode="custom"><Text style={linkStyle}>{copy.privacy}</Text></Link>
    </View>
  </View>;
}
