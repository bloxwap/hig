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
import {loginProviders, loginArtwork, loginCopy, loginTermsUrl, loginPrivacyUrl, type LoginBlockProps as LoginContract} from '@bloxwap/hig/contracts/login';
export type {LoginProvider} from '@bloxwap/hig/contracts/login';

export interface LoginBlockProps extends LoginContract {
  /** Prefix for the block's test IDs: the header (`<testID>-header`, `<testID>-title`), `-close`, `-<provider>`, `-analytics-row`, `-analytics`, `-analytics-info`, `-terms` and `-privacy`. */
  testID?: string;
  /** The heading, for a sheet that moves focus to it on presentation. */
  titleRef?: React.Ref<React.ComponentRef<typeof View>>;
  /** Host text read after the heading as its hint, never drawn. */
  headingHint?: string;
}

export function LoginBlock({onLogin, onClose, lastUsed, disabled, pending, analyticsEnabled, onAnalyticsChange, analyticsDisabled, onOpenLink, labels, termsUrl = loginTermsUrl, privacyUrl = loginPrivacyUrl, testID, titleRef, headingHint}: LoginBlockProps) {
  const copy = {...loginCopy, ...labels};
  const colors = useColors();
  const [infoOpen, setInfoOpen] = React.useState(false);
  const infoTrigger = React.useRef<React.ComponentRef<typeof View>>(null);
  const linkStyle = {color: colors.muted, textDecorationLine: 'underline'} as const;
  const id = (part: string) => testID ? `${testID}-${part}` : undefined;
  // A host that opens legal pages its own way (an in-app browser) takes the press; otherwise the link opens its URL.
  const opens = (url: string, link: 'terms' | 'privacy') => onOpenLink ? () => onOpenLink(url, link) : undefined;
  return <View style={{gap: 16}}>
    <ScreenHeader title={copy.title} titleRef={titleRef} description={headingHint} testID={testID} action={<HeaderClose label={copy.close} onClose={onClose} testID={id('close')}/>}/>
    <View style={{gap: 8}}>{loginProviders.map(provider =>
      <View key={provider} style={{borderRadius: 16, overflow: 'hidden'}}>
        <ListRow testID={id(provider)} label={copy[provider]} disabled={disabled || !!pending?.includes(provider)} disclosure="none" onSelect={() => onLogin(provider)}
          leading={<Svg width={20} height={20} viewBox="0 0 24 24">{loginArtwork[provider].map(path =>
            <Path key={path.d} d={path.d} fill={path.fill ?? colors.text}/>)}</Svg>}
          accessibilityLabel={lastUsed === provider ? `${copy[provider]}, ${copy.lastUsed}` : copy[provider]}
          trailing={lastUsed === provider ? <Badge tone="positive">{copy.lastUsed}</Badge> : undefined}/>
      </View>
    )}</View>
    {onAnalyticsChange ? <View testID={id('analytics-row')} style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={{flexShrink: 1}}>{copy.analytics}</Text>
      <Button ref={infoTrigger} testID={id('analytics-info')} intent="ghost" contentMode="custom" accessibilityLabel={copy.analyticsInfo}
        style={{width: 44, paddingHorizontal: 0}} onPress={() => setInfoOpen(true)}>
        <SeverityIcon kind="info" color={colors.muted}/>
      </Button>
      <View style={{marginStart: 'auto'}}><Switch testID={id('analytics')} hideLabel label={copy.analytics} checked={!!analyticsEnabled} disabled={analyticsDisabled} onCheckedChange={onAnalyticsChange}/></View>
    </View> : null}
    {onAnalyticsChange ? <Dialog open={infoOpen} onOpenChange={setInfoOpen} title={copy.analyticsInfo} closeLabel={copy.close} returnFocusRef={infoTrigger}>
      <Text>{copy.description}</Text>
    </Dialog> : null}
    <View style={{flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16}}>
      <Link href={termsUrl} testID={id('terms')} onPress={opens(termsUrl, 'terms')} contentMode="custom"><Text style={linkStyle}>{copy.terms}</Text></Link>
      <Link href={privacyUrl} testID={id('privacy')} onPress={opens(privacyUrl, 'privacy')} contentMode="custom"><Text style={linkStyle}>{copy.privacy}</Text></Link>
    </View>
  </View>;
}
