import { ServiceProvider } from '@ditsmod/core';
import { Type } from '@ts-stack/di';

import { Dictionary, DictGroup, Translations, I18N_TRANSLATIONS, I18nOptions } from './types/mix';

export function getDictGroup<T extends Type<Dictionary>>(base: T, ...dicts: T[]): DictGroup {
  return [base, ...dicts];
}

/**
 * Stability: 1 - Experimental.
 *
 * @todo Investigate why an object with the name of the module is passed as a key to "self" parameter.
 */
export function getI18nProviders(
  self: Type<any>,
  translations: Translations,
  i18nOptions = new I18nOptions()
): ServiceProvider[] {
  translations.moduleName = translations.moduleName || Object.keys(self)[0];
  return [
    { provide: I18N_TRANSLATIONS, useValue: translations, multi: true },
    { provide: I18nOptions, useValue: i18nOptions },
  ];
}
