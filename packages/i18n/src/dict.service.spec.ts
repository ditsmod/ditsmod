import 'reflect-metadata';
import { Injector, RequestContext } from '@ditsmod/core';
import { Req } from '@ditsmod/core';

import { I18nOptions } from './types/mix';
import { DictService } from './dict.service';
import { CommonDict } from './test/current';
import { CommonUkDict } from './test/current/common-uk.dict';
import { I18nLogMediator } from './i18n-log-mediator';

describe('DictService', () => {
  class Options {
    constructor(public i18nOptions: I18nOptions = {}, public req: Partial<Req> = { queryParams: {} }) {}
  }
  function getService(options: Options) {
    const injector = Injector.resolveAndCreate([
      DictService,
      { token: I18nLogMediator, useValue: { missingLng: jest.fn } },
      { token: RequestContext, useValue: { req: options.req } },
      { token: I18nOptions, useValue: options.i18nOptions },
      { token: CommonDict, useClass: CommonDict, multi: true },
      { token: CommonDict, useClass: CommonUkDict, multi: true },
    ]);
    return injector.get(DictService) as DictService;
  }

  it('lng is undefined by default', () => {
    const options = new Options();
    const i18nService = getService(options);
    expect(i18nService.lng).toBeUndefined();
  });

  it('set some value for defaultLng', () => {
    const options = new Options({ defaultLng: 'uk' });
    const i18nService = getService(options);
    expect(i18nService.lng).toBe('uk');
  });

  it('set some value for lng param in queryParams', () => {
    const options = new Options(undefined, { queryParams: { lng: 'en' } });
    const i18nService = getService(options);
    expect(i18nService.lng).toBe('en');
  });

  it('set some value via i18nService.lng', () => {
    const options = new Options();
    const i18nService = getService(options);
    i18nService.lng = 'pl';
    expect(i18nService.lng).toBe('pl');
  });

  it('priorited number one for i18nService.lng', () => {
    const options = new Options({ defaultLng: 'en' }, { queryParams: { lng: 'fr' } });
    const i18nService = getService(options);
    i18nService.lng = 'uk';
    expect(i18nService.lng).toBe('uk'); // i18nService.lng is getter, so it's need for testing
  });

  it('priorited number two for req.queryParams.lng', () => {
    const options = new Options({ defaultLng: 'en' }, { queryParams: { lng: 'fr' } });
    const i18nService = getService(options);
    expect(i18nService.lng).toBe('fr');
  });

  it('custom param name for lng in req.queryParams', () => {
    const options = new Options({ lngParam: 'mylng' }, { queryParams: { lng: 'de', mylng: 'fr' } });
    const i18nService = getService(options);
    expect(i18nService.lng).toBe('fr');
  });

  it('i18nService.getAllDictionaries() returns two dictionaries', () => {
    const options = new Options();
    const i18nService = getService(options);
    const dictionaries = i18nService.getAllDictionaries(CommonDict);
    expect(dictionaries.length).toBe(2);
  });

  it('i18nService.getDictionary() returns dictionary with selected lng', () => {
    const options = new Options();
    const i18nService = getService(options);
    const dictionaryUk = i18nService.getDictionary(CommonDict, 'uk');
    expect(dictionaryUk.getLng()).toBe('uk');
    const dictionaryEn = i18nService.getDictionary(CommonDict, 'en');
    expect(dictionaryEn.getLng()).toBe('en');
  });

  it('i18nService.getMethod() returns selected method', () => {
    const options = new Options();
    const i18nService = getService(options);
    const method = i18nService.getMethod(CommonDict, 'hello', 'uk');
    expect(() => method('Костя')).not.toThrow();
  });

  it('dictionary methods works as expected', () => {
    const options = new Options();
    const i18nService = getService(options);
    const dictionaryUk = i18nService.getDictionary(CommonDict, 'uk');
    expect(dictionaryUk.hello('Костя')).toBe('Привіт, Костя!');
    expect(dictionaryUk.hi()).toBe('Hi, there!');
    const dictionaryEn = i18nService.getDictionary(CommonDict, 'en');
    expect(dictionaryEn.hello('Костя')).toBe('Hello, Костя!');
    expect(dictionaryEn.hi()).toBe('Hi, there!');
  });

  it('i18nService.translate() works as expected', () => {
    const options = new Options();
    const i18nService = getService(options);
    expect(() => i18nService.translate(CommonDict, 'hello', 'uk', 'Костя')).not.toThrow();
    expect(i18nService.translate(CommonDict, 'hello', 'uk', 'Костя')).toBe('Привіт, Костя!');
    expect(i18nService.translate(CommonDict, 'hello', 'en', 'Костя')).toBe('Hello, Костя!');
    expect(i18nService.translate(CommonDict, 'hi', 'uk')).toBe('Hi, there!');
    expect(i18nService.translate(CommonDict, 'hi', 'en')).toBe('Hi, there!');
  });
});
