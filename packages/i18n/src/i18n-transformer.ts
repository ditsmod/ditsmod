import { ServiceProvider } from '@ditsmod/core';
import { injectable, Class } from '@ditsmod/core';

import { I18nLogMediator } from './i18n-log-mediator.js';
import { Dictionary, Translations } from './types/mix.js';

/**
 * Transforms `Translations[]` to `ServiceProvider[]`.
 */
@injectable()
export class I18nTransformer {
  constructor(private log: I18nLogMediator) {}

  getProviders(translations: Translations[]) {
    const providers: ServiceProvider[] = [];

    if (!translations?.length) {
      this.log.translationNotFound(this);
      return providers;
    }
    for (const translation of translations) {
      for (const dictionariesGroup of translation.imported || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token
        const group = dictionariesGroup.slice(1);
        providers.push(...this.getCurrentOrImportedProviders(token, group));
        const allLngs = group.map((d) => d.prototype.getLng());
        this.log.overridedLngs(this, token.name, allLngs);
      }
      for (const dictionariesGroup of translation.current || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token
        providers.push(...this.getCurrentOrImportedProviders(token, dictionariesGroup));
        const allLngs = dictionariesGroup.map((d) => d.prototype.getLng());
        this.log.foundLngs(this, token.name, allLngs);
      }
    }

    return providers;
  }

  protected getCurrentOrImportedProviders(token: Class<Dictionary>, group: Class<Dictionary>[]) {
    const providers: ServiceProvider[] = [];
    for (const dict of group) {
      if (token !== dict) {
        this.logMissingMethodsIfExists(token, dict);
      }
      providers.push({ token: token, useClass: dict, multi: true });
    }
    return providers;
  }

  protected logMissingMethodsIfExists(base: Class<Dictionary>, extended: Class<Dictionary>) {
    const baseMethods = Object.getOwnPropertyNames(base.prototype);
    const overridedMethods = Object.getOwnPropertyNames(extended.prototype);
    const missingMethods: string[] = [];
    baseMethods.forEach((b) => {
      if (!overridedMethods.includes(b)) {
        missingMethods.push(b);
      }
    });
    if (missingMethods.length) {
      this.log.missingMethods(this, extended.name, missingMethods);
    }
  }
}
