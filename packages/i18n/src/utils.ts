import { ServiceProvider } from '@ditsmod/core';
import { Type } from '@ts-stack/di';

import { Dictionary, DictGroup, Translations, I18N_TRANSLATIONS, I18nOptions } from './types/mix';

export function getDictGroup<T extends Type<Dictionary>>(base: T, ...dicts: T[]): DictGroup {
  return [base, ...dicts];
}

export function getI18nProviders(translations: Translations, i18nOptions = new I18nOptions()): ServiceProvider[] {
  return [
    { provide: I18N_TRANSLATIONS, useValue: translations, multi: true },
    { provide: I18nOptions, useValue: i18nOptions },
  ];
}
