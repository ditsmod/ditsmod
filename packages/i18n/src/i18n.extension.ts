import { Extension, ExtensionsManager, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { Inject, Injectable, Optional, Type } from '@ts-stack/di';

import { I18nLogMediator } from './i18n-log-mediator';
import { Dictionary, I18N_TRANSLATIONS, Translations } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    private extensionsManager: ExtensionsManager,
    @Optional() @Inject(I18N_TRANSLATIONS) private translations?: Translations[],
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const { moduleName } = this.extensionsManager;
    if (moduleName == 'I18nModule') {
      return;
    }

    if (!this.translations?.length) {
      this.log.translationNotFound(this);
      this.#inited = true;
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    for (const translation of this.translations) {
      for (const dictionariesGroup of translation.current || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token

        const allLngs = dictionariesGroup.map((d) => d.prototype.getLng());
        const allMethods = Object.getOwnPropertyNames(token.prototype).filter(p => p != 'constructor' && p != 'getLng').slice(0, 3);
        this.log.foundLngs(this, token.name, allLngs, allMethods);

        for (const dict of dictionariesGroup) {
          if (token !== dict) {
            this.logMissingMethods(token, dict);
          }
          for (const metadataPerMod2 of aMetadataPerMod2) {
            const { providersPerMod } = metadataPerMod2;
            providersPerMod.push({ provide: token, useClass: dict, multi: true });
          }
        }
      }
      for (const dictionariesGroup of translation.imported || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token

        /**
         * If the dictionariesGroup contains an overrided dictionary,
         * then the token is not passed to DI as provider.
         */
        let group: Type<Dictionary>[] = dictionariesGroup.slice(1);
        const lngList = group.map((d) => d.prototype.getLng());
        if (!lngList.includes(token.prototype.getLng())) {
          group = dictionariesGroup;
        }

        const allLngs = group.map((d) => d.prototype.getLng());
        const allMethods = Object.getOwnPropertyNames(token.prototype).filter(p => p != 'constructor' && p != 'getLng').slice(0, 5);
        this.log.overridedLngs(this, token.name, allLngs, allMethods);

        for (const dict of group) {
          if (token !== dict) {
            this.logMissingMethods(token, dict);
          }
          for (const metadataPerMod2 of aMetadataPerMod2) {
            const { providersPerMod } = metadataPerMod2;
            providersPerMod.push({ provide: token, useClass: dict, multi: true });
          }
        }
      }
    }

    this.#inited = true;
  }

  protected logMissingMethods(base: Type<Dictionary>, extended: Type<Dictionary>) {
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
