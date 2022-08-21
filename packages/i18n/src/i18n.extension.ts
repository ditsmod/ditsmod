import { Extension, ExtensionsManager, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { Inject, Injectable, Optional, Type } from '@ts-stack/di';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nTranslation, I18N_TRANSLATIONS, TranslationGroup } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    @Optional() @Inject(I18N_TRANSLATIONS) private translations: TranslationGroup[][] = [],
    private extensionsManager: ExtensionsManager
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { moduleName, providersPerMod } = metadataPerMod2;
      if (moduleName == 'I18nModule') {
        continue;
      }
      this.translations.forEach((translation) => {
        for (const group of translation) {
          const token = group[0]; // First class uses as group's token
          if (!token) {
            break;
          }

          group.forEach((t) => {
            if (token !== t) {
              this.logMissingMethods(token, t);
            }
            providersPerMod.push({ provide: token, useClass: t, multi: true });
          });
        }
      });
    }

    this.#inited = true;
  }

  logMissingMethods(base: Type<I18nTranslation>, extended: Type<I18nTranslation>) {
    const methodsBase = Object.getOwnPropertyNames(base.prototype).filter((name) => name != 'constructor');
    const methodsExtended = Object.getOwnPropertyNames(extended.prototype).filter((name) => name != 'constructor');
    const missingMethods: string[] = [];
    methodsBase.forEach((b) => {
      if (!methodsExtended.includes(b)) {
        missingMethods.push(b);
      }
    });
    if (missingMethods.length) {
      this.log.missingMethods(this, extended.name, missingMethods);
    }
  }
}
