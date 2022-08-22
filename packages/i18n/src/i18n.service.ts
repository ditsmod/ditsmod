import { Req } from '@ditsmod/core';
import { Injectable, Injector, Type } from '@ts-stack/di';

import { ISO639 } from './types/iso-639';
import { I18nOptions, I18nDictionary } from './types/mix';

@Injectable()
export class I18nService {
  constructor(private injector: Injector, private req: Req, private i18nOptions: I18nOptions) {}

  getAllDictionaries<T extends Type<I18nDictionary>>(namespace: T) {
    return this.injector.get(namespace, []) as T['prototype'][];
  }

  getDictionary<T extends Type<I18nDictionary>>(namespace: T, lng?: ISO639) {
    const dictionaries = this.getAllDictionaries(namespace);
    lng = lng || this.getLng();
    const dictionary = dictionaries.slice().reverse().find((t) => t.lng == lng); // Find last element.
    if (!dictionary) {
      throw new Error(`Translation not found for ${namespace.name}.${lng}`);
    }
    return dictionary;
  }

  getMethod<T extends Type<I18nDictionary>, K extends keyof Omit<T['prototype'], 'lng'>>(namespace: T, methodName: K, lng?: ISO639) {
    const dictionary = this.getDictionary(namespace, lng);
    return dictionary[methodName].bind(dictionary) as T['prototype'][K];
  }

  translate<T extends Type<I18nDictionary>, K extends keyof Omit<T['prototype'], 'lng'>>(namespace: T, methodName: K, lng?: ISO639, ...args: Parameters<T['prototype'][K]>) {
    const method = this.getMethod(namespace, methodName, lng);
    return method(...args);
  }

  getLng() {
    const { lng } = this.req.queryParams;
    return lng || this.i18nOptions.defaultLng;
  }
}
