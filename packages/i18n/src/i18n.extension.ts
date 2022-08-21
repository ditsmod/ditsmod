import { Extension, ExtensionsManager, MetadataPerMod1, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { Inject, Injectable, Optional } from '@ts-stack/di';
import { I18nLogMediator } from './i18n-log-mediator';

import { I18N_TRANSLATIONS, TranslationTuple } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    @Optional() @Inject(I18N_TRANSLATIONS) private translations: TranslationTuple[][] = [],
    private extensionsManager: ExtensionsManager
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    for (const metadataPerMod2 of aMetadataPerMod2) {
      const { moduleName, providersPerMod } = metadataPerMod2;
      this.translations.forEach((translation) => {
        for (const tuple of translation) {
          const base = tuple[0];
          if (!base) {
            break;
          }
          providersPerMod.push({ provide: base, useClass: base, multi: true });
          tuple.slice(1).forEach((t) => {
            providersPerMod.push({ provide: base, useClass: t, multi: true });
          });
        }
      });
    }

    this.#inited = true;
  }
}
