import { Providers } from '@ditsmod/core';
import { Type } from '@ts-stack/di';

import { Dictionary, DictGroup, Translations, I18N_TRANSLATIONS, I18nOptions } from './types/mix';

export function getDictGroup<T extends Type<Dictionary>>(base: T, ...dicts: T[]): DictGroup {
  return [base, ...dicts];
}

export class I18nProviders extends Providers {
  /**
   * Helper that adds providers in a type safe way.
   */
  i18n(translations: Translations, i18nOptions = new I18nOptions()) {
    this
      .useAnyValue(I18N_TRANSLATIONS, translations, true)
      .useValue(I18nOptions, i18nOptions);
    
    return this;
  }
}
