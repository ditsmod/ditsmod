import { Providers } from '@ditsmod/core';
import { Type } from '@ts-stack/di';

import { Dictionary, DictGroup, Translations, I18N_TRANSLATIONS, I18nOptions } from './types/mix';

export function getDictGroup<T extends Type<Dictionary>>(base: T, ...dicts: T[]): DictGroup {
  return [base, ...dicts];
}

export class I18nProviders extends Providers {
  /**
   * Stability: 1 - Experimental.
   *
   * @param self Here expect `this` variable.
   *
   * @todo Investigate why an object with the name of the module is passed as a key to "self" parameter.
   */
  getI18nProviders(self: any, translations: Translations, i18nOptions = new I18nOptions()) {
    translations.moduleName = translations.moduleName || Object.keys(self)[0];
    this.useAnyValue(I18N_TRANSLATIONS, translations, true).useValue(I18nOptions, i18nOptions);
    
    return this;
  }
}
