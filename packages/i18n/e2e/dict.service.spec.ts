import { AnyObj, Injector, ModuleExtract, QUERY_PARAMS } from '@ditsmod/core';
import { jest } from '@jest/globals';

import { I18nOptions } from '#src/types/mix.js';
import { DictService } from '#src/dict.service.js';
import { CommonDict } from './current/index.js';
import { CommonUkDict } from './current/common-uk.dict.js';
import { I18nLogMediator } from '#src/i18n-log-mediator.js';
import { I18nErrorMediator } from '#src/i18n-error-mediator.js';

describe('DictService', () => {
  function getService(queryParams?: AnyObj, i18nOptions?: I18nOptions) {
    const injector = Injector.resolveAndCreate([
      DictService,
      I18nErrorMediator,
      { token: I18nLogMediator, useValue: { missingLng: jest.fn } },
      { token: QUERY_PARAMS, useValue: queryParams },
      { token: I18nOptions, useValue: i18nOptions },
      { token: ModuleExtract, useValue: { moduleName: 'test-i18n' } },
      { token: CommonDict, useClass: CommonDict, multi: true },
      { token: CommonDict, useClass: CommonUkDict, multi: true },
    ]);
    return injector.get(DictService) as DictService;
  }

  it('lng is undefined by default', () => {
    const i18nService = getService();
    expect(i18nService.lng).toBeUndefined();
  });

  it('set some value for defaultLng', () => {
    const i18nService = getService({}, { defaultLng: 'uk' });
    expect(i18nService.lng).toBe('uk');
  });

  it('set some value for lng param in queryParams', () => {
    const i18nService = getService({ lng: 'en' });
    expect(i18nService.lng).toBe('en');
  });

  it('set some value via i18nService.lng', () => {
    const i18nService = getService();
    i18nService.lng = 'pl';
    expect(i18nService.lng).toBe('pl');
  });

  it('priorited number one for i18nService.lng', () => {
    const i18nService = getService({ lng: 'fr' }, { defaultLng: 'en' });
    i18nService.lng = 'uk';
    expect(i18nService.lng).toBe('uk'); // i18nService.lng is getter, so it's need for testing
  });

  it('priorited number two for queryParams.lng', () => {
    const i18nService = getService({ lng: 'fr' }, { defaultLng: 'en' });
    expect(i18nService.lng).toBe('fr');
  });

  it('custom param name for lng in queryParams', () => {
    const i18nService = getService({ lng: 'de', mylng: 'fr' }, { lngParam: 'mylng' });
    expect(i18nService.lng).toBe('fr');
  });

  it('i18nService.getAllDictionaries() returns two dictionaries', () => {
    const i18nService = getService();
    const dictionaries = i18nService.getAllDictionaries(CommonDict);
    expect(dictionaries.length).toBe(2);
  });

  it('i18nService.getDictionary() returns dictionary with selected lng', () => {
    const i18nService = getService();
    const dictionaryUk = i18nService.getDictionary(CommonDict, 'uk');
    expect(dictionaryUk.getLng()).toBe('uk');
    const dictionaryEn = i18nService.getDictionary(CommonDict, 'en');
    expect(dictionaryEn.getLng()).toBe('en');
  });

  it('i18nService.getMethod() returns selected method', () => {
    const i18nService = getService();
    const method = i18nService.getMethod(CommonDict, 'hello', 'uk');
    expect(() => method('Костя')).not.toThrow();
  });

  it('dictionary methods works as expected', () => {
    const i18nService = getService();
    const dictionaryUk = i18nService.getDictionary(CommonDict, 'uk');
    expect(dictionaryUk.hello('Костя')).toBe('Привіт, Костя!');
    expect(dictionaryUk.hi()).toBe('Hi, there!');
    const dictionaryEn = i18nService.getDictionary(CommonDict, 'en');
    expect(dictionaryEn.hello('Костя')).toBe('Hello, Костя!');
    expect(dictionaryEn.hi()).toBe('Hi, there!');
  });

  it('i18nService.translate() works as expected', () => {
    const i18nService = getService();
    expect(() => i18nService.translate(CommonDict, 'hello', 'uk', 'Костя')).not.toThrow();
    expect(i18nService.translate(CommonDict, 'hello', 'uk', 'Костя')).toBe('Привіт, Костя!');
    expect(i18nService.translate(CommonDict, 'hello', 'en', 'Костя')).toBe('Hello, Костя!');
    expect(i18nService.translate(CommonDict, 'hi', 'uk')).toBe('Hi, there!');
    expect(i18nService.translate(CommonDict, 'hi', 'en')).toBe('Hi, there!');
  });
});
