import { Req } from '@ditsmod/core';
import { Injectable, Injector, Optional, Type } from '@ts-stack/di';

import { I18nLogMediator } from './i18n-log-mediator';
import { ISO639 } from './types/iso-639';
import { Dictionary, I18nOptions } from './types/mix';

@Injectable()
export class DictService {
  protected _lng?: ISO639;

  constructor(
    protected injector: Injector,
    protected log: I18nLogMediator,
    @Optional() protected i18nOptions?: I18nOptions,
    @Optional() protected req?: Req,
  ) {}

  getAllDictionaries<T extends Type<Dictionary>>(token: T) {
    const arr = this.injector.get(token, []) as T['prototype'][];
    return arr.slice(0).reverse();
  }

  getDictionary<T extends Type<Dictionary>>(token: T, lng?: ISO639) {
    if (!token) {
      this.log.throwDictionaryMustBeDefined();
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
      this.log.throwDictionaryNotFound(token.name, lng);
    }
    return dictionary!;
  }

  getMethod<T extends Type<Dictionary>, K extends keyof Omit<T['prototype'], 'getLng'>>(
    token: T,
    methodName: K,
    lng?: ISO639
  ) {
    const dictionary = this.getDictionary(token, lng);
    return dictionary[methodName].bind(dictionary) as T['prototype'][K];
  }

  translate<T extends Type<Dictionary>, K extends keyof Omit<T['prototype'], 'getLng'>>(
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
   * then this getter will look at the `i18nOptions.lngQueryParam` in `this.req.queryParams`.
   */
   get lng() {
    if (this._lng) {
      return this._lng;
    }
    const lng = this.req?.queryParams[this.i18nOptions?.lngParam || 'lng'];
    return lng || this.i18nOptions?.defaultLng;
  }
}
