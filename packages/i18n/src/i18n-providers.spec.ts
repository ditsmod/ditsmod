import { Providers } from '@ditsmod/core';

import { I18nProviders } from './i18n-providers.js';
import { CommonDict } from './test/current/index.js';
import { CommonUkDict } from './test/current/common-uk.dict.js';
import { I18nOptions, I18N_TRANSLATIONS, Translations } from './types/mix.js';
import { DictService } from './dict.service.js';
import { I18nLogMediator } from './i18n-log-mediator.js';
import { I18nTransformer } from './i18n-transformer.js';

describe('I18nProviders', () => {
  it('returns arrays with two elements of DI providers', () => {
    let providers: I18nProviders;

    function callback() {
      providers = new I18nProviders();
      providers.i18n({ current: [[CommonDict, CommonUkDict]] }, { defaultLng: 'uk' });
    }

    expect(callback).not.toThrow();
    const expectedUseValue: Translations = { current: [[CommonDict, CommonUkDict]] };
    expect([...providers!]).toEqual(
      expect.arrayContaining([
        { token: I18N_TRANSLATIONS, useValue: expectedUseValue, multi: true },
        { token: I18nOptions, useValue: { defaultLng: 'uk' }, multi: undefined },
      ])
    );
  });

  it('works as plugin for Providers', () => {
    let providers: I18nProviders;

    function callback() {
      providers = new Providers().use(I18nProviders);
      providers.i18n({ current: [[CommonDict, CommonUkDict]] }, { defaultLng: 'uk' });
    }

    expect(callback).not.toThrow();
    const expectedUseValue: Translations = { current: [[CommonDict, CommonUkDict]] };
    expect([...providers!]).toEqual(
      expect.arrayContaining([
        { token: I18N_TRANSLATIONS, useValue: expectedUseValue, multi: true },
        { token: I18nOptions, useValue: { defaultLng: 'uk' }, multi: undefined },
      ])
    );
  });
});
