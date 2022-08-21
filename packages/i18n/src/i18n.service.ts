import { Inject, Injectable, Injector, Type } from '@ts-stack/di';
import { ISO639 } from './types/iso-639';

import { I18nOptions, I18nTranslation } from './types/mix';

@Injectable()
export class I18nService {
  constructor(@Inject(I18nOptions) private i18n: any, private injector: Injector) {}

  getAllDictionaries<T extends Type<I18nTranslation>>(namespace: T) {
    return this.injector.get(namespace as any) as T['prototype'][];
  }

  getDictionary<T extends Type<I18nTranslation>>(namespace: T, lng: ISO639) {
    const dictionaries = this.getAllDictionaries(namespace);
    const dictionary = dictionaries.find(t => t.lng == lng);
    if (!dictionary) {
      throw new Error(`For ${namespace.constructor.name} lng not found: ${lng}`);
    }
    return dictionary;
  }

  getMethod<T extends Type<I18nTranslation>, K extends keyof Omit<T['prototype'], 'lng'>>(namespace: T, lng: ISO639, methodName: K) {
    const dictionary = this.getDictionary(namespace, lng);
    return dictionary[methodName].bind(dictionary) as (...args: Parameters<T['prototype'][K]>) => string;
  }

  translate<T extends Type<I18nTranslation>, K extends keyof Omit<T['prototype'], 'lng'>>(namespace: T, lng: ISO639, methodName: K, ...args: Parameters<T['prototype'][K]>) {
    const fn = this.getMethod(namespace, lng, methodName);
    return fn(...args);
  }
}
