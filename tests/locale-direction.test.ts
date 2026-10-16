import {it,expect} from 'vitest';
import {localeDirection} from '../packages/contracts/src/index';
// #86: hosts derive HIGProvider direction from their own locale on React Native 0.83 Android.
it('derives direction from BCP 47 tags and Android/Java locale identifiers',()=>{
 for(const tag of ['ar','ar-EG','ar_EG','he-IL','iw_IL','fa-IR','ur-PK','ckb-IQ','ps-AF','yi','ug-CN','dv-MV','sd-PK','az-Arab-IR','az_IR_#Arab','pa-Arab-PK','uz-Arab','ff-Adlm-GN','AR-eg'])expect(localeDirection(tag),tag).toBe('rtl');
 for(const tag of ['en','en-US','en_US','de-DE','ko-KR','zh-Hant-TW','az-Latn-AZ','ku-TR','ha-NG','pa-IN','sr_RS_#Latn','ar-Latn','en-u-nu-arab','th_TH_TH_#u-nu-thai'])expect(localeDirection(tag),tag).toBe('ltr');
});
it('prefers an explicit textDirection such as expo-localization getLocales()[0]',()=>{
 expect(localeDirection({languageTag:'ar-EG',textDirection:'rtl'})).toBe('rtl');
 expect(localeDirection({languageTag:'ar-EG',textDirection:'ltr'})).toBe('ltr');
 expect(localeDirection({languageTag:'he-IL',textDirection:null})).toBe('rtl');
 expect(localeDirection({languageTag:'en-US'})).toBe('ltr');
});
it('returns undefined when the locale names no language, so HIGProvider keeps its I18nManager default',()=>{
 for(const value of [undefined,null,'','  ','und','und-Arab','1234','e',{},{languageTag:null},{textDirection:null}])expect(localeDirection(value as never)).toBeUndefined();
});
