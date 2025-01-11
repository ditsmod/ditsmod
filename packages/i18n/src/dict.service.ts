import { AnyObj, inject, injectable, Injector, optional, Class } from '@ditsmod/core';
import { QUERY_PARAMS } from '@ditsmod/routing';

import { I18nLogMediator } from './i18n-log-mediator.js';
import { ISO639 } from './types/iso-639.js';
import { Dictionary, I18nOptions } from './types/mix.js';
import { I18nErrorMediator } from './i18n-error-mediator.js';

@injectable()
export class DictService {
  protected _lng?: ISO639;

  constructor(
    protected injector: Injector,
    protected log: I18nLogMediator,
    protected errMediator: I18nErrorMediator,
    @optional() protected i18nOptions?: I18nOptions,
    @optional() @inject(QUERY_PARAMS) protected queryParams?: AnyObj,
  ) {}

  getAllDictionaries<T extends Class<Dictionary>>(token: T) {
    const arr = this.injector.get(token, undefined, []) as T['prototype'][];
    return arr.slice(0).reverse();
  }

  getDictionary<T extends Class<Dictionary>>(token: T, lng?: ISO639) {
    if (!token) {
      this.errMediator.throwDictionaryMustBeDefined();
    }
    const dictionaries = this.getAllDictionaries(token);
    lng = lng || this.lng;
    let dictionary = dictionaries.find((t) => t.getLng() == lng);
    if (!dictionary) {
      if (lng) {
        this.log.missingLng(this, token.name, lng);
      }
      // Trying fallback to default lng
      const tryLng = this.i18nOptions?.defaultLng || token.prototype.getLng() || lng;
      dictionary = dictionaries.find((t) => t.getLng() == tryLng);
    }
    if (!dictionary) {
      this.errMediator.throwDictionaryNotFound(token.name, lng);
    }
    return dictionary!;
  }

  getMethod<T extends Class<Dictionary>, K extends keyof Omit<T['prototype'], 'getLng'>>(
    token: T,
    methodName: K,
    lng?: ISO639,
  ) {
    const dictionary = this.getDictionary(token, lng);
    return dictionary[methodName].bind(dictionary) as T['prototype'][K];
  }

  translate<T extends Class<Dictionary>, K extends keyof Omit<T['prototype'], 'getLng'>>(
    token: T,
    methodName: K,
    lng?: ISO639,
    ...args: Parameters<T['prototype'][K]>
  ) {
    const method = this.getMethod(token, methodName, lng);
    return method(...args);
  }

  set lng(lng: ISO639) {
    this._lng = lng;
  }

  /**
   * If you previously not set the locale,
   * then this getter will look at the `i18nOptions.lngQueryParam` from query params.
   */
  get lng() {
    if (this._lng) {
      return this._lng;
    }
    const lng = this.queryParams?.[this.i18nOptions?.lngParam || 'lng'];
    return lng || this.i18nOptions?.defaultLng;
  }
}
