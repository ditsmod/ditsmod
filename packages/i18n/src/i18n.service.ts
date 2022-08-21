import { Inject, Injectable, Injector, Type } from '@ts-stack/di';

import { I18nOptions, I18nTranslation } from './types/mix';

@Injectable()
export class I18nService {
  constructor(@Inject(I18nOptions) private i18n: any, private injector: Injector) {}

  t<T extends Type<I18nTranslation>, M extends keyof T['prototype']>(source: T, lng: string, methodName: M, ...args: Parameters<T['prototype'][M]>) {
    const translations = this.injector.get(source as any) as T['prototype'][];
    const tranlation = translations.find(t => t.lng == lng);
    if (!tranlation) {
      console.log(`For ${source.constructor.name} lng not found: ${lng}`);
      return;
    }
    return tranlation[methodName](...args);
  }
}
