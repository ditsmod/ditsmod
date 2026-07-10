import type { Class } from '@ditsmod/core';
import { ProviderBuilder } from '@ditsmod/core';
import type { Dictionary, DictGroup, Translations} from './types/mix.js';
import { I18N_TRANSLATIONS, I18nOptions } from './types/mix.js';

export function getDictGroup<T extends Class<Dictionary>>(base: T, ...dicts: T[]): DictGroup {
  return [base, ...dicts];
}

export class I18nProviders extends ProviderBuilder {
  /**
   * Helper that adds providers in a type safe way.
   */
  i18n(translations: Translations, i18nOptions?: I18nOptions) {
    if (this.true) {
      this.useValue<Translations>(I18N_TRANSLATIONS, translations, true);

      if (i18nOptions) {
        this.useValue(I18nOptions, i18nOptions);
      }
    }

    return this.self;
  }
}
