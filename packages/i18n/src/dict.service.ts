import { Req } from '@ditsmod/core';
import { Injectable, Injector, Type } from '@ts-stack/di';

import { I18nLogMediator } from './i18n-log-mediator';
import { ISO639 } from './types/iso-639';
import { I18nOptions, Dictionary } from './types/mix';

@Injectable()
export class DictService {
  private _lng?: ISO639;

  constructor(private injector: Injector, private req: Req, private i18nOptions: I18nOptions, private log: I18nLogMediator) {}

  getAllDictionaries<T extends Type<Dictionary>>(namespace: T) {
    return this.injector.get(namespace, []) as T['prototype'][];
  }

  getDictionary<T extends Type<Dictionary>>(namespace: T, lng?: ISO639) {
    const dictionaries = this.getAllDictionaries(namespace);
    lng = lng || this.lng;
    let dictionary = dictionaries.find((t) => t.getLng() == lng);
    if (!dictionary) {
      this.log.missingLng(this, namespace.name, lng);
      // Trying fallback to default lng
      const tryLng = this.i18nOptions.defaultLng || lng;
      dictionary = dictionaries.find((t) => t.getLng() == tryLng);
    }
    if (!dictionary) {
      throw new Error(`Translation not found for ${namespace.name}.${lng}`);
    }
    return dictionary;
  }

  getMethod<T extends Type<Dictionary>, K extends keyof Omit<T['prototype'], 'lng'>>(
    namespace: T,
    methodName: K,
    lng?: ISO639
  ) {
    const dictionary = this.getDictionary(namespace, lng);
    return dictionary[methodName].bind(dictionary) as T['prototype'][K];
  }

  translate<T extends Type<Dictionary>, K extends keyof Omit<T['prototype'], 'lng'>>(
    namespace: T,
    methodName: K,
    lng?: ISO639,
    ...args: Parameters<T['prototype'][K]>
  ) {
    const method = this.getMethod(namespace, methodName, lng);
    return method(...args);
  }

  /**
   * Setter for a language in this service instance.
   */
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
    const lng = this.req.queryParams[this.i18nOptions.lngQueryParam || 'lng'];
    return lng || this.i18nOptions.defaultLng;
  }
}
